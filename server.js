const express = require('express');
const http = require('http');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const apiRouter = require('./routes/api');
const { Server } = require('socket.io');
const cron = require('node-cron');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

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

io.on('connection', async (socket) => {
  cron.schedule('* * * * * *', () => {
    socket.emit('ether1', {
      download: getRandomNumber(10000, 20000),
      upload: getRandomNumber(10000, 20000),
    });

    socket.emit('ether2', {
      download: 100000,
      upload: 200000,
    });

    socket.emit('ether3', {
      download: 300000,
      upload: 400000,
    });

    socket.emit('ether4', {
      download: 500000,
      upload: 600000,
    });

    socket.emit('ether5', {
      download: 700000,
      upload: 800000,
    });
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Listening on *:${PORT}`);
});
