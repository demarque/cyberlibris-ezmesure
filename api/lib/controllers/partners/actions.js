const depositors = require('../../services/depositors');

exports.list = async (ctx) => {
  ctx.type = 'json';
  ctx.body = await depositors.getFromIndex();
};

exports.refresh = async (ctx) => {
  ctx.type = 'json';

  const result = await depositors.update();

  ctx.status = result.errors ? 500 : 200;
  ctx.body = result;
};
