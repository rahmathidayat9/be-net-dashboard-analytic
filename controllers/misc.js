const axios = require("axios");
const moment = require("moment");

const database = require("../config/database");
const helper = require("../helpers");

module.exports = {
  // NOTE generate data system resource
  index: async (req, res) => {
    try {
      const router = req.params.router;

      const today = moment().format("YYYY-MM-DD");

      const log = await database.query(`
        SELECT * FROM system_resources WHERE router = '${router}' AND  created_at::date = '${today}' ORDER BY id
      `);

      if (log[0].length == 0) {
        return helper.response(res, 200, "No data", data);
      }

      let cpus = [];
      let memories = [];
      let hdds = [];

      log[0].map((l) => {
        cpus.push(l.cpu);
        hdds.push(l.hdd);
        memories.push(l.memory);
      });

      cpus = cpus.map(Number);
      hdds = hdds.map(Number);
      memories = memories.map(Number);

      const cpu = helper.getAveragefromArray(cpus).toFixed(2);
      const memory = helper.getAveragefromArray(memories).toFixed(2);
      const hdd = helper.getAveragefromArray(hdds).toFixed(2);

      const data = {
        cpu: cpu + "%",
        hdd: hdd + "%",
        memory: memory + "%",
      };

      return helper.response(res, 200, "Data ditemukan", data);
    } catch (error) {
      return helper.response(res, 400, "Error : " + error, error);
    }
  },

  getDHCPServersIo: async ({ router }) => {
    try {
      const url = `${process.env.MICROTIC_API_ENV}ip/dhcp-servers/${router}`;

      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      return response.data;
    } catch (error) {
      console.log(error);
      return error.message;
    }
  },
};
