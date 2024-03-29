const moment = require("moment");

const database = require("../config/database");
const helper = require("../helpers");

require("dotenv").config();

module.exports = {
  // NOTE ambil data
  index: async (req, res) => {
    try {
      let data = [];

      const today = moment().format("YYYY-MM-DD");

      const startLog = await database.query(`
        SELECT * FROM top_host_names WHERE router = '${req.params.uuid}' AND  created_at::date = '${today}' ORDER BY id ASC LIMIT 1
      `);

      if (startLog[0].length == 0) {
        return helper.response(res, 200, "No data", data);
      }

      const finalLog = await database.query(`
        SELECT * FROM top_host_names WHERE router = '${req.params.uuid}' AND  created_at::date = '${today}' ORDER BY id DESC LIMIT 1
      `);

      const startOrderNumber = startLog[0][0].order_number;
      const finalOrderNumber = finalLog[0][0].order_number;

      const topHostName = await database.query(`
          SELECT * FROM top_host_names WHERE router = '${req.params.uuid}' AND order_number = ${finalOrderNumber} ORDER BY bytes_down desc LIMIT 5
      `);

      if (finalOrderNumber == startOrderNumber) {
        topHostName[0].map((t) => {
          data.push({
            router: t.router,
            name: t.name,
            mac_address: t.mac_address,
            bytes_down: t.bytes_down,
          });
        });
      } else {
        for (let i = 0; i < topHostName[0].length; i++) {
          const startData = await database.query(`
            SELECT * FROM top_host_names WHERE router = '${req.params.uuid}' AND order_number = ${startOrderNumber} AND mac_address = '${topHostName[0][i].mac_address}' LIMIT 1
            `);

          if (startData[0].length == 0) {
            data.push({
              router: topHostName[0][i].router,
              name: topHostName[0][i].name,
              mac_address: topHostName[0][i].mac_address,
              bytes_down: topHostName[0][i].bytes_down,
            });
          } else {
            data.push({
              router: topHostName[0][i].router,
              name: topHostName[0][i].name,
              mac_address: topHostName[0][i].mac_address,
              bytes_down:
                topHostName[0][i].bytes_down - startData[0][0].bytes_down,
            });
          }
        }
      }

      data.sort((a, b) => (a.bytes_down < b.bytes_down ? 1 : -1));

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
      let { router, from_date, to_date } = req.body;

      from_date = moment(from_date).format("YYYY-MM-DD");
      to_date = moment(to_date).format("YYYY-MM-DD");

      let logs = await database.query(`
        SELECT * FROM microtic_logs WHERE created_at::date <= '${to_date}'::date
        AND created_at::date >= '${from_date}'::date AND router = '${router}' ORDER BY order_number asc
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
        SELECT * FROM microtic_logs WHERE created_at::date = '${dates[0]}' AND order_number = ${orders[0]} AND router = '${router}'
        `);

        const latestLog = await database.query(`
        SELECT * FROM microtic_logs WHERE created_at::date = '${
          dates[0]
        }' AND order_number = ${
          orders[orders.length - 1]
        } AND router = '${router}'
        `);

        latestLog[0].forEach((log, i) => {
          data.push({
            date: moment(log.created_at).format("YYYY-MM-DD"),
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
      } else {
        for (let h = 0; h < dates.length; h++) {
          let orders = [];

          logs = await database.query(`
            SELECT * FROM microtic_logs WHERE created_at::date = '${dates[h]}'::date
             ORDER BY order_number asc
          `);

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
            SELECT * FROM microtic_logs WHERE created_at::date = '${dates[h]}' AND order_number = ${orders[0]} AND router = '${router}'
          `);

          const latestLog = await database.query(`
            SELECT * FROM microtic_logs WHERE created_at::date = '${
              dates[h]
            }' AND order_number = ${
            orders[orders.length - 1]
          } AND router = '${router}'
          `);

          latestLog[0].forEach((log, i) => {
            data.push({
              date: moment(log.created_at).format("YYYY-MM-DD"),
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
