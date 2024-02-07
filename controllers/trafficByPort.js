const axios = require("axios");
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
        SELECT * FROM traffic_by_ports WHERE router = '${req.params.uuid}' AND  created_at::date = '${today}' ORDER BY id ASC LIMIT 1
      `);

      if (startLog[0].length == 0) {
        return helper.response(res, 200, "No data", data);
      }

      const finalLog = await database.query(`
        SELECT * FROM traffic_by_ports WHERE router = '${req.params.uuid}' AND  created_at::date = '${today}' ORDER BY id DESC LIMIT 1
      `);

      const startOrderNumber = startLog[0][0].order_number;
      const finalOrderNumber = finalLog[0][0].order_number;

      const trafficByPort = await database.query(`
          SELECT * FROM traffic_by_ports WHERE router = '${req.params.uuid}' AND order_number = ${finalOrderNumber} ORDER BY rx_byte desc
      `);

      if (finalOrderNumber == startOrderNumber) {
        trafficByPort[0].map((t) => {
          data.push({
            router: t.router,
            name: t.name,
            rx_byte: t.rx_byte,
            tx_byte: t.tx_byte,
          });
        });
      } else {
        const trafficByPort = await database.query(`
            SELECT * FROM traffic_by_ports WHERE router = '${req.params.uuid}' AND order_number = ${finalOrderNumber} ORDER BY rx_byte desc
        `);

        for (let i = 0; i < trafficByPort[0].length; i++) {
          const startData = await database.query(`
            SELECT * FROM traffic_by_ports WHERE router = '${req.params.uuid}' AND order_number = ${startOrderNumber} AND name = '${trafficByPort[0][i].name}' LIMIT 1
            `);

          if (startData[0].length == 0) {
            data.push({
              router: trafficByPort[0][i].router,
              name: trafficByPort[0][i].name,
              rx_byte: trafficByPort[0][i].rx_byte,
              tx_byte: trafficByPort[0][i].tx_byte,
            });
          } else {
            data.push({
              router: trafficByPort[0][i].router,
              name: trafficByPort[0][i].name,
              rx_byte: trafficByPort[0][i].rx_byte - startData[0][0].rx_byte,
              tx_byte: trafficByPort[0][i].tx_byte - startData[0][0].tx_byte,
            });
          }
        }
      }

      data.sort((a, b) => (a.rx_byte < b.rx_byte ? 1 : -1));

      return helper.response(res, 200, "Data ditemukan", {
        today,
        data,
      });
    } catch (error) {
      return helper.response(res, 400, "Error : " + error, error);
    }
  },
};
