const axios = require("axios");
const moment = require("moment");

const database = require("../config/database");
const helper = require("../helpers");

require("dotenv").config();

module.exports = {
  // NOTE upload download
  uploadDownload: async (req, res) => {
    try {
      let data = [];

      const today = moment().format("YYYY-MM-DD");

      const startLog = await database.query(`
        SELECT * FROM microtic_logs WHERE router = '${req.params.uuid}' AND  created_at::date = '${today}' ORDER BY id ASC LIMIT 1
      `);

      if (startLog[0].length == 0) {
        return helper.response(res, 200, "No data", data);
      }

      const finalLog = await database.query(`
        SELECT * FROM microtic_logs WHERE router = '${req.params.uuid}' AND  created_at::date = '${today}' ORDER BY id DESC LIMIT 1
      `);

      const startOrderNumber = startLog[0][0].order_number;
      const finalOrderNumber = finalLog[0][0].order_number;

      const log = await database.query(`
          SELECT * FROM microtic_logs WHERE router = '${req.params.uuid}' AND order_number = ${finalOrderNumber} ORDER BY rx_byte desc
      `);

      if (finalOrderNumber == startOrderNumber) {
        log[0].map((t) => {
          data.push({
            router: t.router,
            name: t.name,
            rx_byte: t.rx_byte,
            tx_byte: t.tx_byte,
          });
        });
      } else {
        for (let i = 0; i < log[0].length; i++) {
          const startData = await database.query(`
            SELECT * FROM microtic_logs WHERE router = '${req.params.uuid}' AND order_number = ${startOrderNumber} AND name = '${log[0][i].mac_address}' LIMIT 1
            `);

          if (startData[0].length == 0) {
            data.push({
              router: log[0][i].router,
              name: log[0][i].name,
              rx_byte: log[0][i].rx_byte,
              tx_byte: log[0][i].tx_byte,
            });
          } else {
            data.push({
              router: log[0][i].router,
              name: log[0][i].name,
              rx_byte: log[0][i].rx_byte - startData[0][0].rx_byte,
              tx_byte: log[0][i].tx_byte - startData[0][0].tx_byte,
            });
          }
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

  // NOTE rekap upload download hari ini
  todayUploadDownloadRecap: async (req, res) => {
    try {
      const router = req.params.uuid;

      const today = moment().format("YYYY-MM-DD");

      let logs = await database.query(`
        SELECT * FROM microtic_logs WHERE created_at::date = '${today}' AND router = '${router}' 
      `);

      if (logs[0].length == 0) {
        return helper.response(res, 400, "Data tidak ditemukan");
      }

      let orders = [];

      logs[0].forEach((l) => {
        if (orders.length == 0) {
          orders.push(l.order_number);
        } else {
          if (orders.includes(l.order_number)) {
          } else {
            orders.push(l.order_number);
          }
        }
      });

      const earlylogs = await database.query(`
        SELECT * FROM microtic_logs WHERE created_at::date = '${today}' AND order_number = ${orders[0]}
      `);

      const latestLog = await database.query(`
        SELECT * FROM microtic_logs WHERE created_at::date = '${today}' AND order_number = ${
        orders[orders.length - 1]
      }
      `);

      let data = [];

      latestLog[0].forEach((log, i) => {
        data.push({
          router: log.router,
          name: log.name,
          rx_byte:
            orders.length == 1
              ? log.rx_byte
              : log.rx_byte - earlylogs[0][i].rx_byte,
          tx_byte:
            orders.length == 1
              ? log.tx_byte
              : log.tx_byte - earlylogs[0][i].tx_byte,
        });
      });

      data.sort((a, b) => (parseInt(a.rx_byte) < parseInt(b.rx_byte) ? 1 : -1));

      return helper.response(
        res,
        200,
        "Rekapan monitor upload download hari ini",
        data
      );
    } catch (error) {
      return helper.response(res, 400, "Error : " + error, error);
    }
  },

  // NOTE rekap upload download 2 tanggal
  uploadDownloadRecap: async (req, res) => {
    try {
      let { router, from_date, to_date, name } = req.body;

      from_date = moment(from_date).format("YYYY-MM-DD");
      to_date = moment(to_date).format("YYYY-MM-DD");

      let logs = await database.query(`
        SELECT * FROM microtic_logs WHERE created_at::date <= '${to_date}'::date
        AND created_at::date >= '${from_date}'::date AND router = '${router}' AND name = '${name}' ORDER BY order_number asc
      `);

      if (logs[0].length == 0) {
        return helper.response(res, 400, "Data tidak ditemukan");
      }

      let data = [];

      let dates = [];

      logs[0].forEach((l) => {
        if (dates.length == 0) {
          dates.push(moment(l.created_at).format("YYYY-MM-DD"));
        } else {
          if (dates.includes(moment(l.created_at).format("YYYY-MM-DD"))) {
          } else {
            dates.push(moment(l.created_at).format("YYYY-MM-DD"));
          }
        }
      });

      if (dates.length == 1) {
        // let orders = [];

        // logs[0].forEach((l) => {
        //   if (orders.length == 0) {
        //     orders.push(l.order_number);
        //   } else {
        //     if (orders.includes(l.order_number)) {
        //     } else {
        //       orders.push(l.order_number);
        //     }
        //   }
        // });

        // const earlylogs = await database.query(`
        // SELECT * FROM microtic_logs WHERE created_at::date = '${dates[0]}' AND order_number = ${orders[0]} AND router = '${router}' AND name = '${name}'
        // `);

        // const latestLog = await database.query(`
        // SELECT * FROM microtic_logs WHERE created_at::date = '${
        //   dates[0]
        // }' AND order_number = ${
        //   orders[orders.length - 1]
        // } AND router = '${router}' AND name = '${name}'
        // `);

        // latestLog[0].forEach((log, i) => {
        //   data.push({
        //     date: moment(log.created_at).format("YYYY-MM-DD"),
        //     router: log.router,
        //     name: log.name,
        //     rx_byte:
        //       orders.length == 1
        //         ? log.rx_byte
        //         : log.rx_byte - earlylogs[0][i].rx_byte,
        //     tx_byte:
        //       orders.length == 1
        //         ? log.tx_byte
        //         : log.tx_byte - earlylogs[0][i].tx_byte,
        //   });
        // });
        const log = await database.query(`
            SELECT * FROM microtic_logs WHERE created_at::date = '${dates[0]}'::date AND name = '${name}' AND router = '${router}'
           ORDER BY rx_byte DESC LIMIT 1
          `);

        data.push({
          date: moment(log[0][0].created_at).format("YYYY-MM-DD"),
          router: log[0][0].router,
          name: log[0][0].name,
          rx_byte: log[0][0].rx_byte,
          tx_byte: log[0][0].tx_byte,
        });
      } else {
        for (let h = 0; h < dates.length; h++) {
          // let orders = [];

          // logs = await database.query(`
          //   SELECT * FROM microtic_logs WHERE created_at::date = '${dates[h]}'::date AND name = '${name}'
          //    ORDER BY order_number asc
          // `);

          // logs[0].forEach((l) => {
          //   if (orders.length == 0) {
          //     orders.push(l.order_number);
          //   } else {
          //     if (orders.includes(l.order_number)) {
          //     } else {
          //       orders.push(l.order_number);
          //     }
          //   }
          // });

          const log = await database.query(`
            SELECT * FROM microtic_logs WHERE created_at::date = '${dates[h]}'::date AND name = '${name}' AND router = '${router}'
           ORDER BY rx_byte DESC LIMIT 1
          `);

          data.push({
            date: moment(log[0][0].created_at).format("YYYY-MM-DD"),
            router: log[0][0].router,
            name: log[0][0].name,
            rx_byte: log[0][0].rx_byte,
            tx_byte: log[0][0].tx_byte,
          });
          // const earlylogs = await database.query(`
          //   SELECT * FROM microtic_logs WHERE created_at::date = '${dates[h]}' AND order_number = ${orders[0]} AND router = '${router}' AND name = '${name}'
          // `);

          // const latestLog = await database.query(`
          //   SELECT * FROM microtic_logs WHERE created_at::date = '${
          //     dates[h]
          //   }' AND order_number = ${
          //   orders[orders.length - 1]
          // } AND router = '${router}' AND name = '${name}'
          // `);

          // latestLog[0].forEach((log, i) => {
          //   data.push({
          //     date: moment(log.created_at).format("YYYY-MM-DD"),
          //     router: log.router,
          //     name: log.name,
          //     rx_byte:
          //       orders.length == 1
          //         ? log.rx_byte
          //         : log.rx_byte - earlylogs[0][i].rx_byte,
          //     tx_byte:
          //       orders.length == 1
          //         ? log.tx_byte
          //         : log.tx_byte - earlylogs[0][i].tx_byte,
          //   });
          // });
        }
      }

      return helper.response(
        res,
        200,
        `Rekapan monitor upload download tanggal ${from_date} -  ${to_date}`,
        data
      );
    } catch (error) {
      return helper.response(res, 400, "Error : " + error, error);
    }
  },
};
