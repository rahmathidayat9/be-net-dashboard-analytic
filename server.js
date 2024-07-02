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

let id = 0;
let bandwidth = null;
// const groupIds = ["-4010824640", "-4084355967"];

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

const checkApiData = async () => {
  const url = `${process.env.MICROTIC_API_ENV}interfaces/monitor/${id}`;

  const response = await axios.get(url, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (JSON.stringify(bandwidth) !== JSON.stringify(response.data)) {
    bandwidth = response.data;

    io.sockets.emit("new-bandwith", bandwidth);
  }
};

setInterval(checkApiData, 5000);

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
      id = router;

      const data = await getCurrentTxRxIo({ router });

      if (bandwidth) {
        socket.emit("new-bandwith", bandwidth);
      }

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
