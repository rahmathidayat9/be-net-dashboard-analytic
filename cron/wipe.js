const database = require("../config/database");

const cron = async () => {
  await database.query(`
        DELETE FROM top_host_names WHERE date < CURRENT_DATE;
    `);

  await database.query(`
        DELETE FROM top_sites WHERE date < CURRENT_DATE;
    `);

  await database.query(`
        DELETE FROM top_interfaces WHERE date < CURRENT_DATE;
    `);

  await database.query(`
        DELETE FROM system_resources WHERE date < CURRENT_DATE;
    `);
};

cron();
