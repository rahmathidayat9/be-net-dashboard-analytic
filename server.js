const express = require("express");
const http = require("http");
const moment = require("moment");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const database = require("./config/database");
const multer = require("multer");
const cors = require("cors");
const { Server } = require("socket.io");
const ioClient = require("socket.io-client");
const cron = require("node-cron");
const axios = require("axios");
const { Telegraf } = require("telegraf");
const Telegram = require("telegraf/telegram");
const LocalStorage = require("node-localstorage").LocalStorage;
const localStorage = new LocalStorage("./scratch");
const apiRouter = require("./routes/api");
const authRouter = require("./routes/auth");
const bandwithRouter = require("./routes/bandwith");
const internetRouter = require("./routes/internet");
const ipAddressRouter = require("./routes/ipAddress");
const microticLogRouter = require("./routes/microticLog");
const priorityRouter = require("./routes/priority");
const routeRouter = require("./routes/route");
const systemResourceRouter = require("./routes/systemResource");
const ticketRouter = require("./routes/ticket");
const topHostNameRouter = require("./routes/topHostName");
const trafficByPortRouter = require("./routes/trafficByPort");
const helper = require("./helpers");

require("dotenv").config();

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const bot = new Telegraf(process.env.BOT_TOKEN);
const telegram = new Telegram(process.env.BOT_TOKEN);

const groupIds = ["-4010824640", "-4084355967"];

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "storage/access.log"),
  { flags: "a" }
);
app.use(morgan("combined", { stream: accessLogStream }));
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add headers before the routes are defined
app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);

  // Pass to next layer of middleware
  next();
});
// Set up Multer to handle form-data
const storage = multer.memoryStorage(); // You can customize the storage as needed
const upload = multer({ storage: storage });

// Middleware for handling form-data
app.use(upload.any());
app.use(apiRouter);
app.use("/api/auth", authRouter);
app.use("/api/priority", priorityRouter);
app.use("/api/ticket", ticketRouter);
app.use("/api", microticLogRouter);
app.use("/api/bandwith", bandwithRouter);
app.use("/api/internet", internetRouter);
app.use("/api/ip-address", ipAddressRouter);
app.use("/api/route", routeRouter);
app.use("/api/top-host-name", topHostNameRouter);
app.use("/api/traffic-by-port", trafficByPortRouter);
app.use("/api/system-resource", systemResourceRouter);

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatBytes(bytes) {
  let kilobyte = bytes / 1024;
  return parseInt(kilobyte);
}

app.get("/api/dashboard/get-interfaces", async (req, res) => {
  try {
    const apiUrl = process.env.MICROTIC_API_ENV + "api";

    /* Get all interface dynamicaly of the uuid device before live monitoring */
    const interfaceUrl = "/router/interface/list/print";
    const interfaceParams = {
      uuid: req.query.uuid,
    };

    const interfaceResponse = await axios.post(
      apiUrl + interfaceUrl,
      interfaceParams
    );
    const interfaceResponseData = interfaceResponse.data.massage;

    let arrData = [];

    interfaceResponseData.forEach((value, index) => {
      arrData.push(value.name);
    });

    // Save data to local storage
    localStorage.setItem("dataInterface", JSON.stringify(arrData));

    res.send(arrData);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "An error occurred" });
  }
});

const clientSocket = ioClient(process.env.MICROTIC_API_ENV);
let isProcessing = false;

clientSocket.on("ether1", (data) => {
  if (isProcessing) {
    // If a request is already being processed, ignore this one
    return;
  }

  isProcessing = true;

  data.data.forEach((value, index) => {
    let obj = value;
    const uploadData = formatBytes(obj["tx-bits-per-second"]);
    const downloadData = formatBytes(obj["rx-bits-per-second"]);
    console.log(uploadData);
    console.log(downloadData);
  });

  isProcessing = false;
});

