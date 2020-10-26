const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');
const bodyParser = require('koa-bodyparser');

const { requireJwt, requireUser, requireAnyRole } = require('../../services/auth');

const {
  getInstitutions,
  createInstitution,
  deleteInstitutions,
  deleteInstitution,
  validateInstitution,
  getInstitution,
  getSelfInstitution,
  getInstitutionMembers,
  updateInstitution,
  updateMember,
  getSushiData,
  refreshInstitutions,
  refreshInstitution,
} = require('./actions');

router.use(requireJwt, requireUser);

router.get('/', getInstitutions);

router.use(requireAnyRole(['sushi_form_tester', 'admin', 'superuser']));

router.route({
  method: 'GET',
  path: '/self',
  handler: getSelfInstitution,
});
router.route({
  method: 'GET',
  path: '/:institutionId',
  handler: getInstitution,
});

router.route({
  method: 'PUT',
  path: '/:institutionId/validated',
  handler: validateInstitution,
  validate: {
    type: 'json',
    params: {
      institutionId: Joi.string().trim().required(),
    },
    body: {
      value: Joi.boolean().required(),
    },
  },
});

router.route({
  method: 'GET',
  path: '/:institutionId/sushi',
  handler: getSushiData,
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'GET',
  path: '/:institutionId/members',
  handler: getInstitutionMembers,
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'DELETE',
  path: '/:institutionId',
  handler: deleteInstitution,
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
    },
  },
});

router.use(bodyParser());

router.route({
  method: 'POST',
  path: '/delete',
  handler: deleteInstitutions,
  validate: {
    type: 'json',
    body: {
      ids: Joi.array().items(Joi.string().trim()),
    },
  },
});

router.route({
  method: 'PATCH',
  path: '/:institutionId/members/:email',
  handler: updateMember,
  validate: {
    type: 'json',
    params: {
      institutionId: Joi.string().trim().required(),
      email: Joi.string().trim().allow('self').email()
        .required(),
    },
    body: {
      id: Joi.string().trim().guid({ version: ['uuidv4'] }).required(),
      type: Joi.array().items(Joi.string().trim().valid('tech', 'doc')),
      email: Joi.string().trim().required(),
      confirmed: Joi.boolean().required(),
      fullName: Joi.string().trim().required(),
    },
  },
});


router.route({
  method: 'POST',
  path: '/',
  handler: createInstitution,
  validate: {
    type: 'json',
    query: {
      creator: Joi.boolean(),
    },
  },
});

router.route({
  method: 'PUT',
  path: '/:institutionId',
  handler: updateInstitution,
  validate: {
    type: 'json',
    params: {
      institutionId: Joi.string().trim().required(),
    },
  },
});

router.use(requireAnyRole(['admin', 'superuser']));

router.route({
  method: 'POST',
  path: '/:institutionId/_refresh',
  handler: refreshInstitution,
  validate: {
    type: 'json',
    params: {
      institutionId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'POST',
  path: '/_refresh',
  handler: refreshInstitutions,
});

module.exports = router;
