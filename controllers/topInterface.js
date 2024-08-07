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

          const rx_byte =
            highest[0][0].rx_byte !== lowest[0][0].rx_byte
              ? highest[0][0].rx_byte - lowest[0][0].rx_byte
              : highest[0][0].rx_byte;

          const tx_byte =
            highest[0][0].tx_byte !== lowest[0][0].tx_byte
              ? highest[0][0].tx_byte - lowest[0][0].tx_byte
              : highest[0][0].tx_byte;

          // const rx_packet =
          //   highest[0][0].rx_packet !== lowest[0][0].rx_packet
          //     ? highest[0][0].rx_packet - lowest[0][0].rx_packet
          //     : highest[0][0].rx_packet;

          // const tx_packet =
          //   highest[0][0].tx_packet !== lowest[0][0].tx_packet
          //     ? highest[0][0].tx_packet - lowest[0][0].tx_packet
          //     : highest[0][0].tx_packet;

          // const tx_queue_drop =
          //   highest[0][0].tx_queue_drop !== lowest[0][0].tx_queue_drop
          //     ? highest[0][0].tx_queue_drop - lowest[0][0].tx_queue_drop
          //     : highest[0][0].tx_queue_drop;

          // const fp_rx_byte =
          //   highest[0][0].fp_rx_byte !== lowest[0][0].fp_rx_byte
          //     ? highest[0][0].fp_rx_byte - lowest[0][0].fp_rx_byte
          //     : highest[0][0].fp_rx_byte;

          // const fp_tx_byte =
          //   highest[0][0].fp_tx_byte !== lowest[0][0].fp_tx_byte
          //     ? highest[0][0].fp_tx_byte - lowest[0][0].fp_tx_byte
          //     : highest[0][0].fp_tx_byte;

          // const fp_rx_packet =
          //   highest[0][0].fp_rx_packet !== lowest[0][0].fp_rx_packet
          //     ? highest[0][0].fp_rx_packet - lowest[0][0].fp_rx_packet
          //     : highest[0][0].fp_rx_packet;

          // const fp_tx_packet =
          //   highest[0][0].fp_tx_packet !== lowest[0][0].fp_tx_packet
          //     ? highest[0][0].fp_tx_packet - lowest[0][0].fp_tx_packet
          //     : highest[0][0].fp_tx_packet;

          data.push({
            ethernet: names[i],
            rx_byte,
            tx_byte,
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

          const rx_byte =
            highest[0][0].rx_byte !== lowest[0][0].rx_byte
              ? highest[0][0].rx_byte - lowest[0][0].rx_byte
              : highest[0][0].rx_byte;

          const tx_byte =
            highest[0][0].tx_byte !== lowest[0][0].tx_byte
              ? highest[0][0].tx_byte - lowest[0][0].tx_byte
              : highest[0][0].tx_byte;

          data.push({
            ethernet: names[i],
            rx_byte,
            tx_byte,
          });
        }
      }

      data.sort((a, b) => (parseInt(a.rx_byte) < parseInt(b.rx_byte) ? 1 : -1));

      return helper.response(res, 200, "Data ditemukan", {
        today,
        data,
      });
    } catch (error) {
      return helper.response(res, 400, "Error : " + error, error);
    }
  },
  // NOTE ambil data grafik
  getGraph: async (req, res) => {
    try {
      let router = await database.query(`
        SELECT * FROM routers WHERE deleted_at IS NULL AND status = 'active'
      `);

      if (router[0].length == 0) {
        return helper.response(res, 200, "No active router", data);
      }

      router = router[0][0];

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
      let groupDate = [];

      if (start_date && end_date) {
        start_date = new Date(start_date);
        end_date = new Date(end_date);

        const dates = [];

        for (
          let d = new Date(start_date);
          d <= end_date;
          d.setDate(d.getDate() + 1)
        ) {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0"); // Months are zero-based
          const day = String(d.getDate()).padStart(2, "0");
          const formattedDate = `${year}-${month}-${day}`;

          dates.push(formattedDate);
        }

        for (i = 0; i < dates.length; i++) {
          records = [];

          const exists = await database.query(`
            SELECT * FROM top_interfaces WHERE date::date = '${dates[i]}' AND router = '${router.id}' AND name = '${router.ethernet}' ORDER BY counter ASC
            `);

          if (exists[0].length == 0) {
            groupDate.push({
              date: dates[i],
              data: {
                rx_byte: 0,
                tx_byte: 0,
              },
            });
          } else {
            const lowest = await database.query(`
              SELECT * FROM top_interfaces WHERE date::date = '${dates[i]}'  AND router = '${router.id}'  AND name = '${router.ethernet}' ORDER BY id ASC LIMIT 1
            `);

            const highest = await database.query(`
              SELECT * FROM top_interfaces WHERE date::date = '${dates[i]}'  AND router = '${router.id}'  AND name = '${router.ethernet}' ORDER BY id DESC LIMIT 1
            `);

            let rx_byte = highest[0][0].rx_byte;
            let tx_byte = highest[0][0].tx_byte;

            if (
              highest[0][0].rx_byte !== lowest[0][0].rx_byte &&
              highest[0][0].rx_byte < lowest[0][0].rx_byte
            ) {
              rx_byte = highest[0][0].rx_byte - lowest[0][0].rx_byte;
            }

            if (
              highest[0][0].tx_byte !== lowest[0][0].tx_byte &&
              highest[0][0].tx_byte < lowest[0][0].tx_byte
            ) {
              tx_byte = highest[0][0].tx_byte - lowest[0][0].tx_byte;
            }

            groupDate.push({
              date: dates[i],
              data: {
                rx_byte,
                tx_byte,
              },
            });
          }
        }

        data = groupDate;
      } else {
        const exists = await database.query(`
          SELECT * FROM top_interfaces WHERE date::date = '${today}' AND router = '${router.id}' AND name = '${router.ethernet}' ORDER BY counter ASC
        `);

        for (i = 0; i < exists[0].length; i++) {
          data.push({
            created_at: exists[0][i].created_at,
            rx_byte: exists[0][i].rx_byte,
            tx_byte: exists[0][i].tx_byte,
          });
        }

        // if (exists[0].length == 0) {
        //   data = {
        //     date: today,
        //     data: {
        //       rx_byte: 0,
        //       tx_byte: 0,
        //     },
        //   };
        // } else {
        // const lowest = await database.query(`
        //     SELECT * FROM top_interfaces WHERE date::date = '${today}'  AND router = '${router.id}'  AND name = '${router.ethernet}' ORDER BY id ASC LIMIT 1
        //   `);

        // const highest = await database.query(`
        //     SELECT * FROM top_interfaces WHERE date::date = '${today}'  AND router = '${router.id}'  AND name = '${router.ethernet}' ORDER BY id DESC LIMIT 1
        //   `);

        // let rx_byte = highest[0][0].rx_byte;
        // let tx_byte = highest[0][0].tx_byte;

        // if (
        //   highest[0][0].rx_byte !== lowest[0][0].rx_byte &&
        //   highest[0][0].rx_byte < lowest[0][0].rx_byte
        // ) {
        //   rx_byte = highest[0][0].rx_byte - lowest[0][0].rx_byte;
        // }

        // if (
        //   highest[0][0].tx_byte !== lowest[0][0].tx_byte &&
        //   highest[0][0].tx_byte < lowest[0][0].tx_byte
        // ) {
        //   tx_byte = highest[0][0].tx_byte - lowest[0][0].tx_byte;
        // }

        // data = {
        //   date: today,
        //   data: {
        //     rx_byte,
        //     tx_byte,
        //   },
        // };
        // }
      }

      return helper.response(res, 200, "Data ditemukan", data);
    } catch (error) {
      console.log(error);
      return helper.response(res, 400, "Error : " + error, error);
    }
  },
  // NOTE ambil data grafik io
  getGraphTopInterfaceIo: async (req, res) => {
    try {
      let router = await database.query(`
        SELECT * FROM routers WHERE deleted_at IS NULL AND status = 'active'
      `);

      if (router[0].length == 0) {
        return [];
      }

      router = router[0][0];

      let data = [];

      const exists = await database.query(`
        SELECT * FROM top_interfaces WHERE date::date = CURRENT_DATE AND router = '${router.id}' AND name = '${router.ethernet}' ORDER BY counter ASC
      `);

      for (i = 0; i < exists[0].length; i++) {
        data.push({
          created_at: exists[0][i].created_at,
          rx_byte: exists[0][i].rx_byte,
          tx_byte: exists[0][i].tx_byte,
        });
      }

      return data;
    } catch (error) {
      return error;
    }
  },

  getAllGraphTopInterfaceIo: async (req, res) => {
    try {
      let router = await database.query(`
        SELECT * FROM routers WHERE deleted_at IS NULL AND status = 'active'
      `);

      let data = [];

      if (router[0].length == 0) {
        return helper.response(res, 200, "No active router", data);
      }

      let ethernet = [];

      const exists = await database.query(`
        SELECT * FROM top_interfaces WHERE date::date = CURRENT_DATE AND router = '${router[0][0].id}' ORDER BY name
      `);

      exists[0].map((e) => {
        if (!ethernet.includes(e.name)) {
          ethernet.push(e.name);
        }
      });

      for (let h = 0; h < ethernet.length; h++) {
        let today = moment().format("YYYY-MM-DD");

        const exists = await database.query(`
          SELECT * FROM top_interfaces WHERE date::date = '${today}' AND router = '${router[0][0].id}' AND name = '${ethernet[h]}' ORDER BY counter ASC
        `);

        let graph = [];

        for (i = 0; i < exists[0].length; i++) {
          graph.push({
            created_at: exists[0][i].created_at,
            rx_byte: exists[0][i].rx_byte,
            tx_byte: exists[0][i].tx_byte,
          });
        }

        data.push({
          name: ethernet[h],
          graph,
        });
      }

      return data;
    } catch (error) {
      return error;
    }
  },
};
