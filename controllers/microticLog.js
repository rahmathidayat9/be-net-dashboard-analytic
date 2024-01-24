const axios = require("axios");
const moment = require("moment");

const database = require("../config/database");
const helper = require("../helpers");

module.exports = {
  // NOTE upload download
  uploadDownload: async (req, res) => {
    try {
      const url =
        "https://api-mikrotik.linkdemo.web.id/api/router/interface/list/print";

      const params = {
        uuid: req.params.uuid,
      };

      const response = await axios.post(url, params);

      if (response.data.success) {
        const responseData = response.data.massage;

        let arrData = [];

        const log = await database.query(`
          SELECT * FROM microtic_logs WHERE router = '${req.params.uuid}' ORDER BY id DESC LIMIT 1
        `);

        if (log[0].length == 0) {
          responseData.forEach(async (value) => {
            arrData.push(value);

            await database.query(
              `
                  INSERT INTO microtic_logs(router, name,tx_byte, rx_byte,order_number, created_at) VALUES(
                      '${req.params.uuid}',
                      '${value.name}',
                      '${value["tx-byte"]}',
                      '${value["rx-byte"]}',
                      1,
                      '${await helper.getFormatedTime("datetime")}'
                  ) RETURNING *
                `
            );
          });
        } else {
          const order_number = log[0][0].order_number + 1;

          responseData.forEach(async (value) => {
            arrData.push(value);

            await database.query(
              `
                  INSERT INTO microtic_logs(router, name, tx_byte, rx_byte,order_number, created_at) VALUES(
                      '${req.params.uuid}',
                      '${value.name}',
                      '${value["tx-byte"]}',
                      '${value["rx-byte"]}',
                      ${order_number},
                      '${await helper.getFormatedTime("datetime")}'
                  ) RETURNING *
                `
            );
          });
        }

        return helper.response(res, 200, "Data ditemukan", {
          total: arrData.length,
          data: arrData,
        });
      }

      return helper.response(res, 400, "Router tidak diketahui");
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
          rx_byte: log.rx_byte - earlylogs[0][i].rx_byte,
          tx_byte: log.tx_byte - earlylogs[0][i].tx_byte,
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
};
