const express = require('express');
const http = require('http');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const { Server } = require('socket.io');
const ioClient = require('socket.io-client');
const cron = require('node-cron');
const axios = require('axios');
const { Telegraf } = require('telegraf');
const Telegram = require('telegraf/telegram');
const LocalStorage = require('node-localstorage').LocalStorage;
const localStorage = new LocalStorage('./scratch');
const apiRouter = require("./routes/api");
const authRouter = require("./routes/auth");
const priorityRouter = require("./routes/priority");
const ticketRouter = require("./routes/ticket");
require('dotenv').config();

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

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'storage/access.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Set up Multer to handle form-data
const storage = multer.memoryStorage(); // You can customize the storage as needed
const upload = multer({ storage: storage });

// Middleware for handling form-data
app.use(upload.any());
app.use(apiRouter);
app.use("/api/auth", authRouter);
app.use("/api/priority", priorityRouter);
app.use("/api/ticket", ticketRouter);

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatBytes(bytes) {
  let kilobyte = bytes / 1024;
  return parseInt(kilobyte)
}

app.get('/api/dashboard/get-interfaces', async (req, res) => {
  try {
    const apiUrl = 'https://api-mikrotik.linkdemo.web.id/api'
    
    /* Get all interface dynamicaly of the uuid device before live monitoring */
    const interfaceUrl = '/router/interface/list/print'
    const interfaceParams = {
      "uuid" : req.query.uuid
    }

    const interfaceResponse = await axios.post(apiUrl+interfaceUrl, interfaceParams)
    const interfaceResponseData = interfaceResponse.data.massage

    let arrData = []

    interfaceResponseData.forEach((value, index) => {
      arrData.push(value.name)
    })

    // Save data to local storage
    localStorage.setItem('dataInterface', JSON.stringify(arrData));

    res.send(arrData)
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: 'An error occurred' })
  }
})

const clientSocket = ioClient('https://api-mikrotik.linkdemo.web.id');
let isProcessing = false;

clientSocket.on('ether1', (data) => {
  if (isProcessing) {
    // If a request is already being processed, ignore this one
    return;
  }

  isProcessing = true;

  data.data.forEach((value, index) => {
    let obj = value;
    const uploadData = formatBytes(obj['tx-bits-per-second']);
    const downloadData = formatBytes(obj['rx-bits-per-second']);
    console.log(uploadData);
    console.log(downloadData);
  });

  isProcessing = false;
});

cron.schedule('* * * * * *', () => {  
  // Avoid triggering the cron job if a request is still processing
  if (!isProcessing) {
    // Your existing code here
  }
});


async function triggerSocket(socket) {
  const storedData = JSON.parse(localStorage.getItem('dataInterface'));
  console.log(storedData);
  storedData.forEach((value, index) => {
    socket.emit(value, {
      download: getRandomNumber(10000, 45000),
      upload: getRandomNumber(10000, 45000),
    });
  }) 
}

// app.post("/api/dashboard/send-telegram", async (req, res) => {
//   const groupIds = ["-4010824640", "-4084355967"];
//   let interface = req.body.interface
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
//     telegram.sendMessage(groupId, 'Interface '+interface+' Mengalami down , '+formattedDate).then(() => {
//       console.log(`Message sent to group ${groupId}`);
//     }).catch((error) => {
//       console.error(`Error sending message to group ${groupId}:`, error);
//     });
//   });
// })

io.on('connection', async (socket) => {
  let interfaceLive;

  app.get('/api/dashboard/start', async (req, res) => {
    if (!interfaceLive) {
      interfaceLive = cron.schedule('* * * * * *', () => {
        triggerSocket(io.sockets);
      });

      res.send('start');
    } else {
      res.send('Cron job is already running');
    }
  })

  app.get('/api/dashboard/stop', async (req, res) => {
    if (interfaceLive) {
      interfaceLive.stop();
      interfaceLive = null;
      res.send('stop');
    } else {
      res.send('Cron job is not running');
    }
  })

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

bot.start((ctx) => ctx.reply('Hello from the bot!'));
bot.launch().then(() => {
  console.log('Bot is running');
});

server.listen(PORT, () => {
  console.log(`Listening on *:${PORT}`);
});
