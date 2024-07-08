const axios = require("axios");
const moment = require("moment");

const database = require("../config/database");
const helper = require("../helpers");

module.exports = {
  // NOTE generate data system resource
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

      let data = {};

      if (start_date && end_date) {
        let records = [];

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
          const log = await database.query(`
            SELECT * FROM system_resources WHERE router = '${router}' AND  created_at::date = '${dates[i]}' ORDER BY id
          `);

          if (log[0].length == 0) {
            records.push({
              date: dates[i],
              cpu: "0%",
              hdd: "0%",
              memory: "0%",
              max_cpu: "0%",
              max_hdd: "0%",
              max_memory: "0%",
            });
          } else {
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

            records.push({
              date: dates[i],
              cpu: cpu + "%",
              hdd: hdd + "%",
              memory: memory + "%",
              max_cpu: Math.max.apply(null, cpus).toFixed(2) + "%",
              max_hdd: Math.max.apply(null, hdds).toFixed(2) + "%",
              max_memory: Math.max.apply(null, memories).toFixed(2) + "%",
            });
          }
        }

        data = records;
      } else {
        const log = await database.query(`
          SELECT * FROM system_resources WHERE router = '${router}' AND  created_at::date = '${today}' ORDER BY id
        `);

        if (log[0].length == 0) {
          return helper.response(res, 200, "No data");
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

        data = {
          date: today,
          cpu: cpu + "%",
          hdd: hdd + "%",
          memory: memory + "%",
          max_cpu: Math.max.apply(null, cpus).toFixed(2) + "%",
          max_hdd: Math.max.apply(null, hdds).toFixed(2) + "%",
          max_memory: Math.max.apply(null, memories).toFixed(2) + "%",
        };
      }

      return helper.response(res, 200, "Data ditemukan", data);
    } catch (error) {
      return helper.response(res, 400, "Error : " + error, error);
    }
  },

  getDataSystemResourceIo: async ({ router }) => {
    try {
      let routers = await database.query(`
          SELECT * FROM routers WHERE id = '${router}'
      `);

      mikrotik = await helper.mikrotikCommand(
        routers[0][0],
        "/system/resource/print"
      );

      let data = [];

      mikrotik.map((m) => {
        const freeMemory = parseInt(m["free-memory"]);
        const totalMemory = parseInt(m["total-memory"]);

        const usedMemory = totalMemory - freeMemory;

        const memoryUsagePercentage = (usedMemory / totalMemory) * 100;

        const freeHDD = parseInt(m["free-hdd-space"]);
        const totalHDD = parseInt(m["total-hdd-space"]);

        const usedHDD = totalHDD - freeHDD;

        const HDDUsagePercentage = (usedHDD / totalHDD) * 100;

        data = {
          cpu: m["cpu-load"],
          hdd: parseFloat(HDDUsagePercentage).toFixed(2),
          memory: parseFloat(memoryUsagePercentage).toFixed(2),
        };
      });

      return data;
    } catch (error) {
      console.log(error);
      return error.message;
    }
  },
};
