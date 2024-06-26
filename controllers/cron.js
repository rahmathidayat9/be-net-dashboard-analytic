const axios = require("axios");
const moment = require("moment");

const database = require("../config/database");
const helper = require("../helpers");

module.exports = {
  top_host_name: async (req, res) => {
    try {
      const today = moment().format("YYYY-MM-DD");

      let routers = await database.query(`
         SELECT * FROM routers WHERE deleted_at IS NULL
        `);

      if (routers[0].length > 0) {
        routers = routers[0];

        for (let i = 0; i < routers.length; i++) {
          const url = `${process.env.MICROTIC_API_ENV}top-host-name/${routers[i].id}`;

          axios
            .get(url, {
              headers: {
                "Content-Type": "application/json",
              },
            })
            .then(async (response) => {
              const data = response.data;

              for (let j = 0; j < data.length; j++) {
                const log = await database.query(`
                    SELECT * FROM top_host_names WHERE identifier = '${data[j].id}'
                  `);

                if (log[0].length == 0) {
                  await database.query(
                    `
                        INSERT INTO top_host_names(identifier, bytes_down, date, host_name, router, created_at) VALUES(
                            '${data[j].id}',
                            '${data[j].bytes_down}',
                            '${today}',
                            '${data[j].name}',
                            '${routers[i].id}',
                            '${await helper.getFormatedTime("datetime")}'
                        ) RETURNING *
                      `
                  );
                }
              }
            })
            .catch((error) => {
              console.error("Error fetching data:", error);
            });
        }
      }

      return res.json({ status: true });
    } catch (error) {
      return res.json({ error });
    }
  },
  top_sites: async (req, res) => {
    try {
      const today = moment().format("YYYY-MM-DD");

      let routers = await database.query(`
            SELECT * FROM routers WHERE deleted_at IS NULL
        `);

      if (routers[0].length > 0) {
        routers = routers[0];

        for (let i = 0; i < routers.length; i++) {
          const url = `${process.env.MICROTIC_API_ENV}top-sites/${routers[i].id}`;

          axios
            .get(url, {
              headers: {
                "Content-Type": "application/json",
              },
            })
            .then(async (response) => {
              const data = response.data;

              for (let j = 0; j < data.length; j++) {
                const log = await database.query(`
                SELECT * FROM top_sites WHERE identifier = '${data[j].id}'
              `);

                if (log[0].length == 0) {
                  await database.query(
                    `
                    INSERT INTO top_sites(identifier, date, name, router, activity, created_at) VALUES(
                        '${data[j].id}',
                        '${today}',
                        '${data[j].name}',
                        '${routers[i].id}',
                        '${data[j].activity}',
                        '${await helper.getFormatedTime("datetime")}'
                    ) RETURNING *
                  `
                  );
                }
              }
            })
            .catch((error) => {
              console.error("Error fetching data:", error);
            });
        }
      }

      return res.json({ status: true });
    } catch (error) {
      return res.json({ error });
    }
  },
  top_interface: async (req, res) => {
    try {
      const today = moment().format("YYYY-MM-DD");

      let routers = await database.query(`
        SELECT * FROM routers WHERE deleted_at IS NULL
      `);

      if (routers[0].length > 0) {
        routers = routers[0];

        for (let i = 0; i < routers.length; i++) {
          const url = `${process.env.MICROTIC_API_ENV}interfaces/${routers[i].id}`;

          axios
            .get(url, {
              headers: {
                "Content-Type": "application/json",
              },
            })
            .then(async (response) => {
              const data = response.data;

              for (let j = 0; j < data.length; j++) {
                let counter = 1;

                let latest = await database.query(`
                  SELECT * FROM top_interfaces WHERE router = '${routers[i].id}' AND name = '${data[j].name}' AND date = '${today}' ORDER BY counter DESC LIMIT 1
                `);

                if (latest[0].length == 1) {
                  counter = latest[0][0].counter + 1;
                }

                await database.query(
                  `
                    INSERT INTO top_interfaces(router, name, rx_byte, tx_byte, date, counter, created_at) VALUES(
                        '${routers[i].id}',
                        '${data[j].name}',
                        '${data[j]["rx-byte"]}',
                        '${data[j]["tx-byte"]}',
                        '${today}',
                        '${counter}',
                        '${await helper.getFormatedTime("datetime")}'
                    ) RETURNING *
                  `
                );
              }
            })
            .catch((error) => {
              console.error("Error fetching data:", error);
            });
        }
      }

      return res.json({ status: true });
    } catch (error) {
      return res.json({ error });
    }
  },
  system_resource: async (req, res) => {
    try {
      const today = moment().format("YYYY-MM-DD");

      let routers = await database.query(`
        SELECT * FROM routers WHERE deleted_at IS NULL
      `);

      if (routers[0].length > 0) {
        routers = routers[0];

        for (let i = 0; i < routers.length; i++) {
          const url = `${process.env.MICROTIC_API_ENV}system/resources/${routers[i].id}`;

          axios
            .get(url, {
              headers: {
                "Content-Type": "application/json",
              },
            })
            .then(async (response) => {
              const data = response.data;

              await database.query(
                `
              INSERT INTO system_resources(router, cpu, hdd, memory, date, created_at) VALUES(
                  '${routers[i].id}',
                  '${data.cpu}',
                  '${data.hdd}',
                  '${data.memory}',
                  '${today}',
                  '${await helper.getFormatedTime("datetime")}'
              ) RETURNING *
            `
              );
            })
            .catch((error) => {
              console.error("Error fetching data:", error);
            });
        }
      }

      return res.json({ status: true });
    } catch (error) {
      return res.json({ error });
    }
  },
};
