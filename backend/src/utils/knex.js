const knex = require('../knex');
const each = require('promise-each');


const isEmpty = async table => {
  const results = await knex(table).count().first();
  return parseInt(results.count, 10) === 0;
};

/* TODO: use options object */
const upsert = async (tableName, where = [], values, trx) => {
  const rows = await knex(tableName).transacting(trx).where(where);
  if (rows.length > 0) {
    return knex(tableName).transacting(trx).where(where).update(Object.assign(values, {
      updated_at: knex.raw('CURRENT_TIMESTAMP')
    }));
  }
  return knex(tableName).transacting(trx).insert(values);
};

const batchUpsert = async batch => {
  await each(async opts => {
    await upsert(opts.table, opts.where, opts.values, opts.transaction);
  })(batch);
};

module.exports = {
  isEmpty,
  upsert,
  batchUpsert
};
