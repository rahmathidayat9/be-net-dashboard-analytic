const express = require('express');
const http = require('http');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const apiRouter = require('./routes/api');
const { Server } = require('socket.io');
const ioClient = require('socket.io-client');
const cron = require('node-cron');
const axios = require('axios');
const { Telegraf } = require('telegraf');
const Telegram = require('telegraf/telegram');
const LocalStorage = require('node-localstorage').LocalStorage;
const localStorage = new LocalStorage('./scratch');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
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

    liveMonitoring(req.query.uuid, arrData)

    // Save data to local storage
    localStorage.setItem('dataInterface', JSON.stringify(arrData));

    res.send(arrData)
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: 'An error occurred' })
  }
})

async function liveMonitoring(uuid, storedData) {
  try {
    const apiUrl = 'https://api-mikrotik.linkdemo.web.id/api'
    // const storedData = JSON.parse(localStorage.getItem('dataInterface'));
    
    /* Get all interface dynamicaly of the uuid device before live monitoring */
    const interfaceUrl = '/router/interface/list/monitor/live'
    const interfaceParams = {
      "uuid" : uuid,
      "ethernet": storedData
    }

    const interfaceResponse = await axios.post(apiUrl+interfaceUrl, interfaceParams)
    const interfaceResponseData = interfaceResponse.data.massage
    // console.log(storedData);
  } catch (error) {
    console.log(error)
    // return res.status(500).json({ error: 'An error occurred' })
  }
}

// clientSocket.on('ether1', (data) => {
//   if (isProcessing) {
//     // If a request is already being processed, ignore this one
//     return;
//   }

//   isProcessing = true;

//   data.data.forEach((value, index) => {
//     let obj = value;
//     const uploadData = formatBytes(obj['tx-bits-per-second']);
//     const downloadData = formatBytes(obj['rx-bits-per-second']);
//     console.log(uploadData);
//     console.log(downloadData);
//   });

//   isProcessing = false;
// });

// cron.schedule('* * * * * *', () => {  
//   // Avoid triggering the cron job if a request is still processing
//   if (!isProcessing) {
//     // Your existing code here
//   }
// });


async function triggerSocket(socket) {
  const storedData = JSON.parse(localStorage.getItem('dataInterface'));

  storedData.forEach((value, index) => {
    const clientSocket = ioClient('https://api-mikrotik.linkdemo.web.id');
    let isProcessing = false;
    
    clientSocket.on(value, (data) => {
      if (isProcessing) {
        // If a request is already being processed, ignore this one
        return;
      }
    
      isProcessing = true;
      
      // console.log(data);
      data.data.forEach((val, idx) => {
        let obj = val;
        const uploadData = obj['tx-bits-per-second'];
        const downloadData = obj['rx-bits-per-second'];
        
        console.log(value+' : '+uploadData+' - '+downloadData);

        cron.schedule('*/5 * * * * *', () => {
          socket.emit(value, {
            download: downloadData,
            upload: uploadData,
          });
        });
      });
    
      isProcessing = false;
    });
  })
}

io.on('connection', async (socket) => {
  let interfaceLive;

  app.get('/api/dashboard/start', async (req, res) => {
    if (!interfaceLive) {
      // interfaceLive = cron.schedule('* * * * * *', () => {
      triggerSocket(io.sockets);
      // });

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

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

bot.start((ctx) => ctx.reply('Hello from the bot!'));
bot.launch().then(() => {
  console.log('Bot is running');
});

server.listen(PORT, () => {
  console.log(`Listening on *:${PORT}`);
});
