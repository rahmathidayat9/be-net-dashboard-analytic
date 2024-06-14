const moment = require("moment");

const database = require("../config/database");
const helper = require("../helpers");

require("dotenv").config();

module.exports = {
  // NOTE ambil data
  index: async (req, res) => {
    try {
      const router = req.params.router;

      let today =
        req.query.date !== undefined && req.query.date !== ""
          ? moment(req.query.date).format("YYYY-MM-DD")
          : moment().format("YYYY-MM-DD");

      let start_date =
        req.query.start_date !== undefined && req.query.start_date !== ""
          ? moment(req.query.start_date).format("YYYY-MM-DD")
          : null;

      let end_date =
        req.query.end_date !== undefined && req.query.end_date !== ""
          ? moment(req.query.end_date).format("YYYY-MM-DD")
          : null;

      let data = [];

      if (start_date && end_date) {
        today = `${start_date} - ${end_date}`;

        const exists = await database.query(`
            SELECT * FROM top_interfaces WHERE router = '${router}' AND date::date <= '${end_date}'::date
            AND date::date >= '${start_date}'::date ORDER BY id ASC LIMIT 1
          `);

        if (exists[0].length == 0) {
          return helper.response(res, 200, "No data", data);
        }

        let names = [];

        let query = await database.query(`
          SELECT DISTINCT name FROM top_interfaces WHERE date::date <= '${end_date}'::date
            AND date::date >= '${start_date}'::date AND router = '${router}' ORDER BY name ASC
        `);

        for (let i = 0; i < query[0].length; i++) {
          names.push(query[0][i].name);
        }

        for (i = 0; i < names.length; i++) {
          const lowest = await database.query(`
              SELECT * FROM top_interfaces WHERE date::date <= '${end_date}'::date
            AND date::date >= '${start_date}'::date AND router = '${router}' AND name = '${names[i]}' ORDER BY id ASC LIMIT 1
            `);

          const highest = await database.query(`
              SELECT * FROM top_interfaces WHERE date::date <= '${end_date}'::date
            AND date::date >= '${start_date}'::date AND router = '${router}' AND name = '${names[i]}' ORDER BY id DESC LIMIT 1
            `);

          const rx_byte = highest[0][0].rx_byte - lowest[0][0].rx_byte;
          const tx_byte = highest[0][0].tx_byte - lowest[0][0].tx_byte;

          data.push({
            ethernet: names[i],
            rx_byte: helper.formatBytes(rx_byte),
            tx_byte: helper.formatBytes(tx_byte),
          });
        }
      } else {
        const exists = await database.query(`
            SELECT * FROM top_interfaces WHERE date::date = '${today}' AND router = '${router}'
          `);

        if (exists[0].length == 0) {
          return helper.response(res, 200, "No data", data);
        }

        let names = [];

        let query = await database.query(`
          SELECT DISTINCT name FROM top_interfaces WHERE date::date = '${today}' AND router = '${router}' ORDER BY name ASC
        `);

        for (let i = 0; i < query[0].length; i++) {
          names.push(query[0][i].name);
        }

        for (i = 0; i < names.length; i++) {
          const lowest = await database.query(`
            SELECT * FROM top_interfaces WHERE date::date = '${today}' AND router = '${router}' AND name = '${names[i]}' ORDER BY id ASC LIMIT 1
          `);

          const highest = await database.query(`
            SELECT * FROM top_interfaces WHERE date::date = '${today}' AND router = '${router}' AND name = '${names[i]}' ORDER BY id DESC LIMIT 1
          `);

          const rx_byte = highest[0][0].rx_byte - lowest[0][0].rx_byte;
          const tx_byte = highest[0][0].tx_byte - lowest[0][0].tx_byte;

          data.push({
            ethernet: names[i],
            rx_byte: helper.formatBytes(rx_byte),
            tx_byte: helper.formatBytes(tx_byte),
          });
        }
      }

      return helper.response(res, 200, "Data ditemukan", {
        today,
        data,
      });
    } catch (error) {
      return helper.response(res, 400, "Error : " + error, error);
    }
  },
};
