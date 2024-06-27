const database = require("../config/database");
const helper = require("../helpers");

const cron = async () => {
  let routers = await database.query(`
        SELECT * FROM routers WHERE deleted_at IS NULL
    `);

  let data = [];

  if (routers[0].length > 0) {
    routers = routers[0];

    for (let i = 0; i < routers.length; i++) {
      let mikrotik = await helper.mikrotikCommand(
        routers[i],
        "/ip/kid-control/device/print"
      );

      mikrotik.map((m) => {
        data.push({
          id: m[".id"],
          name: m.name != "" ? m.name : m["ip-address"],
          bytes_down: m["bytes-down"],
        });
      });

      for (let j = 0; j < data.length; j++) {
        const log = await database.query(`
          SELECT * FROM top_host_names 
          WHERE identifier = '${data[j].id}' AND date = CURRENT_DATE AND router = '${routers[i].id}'
        `);

        if (log[0].length == 0) {
          await database.query(
            `
              INSERT INTO top_host_names(identifier, bytes_down, date, host_name, router, created_at) VALUES(
                  '${data[j].id}',
                  '${data[j].bytes_down}',
                  CURRENT_DATE,
                  '${data[j].name}',
                  '${routers[i].id}',
                  '${await helper.getFormatedTime("datetime")}'
              ) RETURNING *
            `
          );
        } else {
          await database.query(
            `
              UPDATE top_host_names
              SET 
              bytes_down = '${data[j].bytes_down}'
              WHERE identifier = '${data[j].id}' AND date = CURRENT_DATE AND router = '${routers[i].id}'
            `
          );
        }
      }

      console.log("top host names updated");
    }

    data = [];

    for (let i = 0; i < routers.length; i++) {
      mikrotik = await helper.mikrotikCommand(
        routers[i],
        "/ip/kid-control/device/print"
      );

      mikrotik.map((m) => {
        data.push({
          id: m[".id"],
          name: m.name != "" ? m.name : m["ip-address"],
          activity: m["activity"],
        });
      });

      for (let j = 0; j < data.length; j++) {
        const log = await database.query(`
          SELECT * FROM top_sites 
          WHERE identifier = '${data[j].id}' AND 
          date = CURRENT_DATE AND 
          router = '${routers[i].id}'
        `);

        if (log[0].length == 0) {
          await database.query(
            `
              INSERT INTO top_sites(identifier, date, name, router, activity, created_at) VALUES(
                  '${data[j].id}',
                  CURRENT_DATE,
                  '${data[j].name}',
                  '${routers[i].id}',
                  '${data[j].activity}',
                  '${await helper.getFormatedTime("datetime")}'
              ) RETURNING *
            `
          );
        } else {
          await database.query(
            `
              UPDATE top_sites
              SET 
              activity = '${data[j].activity}'
              WHERE identifier = '${data[j].id}' AND 
              date = CURRENT_DATE AND 
              router = '${routers[i].id}'
            `
          );
        }
      }

      console.log("top sites updated");
    }

    data = [];

    for (let i = 0; i < routers.length; i++) {
      mikrotik = await helper.mikrotikCommand(routers[i], "/interface/print");

      mikrotik.map((m) => {
        data.push({
          name: m.name,
          rx_byte: m["rx-byte"],
          tx_byte: m["tx-byte"],
        });
      });

      for (let j = 0; j < data.length; j++) {
        let counter = 1;

        let latest = await database.query(`
            SELECT * FROM top_interfaces WHERE router = '${routers[i].id}' AND name = '${data[j].name}' AND date = CURRENT_DATE ORDER BY counter DESC LIMIT 1
          `);

        if (latest[0].length == 1) {
          counter = latest[0][0].counter + 1;
        }

        await database.query(
          `
              INSERT INTO top_interfaces(router, name, rx_byte, tx_byte, date, counter, created_at) VALUES(
                  '${routers[i].id}',
                  '${data[j].name}',
                  '${data[j].rx_byte}',
                  '${data[j].tx_byte}',
                  CURRENT_DATE,
                  '${counter}',
                  '${await helper.getFormatedTime("datetime")}'
              ) RETURNING *
            `
        );
      }

      console.log("top interface done");
    }

    data = [];

    for (let i = 0; i < routers.length; i++) {
      mikrotik = await helper.mikrotikCommand(
        routers[i],
        "/system/resource/print"
      );

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
          cpu: parseFloat(m["cpu-load"]).toFixed(2),
          hdd: parseFloat(HDDUsagePercentage).toFixed(2),
          memory: parseFloat(memoryUsagePercentage).toFixed(2),
        };
      });

      await database.query(
        `
        INSERT INTO system_resources(router, cpu, hdd, memory, date, created_at) VALUES(
            '${routers[i].id}',
            '${data.cpu}',
            '${data.hdd}',
            '${data.memory}',
            CURRENT_DATE,
            '${await helper.getFormatedTime("datetime")}'
        ) RETURNING *
      `
      );

      console.log("system resources done");
    }
  }
};

cron();
