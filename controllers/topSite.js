const moment = require("moment");

const database = require("../config/database");
const helper = require("../helpers");
const { count } = require("./ticket");

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
            SELECT * FROM top_sites WHERE router = '${router}' AND date::date <= '${end_date}'::date
            AND date::date >= '${start_date}'::date ORDER BY id ASC LIMIT 1
          `);

        if (exists[0].length == 0) {
          return helper.response(res, 200, "No data", data);
        }

        let activities = [];

        let query = await database.query(`
          SELECT DISTINCT activity FROM top_sites WHERE date::date <= '${end_date}'::date
            AND date::date >= '${start_date}'::date AND router = '${router}' ORDER BY activity ASC
        `);

        for (let i = 0; i < query[0].length; i++) {
          if (!activities.includes(query[0][i].activity)) {
            activities.push(query[0][i].activity);
          }
        }

        for (i = 0; i < activities.length; i++) {
          query = await database.query(`
                SELECT * FROM top_sites WHERE date::date <= '${end_date}'::date
            AND date::date >= '${start_date}'::date AND router = '${router}' AND activity = '${activities[i]}'
              `);

          let arr = [];

          let names = "";

          for (let j = 0; j < query[0].length; j++) {
            if (!arr.includes(query[0][j].name)) {
              names = names + query[0][j].name + ", ";
            }

            arr.push(query[0][j].name);
          }

          names = names.substring(0, names.length - 2);

          data.push({
            activity: activities[i],
            name: names,
            total: query[0].length,
          });
        }
      } else {
        const exists = await database.query(`
            SELECT * FROM top_sites WHERE date::date = '${today}' AND router = '${router}'
          `);

        if (exists[0].length == 0) {
          return helper.response(res, 200, "No data", data);
        }

        let activities = [];

        let query = await database.query(`
          SELECT DISTINCT activity FROM top_sites WHERE date::date = '${today}' AND router = '${router}' ORDER BY activity ASC
        `);

        for (let i = 0; i < query[0].length; i++) {
          if (!activities.includes(query[0][i].activity)) {
            activities.push(query[0][i].activity);
          }
        }

        for (i = 0; i < activities.length; i++) {
          query = await database.query(`
            SELECT * FROM top_sites WHERE date::date = '${today}' AND router = '${router}' AND activity = '${activities[i]}'
          `);

          let arr = [];

          let names = "";

          for (let j = 0; j < query[0].length; j++) {
            if (!arr.includes(query[0][j].name)) {
              names = names + query[0][j].name + ", ";
            }

            arr.push(query[0][j].name);
          }

          names = names.substring(0, names.length - 2);

          data.push({
            activity: activities[i],
            name: names,
            total: query[0].length,
          });
        }
      }

      data.sort((a, b) => (a.total < b.total ? 1 : -1));

      return helper.response(res, 200, "Data ditemukan", {
        today,
        data,
      });
    } catch (error) {
      console.log(error);
      return helper.response(res, 400, "Error : " + error, error);
    }
  },
  show: async (req, res) => {},
};
