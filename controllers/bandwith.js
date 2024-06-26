const axios = require("axios");
const moment = require("moment");

const database = require("../config/database");
const helper = require("../helpers");

module.exports = {
  index: async (req, res) => {
    try {
      const activeRouter = await database.query(`
        SELECT * FROM routers WHERE deleted_at IS NULL AND status = 'active'
      `);

      const router = activeRouter[0][0].id;
      const ethernet = activeRouter[0][0].ethernet;

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
            AND date::date >= '${start_date}'::date AND name = '${ethernet}' ORDER BY id ASC LIMIT 1
          `);

        if (exists[0].length == 0) {
          return helper.response(res, 200, "No data", data);
        }

        const lowest = await database.query(`
              SELECT * FROM top_interfaces WHERE date::date <= '${end_date}'::date
            AND date::date >= '${start_date}'::date AND router = '${router}' AND name = '${ethernet}' ORDER BY id ASC LIMIT 1
            `);

        const highest = await database.query(`
              SELECT * FROM top_interfaces WHERE date::date <= '${end_date}'::date
            AND date::date >= '${start_date}'::date AND router = '${router}' AND name = '${ethernet}' ORDER BY id DESC LIMIT 1
            `);

        const rx_byte = highest[0][0].rx_byte - lowest[0][0].rx_byte;
        const tx_byte = highest[0][0].tx_byte - lowest[0][0].tx_byte;

        data = {
          ethernet,
          rx_byte,
          tx_byte,
        };
      } else {
        const exists = await database.query(`
            SELECT * FROM top_interfaces WHERE date::date = '${today}' AND router = '${router}' AND name = '${ethernet}'
          `);

        if (exists[0].length == 0) {
          return helper.response(res, 200, "No data", data);
        }

        const lowest = await database.query(`
            SELECT * FROM top_interfaces WHERE date::date = '${today}' AND router = '${router}' AND name = '${ethernet}' ORDER BY id ASC LIMIT 1
          `);

        const highest = await database.query(`
            SELECT * FROM top_interfaces WHERE date::date = '${today}' AND router = '${router}' AND name = '${ethernet}' ORDER BY id DESC LIMIT 1
          `);

        const rx_byte = highest[0][0].rx_byte - lowest[0][0].rx_byte;
        const tx_byte = highest[0][0].tx_byte - lowest[0][0].tx_byte;

        data = {
          ethernet,
          rx_byte,
          tx_byte,
        };
      }

      return helper.response(res, 200, "Data ditemukan", {
        today,
        data,
      });
    } catch (error) {
      return helper.response(res, 400, "Error : " + error, error);
    }
  },

  getCurrentTxRxIo: async ({ router }) => {
    try {
      let today = moment().format("YYYY-MM-DD");

      const activeRouter = await database.query(`
        SELECT * FROM routers WHERE id = '${router}'
      `);

      const ethernet = activeRouter[0][0].ethernet;

      const lowest = await database.query(`
        SELECT * FROM top_interfaces WHERE date::date = '${today}' AND router = '${router}' AND name = '${ethernet}' ORDER BY id ASC LIMIT 1
        `);

      const highest = await database.query(`
        SELECT * FROM top_interfaces WHERE date::date = '${today}' AND router = '${router}' AND name = '${ethernet}' ORDER BY id DESC LIMIT 1
      `);

      if (lowest[0].length == 0) {
        return {
          ethernet,
          rx_byte: 0,
          tx_byte: 0,
        };
      }

      const rx_byte = highest[0][0].rx_byte - lowest[0][0].rx_byte;
      const tx_byte = highest[0][0].tx_byte - lowest[0][0].tx_byte;

      data = {
        ethernet,
        rx_byte,
        tx_byte,
      };

      return data;
    } catch (errorRes) {
      console.log(errorRes);
      return errorRes;
    }
  },
};
