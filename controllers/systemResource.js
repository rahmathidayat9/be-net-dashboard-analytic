const moment = require("moment");

const database = require("../config/database");
const helper = require("../helpers");

module.exports = {
  // NOTE generate data system resource
  index: async (req, res) => {
    try {
      const today = moment().format("YYYY-MM-DD");

      const startLog = await database.query(`
        SELECT * FROM system_resources WHERE router = '${req.params.uuid}' AND  created_at::date = '${today}' ORDER BY id ASC LIMIT 1
      `);

      if (startLog[0].length == 0) {
        return helper.response(res, 200, "No data", data);
      }

      const finalLog = await database.query(`
        SELECT * FROM system_resources WHERE router = '${req.params.uuid}' AND  created_at::date = '${today}' ORDER BY id DESC LIMIT 1
      `);

      const startOrderNumber = startLog[0][0].order_number;
      const finalOrderNumber = finalLog[0][0].order_number;

      let data = [];

      const systemResource = await database.query(`
          SELECT * FROM system_resources WHERE router = '${req.params.uuid}' AND order_number = ${finalOrderNumber}
      `);

      if (finalOrderNumber == startOrderNumber) {
        systemResource[0].map((s) => {
          data.push({
            router: s.router,
            highest_memory_frequency: s.memory_frequency,
            average_memory_frequency: s.memory_frequency,
            highest_cpu_load: s.cpu_load,
            average_cpu_load: s.cpu_load,
          });
        });
      } else {
        const systemResource = await database.query(`
        SELECT * FROM system_resources WHERE router = '${req.params.uuid}' AND  created_at::date = '${today}' ORDER BY id
      `);

        let highest_memory_frequency = 0;
        let average_memory_frequency = 0;
        let highest_cpu_load = 0;
        let average_cpu_load = 0;

        let length = systemResource[0].length;

        systemResource[0].map((s) => {
          if (highest_memory_frequency < parseFloat(s.memory_frequency)) {
            highest_memory_frequency = parseFloat(s.memory_frequency);
          }

          if (highest_cpu_load < parseFloat(s.cpu_load)) {
            highest_cpu_load = parseFloat(s.cpu_load);
          }

          average_memory_frequency =
            average_memory_frequency + parseFloat(s.memory_frequency);

          average_cpu_load = average_cpu_load + parseFloat(s.cpu_load);
        });

        average_memory_frequency =
          Math.ceil((average_memory_frequency / length) * 100) / 100;

        average_cpu_load = Math.ceil((average_cpu_load / length) * 100) / 100;

        data.push({
          router: req.params.uuid,
          highest_memory_frequency,
          average_memory_frequency,
          highest_cpu_load,
          average_cpu_load,
        });
      }

      return helper.response(res, 200, "Data ditemukan", data);
    } catch (error) {
      return helper.response(res, 400, "Error : " + error, error);
    }
  },
};
