const express = require("express");
const http = require("http");
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
// const { Telegraf } = require("telegraf");
// const Telegram = require("telegraf/telegram");
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
const topSiteRouter = require("./routes/topSite");
const topInterfaceRouter = require("./routes/topInterface");
const userRouter = require("./routes/user");
const profileRoute = require("./routes/profile");
const { getDataSystemResourceIo } = require("./controllers/systemResource");
const { getGraphTopInterfaceIo } = require("./controllers/topInterface.js");
const { getCurrentTxRxIo } = require("./controllers/bandwith");
const { getDHCPServersIo } = require("./controllers/misc");

require("dotenv").config();

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// const bot = new Telegraf(process.env.BOT_TOKEN);
// const telegram = new Telegram(process.env.BOT_TOKEN);

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
// app.use(apiRouter);
app.use("/api/auth", authRouter);
app.use("/api/priority", priorityRouter);
app.use("/api/ticket", ticketRouter);
app.use("/api/", microticLogRouter);
app.use("/api/bandwith", bandwithRouter);
// app.use("/api/internet", internetRouter);
// app.use("/api/ip-address", ipAddressRouter);
app.use("/api/route", routeRouter);
app.use("/api/top-host-name", topHostNameRouter);
app.use("/api/top-interface", topInterfaceRouter);
app.use("/api/top-sites", topSiteRouter);
// app.use("/api/traffic-by-port", trafficByPortRouter);
app.use("/api/system-resource", systemResourceRouter);
app.use("/api/users", userRouter);
app.use("/api/profile1", profileRoute);

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatBytes(bytes) {
  let kilobyte = bytes / 1024;
  return parseInt(kilobyte);
}

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

// top interface
// cron.schedule("*/1 * * * * *", async () => {
//   try {
//     const today = moment().format("YYYY-MM-DD");
//     let routers = await database.query(`
//     SELECT * FROM routers WHERE deleted_at IS NULL
//   `);
//     if (routers[0].length > 0) {
//       routers = routers[0];
//       for (let i = 0; i < routers.length; i++) {
//         const url = `${process.env.MICROTIC_API_ENV}interfaces/${routers[i].id}`;
//         axios
//           .get(url, {
//             headers: {
//               "Content-Type": "application/json",
//             },
//           })
//           .then(async (response) => {
//             const data = response.data;
//             for (let j = 0; j < data.length; j++) {
//               let counter = 1;
//               let latest = await database.query(`
//               SELECT * FROM top_interfaces WHERE router = '${routers[i].id}' AND name = '${data[j].name}' AND date = '${today}' ORDER BY counter DESC LIMIT 1
//             `);
//               if (latest[0].length == 1) {
//                 counter = latest[0][0].counter + 1;
//               }
//               await database.query(
//                 `
//                 INSERT INTO top_interfaces(router, name, default_name, data_id, type, mtu, actual_mtu, l2mtu, max_l2mtu, mac_address, last_link_up_time, link_downs, rx_byte, tx_byte, rx_packet, tx_packet, tx_queue_drop, fp_rx_byte, fp_tx_byte, fp_rx_packet, fp_tx_packet, running, disabled, date, counter, created_at) VALUES(
//                     '${routers[i].id}',
//                     '${data[j].name}',
//                     '${data[j]["default-name"]}',
//                     '${data[j][".id"]}',
//                     '${data[j]["type"]}',
//                     '${data[j]["mtu"]}',
//                     '${data[j]["actual-mtu"]}',
//                     '${data[j]["l2mtu"]}',
//                     '${data[j]["max-l2mtu"]}',
//                     '${data[j]["mac-address"]}',
//                     '${data[j]["last-link-up-time"]}',
//                     '${data[j]["link-downs"]}',
//                     '${data[j]["rx-byte"]}',
//                     '${data[j]["tx-byte"]}',
//                     '${data[j]["rx-packet"]}',
//                     '${data[j]["tx-packet"]}',
//                     '${data[j]["tx-queue-drop"]}',
//                     '${data[j]["fp-rx-byte"]}',
//                     '${data[j]["fp-tx-byte"]}',
//                     '${data[j]["fp-rx-packet"]}',
//                     '${data[j]["fp-tx-packet"]}',
//                     '${data[j]["running"]}',
//                     '${data[j]["disabled"]}',
//                     '${today}',
//                     '${counter}',
//                     '${await helper.getFormatedTime("datetime")}'
//                 ) RETURNING *
//               `
//               );
//             }
//           })
//           .catch((error) => {
//             console.error("Error fetching data:", error);
//           });
//       }
//     }
//     console.log("top interface updated");
//   } catch (error) {
//     console.log(error);
//   }
// });

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
  socket.on("system-resource", async ({ router }) => {
    try {
      const data = await getDataSystemResourceIo({ router });

      io.emit("new-data", data);
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("dhcp-servers", async ({ router }) => {
    try {
      const data = await getDHCPServersIo({ router });

      io.emit("new-servers", data);
    } catch (error) {
      console.log(error);
      io.emit("error", { message: error.message });
    }
  });

  socket.on("bandwith", async ({ router }) => {
    try {
      const data = await getCurrentTxRxIo({ router });

      io.emit("new-bandwith", data);
    } catch (error) {
      console.log(error);
      io.emit("error", { message: error.message });
    }
  });

  socket.on("top-interface-graph", async () => {
    try {
      const data = await getGraphTopInterfaceIo();

      io.emit("new-graph", data);
    } catch (error) {
      console.log(error);
      io.emit("error", { message: error.message });
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

// bot.start((ctx) => ctx.reply("Hello from the bot!"));
// bot.launch().then(() => {
//   console.log("Bot is running");
// });

server.listen(PORT, () => {
  console.log(`Listening on *:${PORT}`);
});
