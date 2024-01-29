const axios = require("axios");
const moment = require("moment");

const database = require("../config/database");
const helper = require("../helpers");

module.exports = {
  // NOTE generate data bandwith
  index: async (req, res) => {
    try {
      let date = req.params.date;

      if (!date) return helper.response(res, 400, "Mohon masukan tanggal");

      date = moment(date).format("YYYY-MM-DD");

      let bandwith = await database.query(`
        SELECT * FROM bandwiths WHERE date::date = '${date}'
      `);

      let data;

      if (bandwith[0].length == 0) {
        const url = process.env.MICROTIC_API_ENV + "api/router/logs/print";

        const params = {
          uuid: "mrtk-000001",
          date,
          time: "8",
          ethernet: "ether1",
        };

        const response = await axios.post(url, params);

        if (response.status == 200) {
          const responseData = response.data;

          let high_rx_bit_per_second = 0;
          let high_tx_bit_per_second = 0;

          for (var i = 1; i < responseData.length; i++) {
            const smallData = responseData[i][0];

            console.log(smallData["rx-bits-per-second"]);

            if (high_rx_bit_per_second < smallData["rx-bits-per-second"]) {
              high_rx_bit_per_second = smallData["rx-bits-per-second"];
            }

            if (high_tx_bit_per_second < smallData["tx-bits-per-second"]) {
              high_tx_bit_per_second = smallData["tx-bits-per-second"];
            }
          }

          await database.query(
            `
                INSERT INTO bandwiths(high_rx_bit_per_second, high_tx_bit_per_second,date, created_at) VALUES(
                    '${high_rx_bit_per_second}',
                    '${high_tx_bit_per_second}',
                    '${date}',
                    '${await helper.getFormatedTime("datetime")}'
                ) RETURNING *
              `
          );

          data = await database.query(`
                SELECT * FROM bandwiths WHERE date::date = '${date}'
            `);

          data = data[0];
        } else {
          return helper.response(res, 400, "Error connection: no data");
        }
      } else {
        data = bandwith[0];
      }

      return helper.response(res, 200, "Data ditemukan", data);
    } catch (error) {
      return helper.response(res, 400, "Error : " + error, error);
    }
  },
};
