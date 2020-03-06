const config = require('config');
const { CronJob } = require('cron');
const { sendMail, generateMail } = require('./mail');
const elastic = require('./elastic');

const { sender, recipients, cron } = config.get('notifications');
const { fr } = require('date-fns/locale');
const { format, isValid } = require('date-fns');

module.exports = {
  start(appLogger) {
    sendNotifications()
    const job = new CronJob(cron, () => {
      sendNotifications().then(() => {
        appLogger.info('Recent activity successfully broadcasted');
      }).catch((err) => {
        appLogger.error(`Failed to broadcast recent activity : ${err}`);
      });
    });

    if (recipients) {
      job.start();
    } else {
      appLogger.warn('No recipient configured, notifications will be disabled');
    }
  },
};

async function getEzMesureMetrics() {
  const { body: result } = await elastic.search({
    index: '.ezmesure-metrics',
    size: 10000,
    sort: 'datetime:desc',
    body: {
      query: {
        bool: {
          must_not: [
            { exists: { field: 'metadata.broadcasted' } },
          ],
          filter: [
            {
              range: {
                datetime: { gte: 'now-1w' }
              }
            },
            {
              terms: {
                action: [
                  'file/upload',
                  'file/delete',
                  'file/delete-many',
                  'user/register',
                  'indices/insert',
                ]
              }
            }
          ]
        }
      }
    }
  });

  const actions = result && result.hits && result.hits.hits;

  if (actions.length === 0) {
    return {};
  }

  const files = actions
    .filter(a => a._source.action.startsWith('file/'))
    .map(({ _source }) => {
      const metadata = _source.metadata || {};
      const paths = metadata.path || [];
      return {
        ..._source,
        path: Array.isArray(paths) ? paths : [paths],
        datetime: toLocaleDate(_source.datetime)
      };
    });

  const users = await Promise.all(actions
    .filter(a => a._source.action === 'user/register')
    .map(async ({ _source }) => {
      const { username } = _source.metadata || {};
      const elasticUser = username && await elastic.security.findUser({ username });
      return {
        ..._source,
        elasticUser,
        datetime: toLocaleDate(_source.datetime)
      };
    })
  );

  const insertions = actions
    .filter(a => a._source.action === 'indices/insert')
    .map(({ _source }) => ({
      ..._source,
      datetime: toLocaleDate(_source.datetime)
    }));

  return { actions, files, users, insertions };
}

async function getDashboardName(dashboardId, namespace) {
  const { body: data } = await elastic.getSource({
    index: '.kibana',
    id: `${namespace ? `${namespace}:` : ''}dashboard:${dashboardId}`,
  });

  if (data && data.type === 'dashboard') {
    return data.dashboard.title;
  }

  return null;
};

async function getReportingActivity() {
  const { body: result } = await elastic.search({
    index: config.reportingActivityIndex || '.ezreporting-activity',
    size: 10000,
    sort: 'datetime:desc',
    body: {
      query: {
        bool: {
          must_not: [
            { exists: { field: 'metadata.broadcasted' } },
          ],
          filter: [
            {
              range: {
                datetime: { gte: 'now-1w' }
              }
            },
            {
              terms: {
                action: [
                  'reporting/store',
                  'reporting/update',
                  'reporting/delete'
                ]
              }
            }
          ]
        }
      }
    }
  });

  const actions = result && result.hits && result.hits.hits;

  if (actions.length === 0) {
    return {};
  }

  const reportings = await Promise.all(actions
    .map(async ({ _source }) => {
      const { taskId } = _source || {};
      const task = await elastic.search({
        index: config.reportingIndex || '.ezreporting',
        timeout: '30s',
        body: {
          size: 10000,
          query: {
            bool: {
              must: [ { match: { _id: taskId } } ]
            },
          },
        },
      });

      const { body } = task || {};
      const { hits } = body || {};
      const { hits: hitsArray } = hits || {};
      const { _source: taskData } = hitsArray[0] || [];

      if (taskData) {
        taskData.dashboardName = await getDashboardName(taskData.dashboardId, taskData.space);
      }

      return {
        ..._source,
        taskData,
      };
    })
  );

  return { actions, reportings };
}

/**
 * Send a mail containing new files and users
 */
async function sendNotifications() {
  const { actions: ezMesureActions, files, users, insertions } = await getEzMesureMetrics();
  const { actions: reportingActions, reportings } = await getReportingActivity();

  await sendMail({
    from: sender,
    to: recipients,
    subject: '[Admin] Activité ezMESURE',
    ...generateMail('recent-activity', { files, users, insertions, reportings })
  });

  await setBroadcasted(reportingActions);
  return setBroadcasted(ezMesureActions);
}

/**
 * Set metadata.broacasted to the current date for a list of action documents
 * @param {Array<Object>} actions a set of action documents from the metrics index
 */
function setBroadcasted(actions) {
  const bulk = [];
  const now = new Date();

  actions.forEach((action) => {
    bulk.push({ update: { _id: action._id, _type: action._type, _index: action._index } });
    bulk.push({ doc: { metadata: { broadcasted: now } } });
  });

  return elastic.bulk({ body: bulk });
}

/**
 * Change a timestamp into a locale date
 */
function toLocaleDate (timestamp) {
  const date = new Date(timestamp);
  return isValid(date) ? format(date, 'Pp', { locale: fr }) : 'Invalid date';
}
