const config = require('config');
const kibana = require('../../services/kibana');

const { sendMail, generateMail } = require('../../services/mail');

const sender = config.get('notifications.sender');

const { appLogger } = require('../../services/logger');

function sendValidateInstitution(receivers) {
  return sendMail({
    from: sender,
    to: receivers,
    subject: 'Votre établissement a été validé',
    ...generateMail('validated-institution'),
  });
}

exports.getInstitutionState = async (ctx) => {
  const { institution } = ctx.state;

  const spaces = await institution.getSpaces();

  const patterns = await Promise.all(
    spaces
      .filter((space) => space && space.id)
      .map((space) => kibana.getIndexPatterns({ spaceId: space.id, perPage: 1000 })),
  );

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = {
    spaces,
    indices: await institution.getIndices(),
    indexPatterns: patterns.reduce((acc, current) => [...acc, ...current], []),
    roles: await institution.checkRoles(),
  };
};

exports.validateInstitution = async (ctx) => {
  const { body = {} } = ctx.request;
  const { value: validated } = body;
  const { institution } = ctx.state;

  let correspondents = await institution.getContacts();
  correspondents = correspondents.map((e) => e.email);

  if (correspondents.length > 0) {
    if (!institution.get('validated') && validated === true) {
      try {
        await sendValidateInstitution(correspondents);
      } catch (err) {
        appLogger.error(`Failed to send validate institution mail: ${err}`);
      }
    }
  }

  institution.setValidation(validated);
  await institution.save();

  ctx.status = 200;
  ctx.body = institution;
};

exports.deleteInstitutionCreator = async (ctx) => {
  const { institution } = ctx.state;

  if (institution.get('creator')) {
    await institution.setCreator(null);
    await institution.save();
  }

  ctx.status = 200;
  ctx.body = institution;
};
