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
      let creds;

      if (router) {
        creds = await database.query(`
        SELECT * FROM routers WHERE id = '${router}' AND deleted_at IS NULL
      `);
      } else {
        creds = await database.query(`
          SELECT * FROM routers WHERE status = 'active' AND deleted_at IS NULL
        `);
      }
      const mikrotik = await helper.mikrotikCommand(
        creds[0][0],
        "/ip/dhcp-server/lease/print"
      );

      let details = [];

      let active = 0;
      let inactive = 0;

      mikrotik.map((m) => {
        const status = m.hasOwnProperty("last-seen") ? "active" : "inactive";

        if (status == "active") {
          active = active + 1;
        } else {
          inactive = inactive + 1;
        }

        details.push({
          address: m["address"],
          name: m.hasOwnProperty("host-name") ? m["host-name"] : "",
          last_seen: m.hasOwnProperty("last-seen")
            ? helper.convertToPastDate(m["last-seen"])
            : "",
          status,
        });
      });

      data = {
        active,
        details,
        inactive,
      };

      return data;
    } catch (error) {
      console.log(error);
      return error.message;
    }
  },
};