// microtic_logs
cron.schedule("0 * * * *", async () => {
  try {
    const url =
      process.env.MICROTIC_API_ENV + "api/router/interface/list/print";

    for (let i = 3; i < 7; i++) {
      const uuid = "mrtk-00000" + i;

      const params = {
        uuid,
      };

      const response = await axios.post(url, params);
      if (response.data.success) {
        const responseData = response.data.massage;

        let arrData = [];

        const log = await database.query(`
          SELECT * FROM microtic_logs WHERE router = '${uuid}' ORDER BY id DESC LIMIT 1
        `);

        if (log[0].length == 0) {
          responseData.forEach(async (value) => {
            arrData.push(value);

            await database.query(
              `
                  INSERT INTO microtic_logs(router, name,tx_byte, rx_byte,order_number, created_at) VALUES(
                      '${uuid}',
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
                      '${uuid}',
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
      }
    }

    console.log("microtic_logs updated");
  } catch (error) {
    console.log(error);
  }
});

// traffic by port
cron.schedule("0 * * * *", async () => {
  try {
    let url = process.env.MICROTIC_API_ENV + "api/router/interface/list/print";

    for (let i = 3; i < 7; i++) {
      const uuid = "mrtk-00000" + i;

      const params = {
        uuid,
      };

      let response = await axios.post(url, params);

      if (response.data.success) {
        const responseData = response.data.massage;

        const log = await database.query(`
              SELECT * FROM traffic_by_ports WHERE router = '${uuid}' ORDER BY id DESC LIMIT 1
            `);

        if (log[0].length == 0) {
          responseData.forEach(async (value) => {
            await database.query(
              `
                INSERT INTO traffic_by_ports(router, name, rx_byte, tx_byte, mac_address, order_number, created_at) VALUES(
                  '${uuid}',
                  '${value.name.replace("'", "")}',
                  '${value["rx-byte"]}',
                  '${value["tx-byte"]}',
                  '${value["mac-address"]}',
                  1,
                  '${await helper.getFormatedTime("datetime")}'
                ) RETURNING *
              `
            );
          });
        } else {
          const order_number = log[0][0].order_number + 1;

          responseData.forEach(async (value) => {
            await database.query(
              `
                INSERT INTO traffic_by_ports(router, name, rx_byte, tx_byte, mac_address, order_number, created_at) VALUES(
                  '${uuid}',
                  '${value.name.replace("'", "")}',
                  '${value["rx-byte"]}',
                  '${value["tx-byte"]}',
                  '${value["mac-address"]}',
                  ${order_number},
                  '${await helper.getFormatedTime("datetime")}'
                ) RETURNING *
              `
            );
          });
        }
      }
    }

    console.log("top_host_name updated");
  } catch (error) {
    console.log(error);
  }
});

// top host name
cron.schedule("0 * * * *", async () => {
  try {
    let url = process.env.MICROTIC_API_ENV + "api/router/ip/kid-controll/print";

    for (let i = 3; i < 7; i++) {
      const uuid = "mrtk-00000" + i;

      const params = {
        uuid,
      };

      let response = await axios.post(url, params);

      if (response.data.success) {
        const responseData = response.data.massage;

        let arrData = [];

        const log = await database.query(`
              SELECT * FROM top_host_names WHERE router = '${uuid}' ORDER BY id DESC LIMIT 1
            `);

        if (log[0].length == 0) {
          responseData.forEach(async (value) => {
            arrData.push(value);

            await database.query(
              `
                      INSERT INTO top_host_names(router, name, bytes_down, mac_address, order_number, created_at) VALUES(
                          '${uuid}',
                          '${value.name.replace("'", "")}',
                          '${value["bytes-down"]}',
                          '${value["mac-address"]}',
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
                    INSERT INTO top_host_names(router, name, bytes_down, mac_address, order_number, created_at) VALUES(
                      '${uuid}',
                      '${value.name.replace("'", "")}',
                      '${value["bytes-down"]}',
                      '${value["mac-address"]}',
                          ${order_number},
                          '${await helper.getFormatedTime("datetime")}'
                      ) RETURNING *
                    `
            );
          });
        }
      }
    }

    console.log("top_host_name updated");
  } catch (error) {
    console.log(error);
  }
});

// system resource
cron.schedule("0 * * * *", async () => {
  try {
    let url =
      process.env.MICROTIC_API_ENV + "api/router/system/resources/print";

    for (let i = 3; i < 7; i++) {
      const uuid = "mrtk-00000" + i;

      const params = {
        uuid,
      };

      let response = await axios.post(url, params);

      if (response.data.success) {
        const log = await database.query(`
              SELECT * FROM system_resources WHERE router = '${uuid}' ORDER BY id DESC LIMIT 1
            `);

        const responseData = response.data.massage[0];

        const totalMemory = responseData["total-memory"];
        const freeMemory = responseData["free-memory"];

        const memory_frequency =
          Math.ceil(((totalMemory - freeMemory) / freeMemory) * 100 * 100) /
          100;

        if (log[0].length == 0) {
          await database.query(
            `
              INSERT INTO system_resources(router, memory_frequency, cpu_load, order_number, created_at) VALUES(
                  '${uuid}',
                  '${memory_frequency}',
                  '${responseData["cpu-load"]}',
                  1,
                  '${await helper.getFormatedTime("datetime")}'
              ) RETURNING *
            `
          );
        } else {
          const order_number = log[0][0].order_number + 1;

          await database.query(
            `
              INSERT INTO system_resources(router, memory_frequency, cpu_load, order_number, created_at) VALUES(
                  '${uuid}',
                  '${memory_frequency}',
                  '${responseData["cpu-load"]}',
                  ${order_number},
                  '${await helper.getFormatedTime("datetime")}'
              ) RETURNING *
            `
          );
        }
      }
    }

    console.log("top_host_name updated");
  } catch (error) {
    console.log(error);
  }
});

// top host name
cron.schedule("*/3 * * * * *", async () => {
  try {
    const Client = require("ssh2").Client;

    let ips = await database.query("SELECT * FROM ip_addresses");

    ips = ips[0];

    ips.forEach((ip) => {
      const conn = new Client();

      conn
        .on("ready", async () => {
          conn.exec(`cat /var/www/html/${ip.ip}.json`, (err, stream) => {
            if (err) throw err;

            let dataBuffer = "";

            stream
              .on("close", async (code, signal) => {
                var json = JSON.parse(dataBuffer);

                let success = 0;

                for (let i = 0; i < json.length; i++) {
                  if (json[i].activity.length > 0) {
                    let query = await database.query(`
                        SELECT * FROM top_sites_2 WHERE date::date = '${today}' AND site = '${json[i].activity}'
                        `);

                    if (query[0].length == 0) {
                      await database.query(
                        `
                              INSERT INTO top_sites_2(site, date, created_at) VALUES(
                                  '${json[i].activity}',
                                  '${today}',
                                  '${await helper.getFormatedTime("datetime")}'
                              ) RETURNING *
                            `
                      );
                    } else {
                      let count = query[0][0].count;

                      count = count + 1;

                      await database.query(
                        `UPDATE top_sites_2 SET count = ${count}, updated_at = now() WHERE id = '${query[0][0].id}'`
                      );
                    }

                    success = success + 1;
                  }
                }

                console.log(`router ${ip.ip} done, ${success} data created`);

                conn.end();
              })
              .on("data", (data) => {
                dataBuffer += data;
              })
              .stderr.on("data", (data) => {
                console.error("STDERR: " + data);
              });
          });
        })
        .connect({
          host: "103.118.175.82",
          port: 2025,
          username: "analytic",
          password: "dashboardanalytic",
        });
    });

    console.log("top_host updated");
  } catch (error) {
    console.log(error);
  }
});

async function triggerSocket(socket) {
  const storedData = JSON.parse(localStorage.getItem("dataInterface"));
  console.log(storedData);
  storedData.forEach((value, index) => {
    socket.emit(value, {
      download: getRandomNumber(10000, 4500000),
      upload: getRandomNumber(10000, 4500000),
    });
  });
}

// app.post("/api/dashboard/send-telegram", async (req, res) => {
//   const groupIds = ["-4010824640", "-4084355967"];
//   let interface = req.body.interface
//   let internet = req.body.internet
//   let speed = req.body.speed

//   const options = {
//     weekday: 'long',
//     year: 'numeric',
//     month: 'long',
//     day: 'numeric',
//     hour: 'numeric',
//     minute: 'numeric',
//     timeZoneName: 'short',
//   };

//   const locale = 'id-ID';

//   const formattedDate = new Date().toLocaleString(locale, options);

//   groupIds.forEach((groupId) => {
//     telegram.sendMessage(groupId, 'Interface '+interface+' Internet '+internet+' Mengalami down , '+formattedDate).then(() => {
//       console.log(`Message sent to group ${groupId}`);
//     }).catch((error) => {
//       console.error(`Error sending message to group ${groupId}:`, error);
//     });
//   });
// })

io.on("connection", async (socket) => {
  let interfaceLive;

  app.get("/api/dashboard/start", async (req, res) => {
    if (!interfaceLive) {
      interfaceLive = cron.schedule("* * * * * *", () => {
        triggerSocket(io.sockets);
      });

      res.send("start");
    } else {
      res.send("Cron job is already running");
    }
  });

  app.get("/api/dashboard/stop", async (req, res) => {
    if (interfaceLive) {
      interfaceLive.stop();
      interfaceLive = null;
      res.send("stop");
    } else {
      res.send("Cron job is not running");
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

bot.start((ctx) => ctx.reply("Hello from the bot!"));
bot.launch().then(() => {
  console.log("Bot is running");
});

server.listen(PORT, () => {
  console.log(`Listening on *:${PORT}`);
});
