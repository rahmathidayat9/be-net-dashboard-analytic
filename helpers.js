const axios = require("axios");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const randomstring = require("randomstring");
const RouterClient = require("@mhycy/routeros-client");

const database = require("./config/database.js");

dotenv.config();

const env = process.env;

module.exports = {
  comparePassword: (password, hashed) => {
    return bcrypt.compare(password, hashed);
  },

  convertToPastDate: (duration) => {
    const regex = /(\d+w)?(\d+d)?(\d+h)?(\d+m)?(\d+s)?/;
    const matches = duration.match(regex);

    const weeks = matches[1] ? parseInt(matches[1]) : 0;
    const days = matches[2] ? parseInt(matches[2]) : 0;
    const hours = matches[3] ? parseInt(matches[3]) : 0;
    const minutes = matches[4] ? parseInt(matches[4]) : 0;
    const seconds = matches[5] ? parseInt(matches[5]) : 0;

    const pastMoment = moment()
      .subtract(weeks, "weeks")
      .subtract(days, "days")
      .subtract(hours, "hours")
      .subtract(minutes, "minutes")
      .subtract(seconds, "seconds");

    return pastMoment.format("YYYY-MM-DD HH:mm:ss");
  },

  formatBytes: (bytes) => {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 Byte";
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
    const value = bytes / Math.pow(1024, i);
    return `${value.toFixed(2)} ${sizes[i]}`;
  },

  formatBytesnonSuffix: (bytes) => {
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
    const value = bytes / Math.pow(1024, i);
    return value.toFixed(2);
  },

  generateDateArray: (startDate, endDate) => {
    const dateArray = [];
    const currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);

    while (currentDate <= endDateObj) {
      const formattedDate = currentDate.toISOString().slice(0, 10);
      dateArray.push(formattedDate);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dateArray;
  },

  generateRefreshToken: async (id) => {
    const getFormatedTime = (format) => {
      var now = new Date();

      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");

      if (format == "datetime") {
        format = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }

      if (format == "date") {
        format = `${year}-${month}-${day}`;
      }

      if (format == "week") {
        now = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");

        format = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }

      return format;
    };

    const token = await database.query(
      `
        INSERT INTO refresh_tokens (user_id, token, expire_at, created_at) VALUES(
            '${id}',
            '${randomstring.generate(40)}',
            '${await getFormatedTime("week")}',
            '${await getFormatedTime("datetime")}'
        ) RETURNING token
    `
    );

    return token[0][0].token;
  },

  generateTicketNumber: async () => {
    // Retrieve the current maximum ticket number
    const [result] = await database.query(
      "SELECT MAX(code) as max_ticket_number FROM helpdesk"
    );
    const maxTicket = result[0].max_ticket_number || 0;
    // Extract the numeric part of the current ticket number
    const numericPart = parseInt(maxTicket.slice(1), 10);
    // Increment the numeric part
    const nextNumericPart = numericPart + 1;
    // Format the next ticket number
    const nextTicketNumber = `#${String(nextNumericPart).padStart(7, "0")}`;

    return nextTicketNumber;
  },

  generateToken: (id) => {
    return jwt.sign({ id }, env.JWT_SECRET, {
      expiresIn: 60 * 60 * 24 * 365,
    });
  },

  getAveragefromArray: (array) => {
    const sum = array.reduce(
      (accumulator, currentValue) => accumulator + currentValue,
      0
    );

    const avg = sum / array.length;

    return avg;
  },

  getFormatedTime: (format) => {
    var now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    if (format == "datetime") {
      format = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    if (format == "date") {
      format = `${year}-${month}-${day}`;
    }

    if (format == "week") {
      now = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);

      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");

      format = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    return format;
  },

  getRandomInt: async (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  hashPassword: (password) => {
    return new Promise((resolve, reject) => {
      bcrypt.genSalt(12, (err, salt) => {
        if (err) {
          reject(err);
        }

        bcrypt.hash(password, salt, (err, hash) => {
          if (err) {
            reject(err);
          }

          resolve(hash);
        });
      });
    });
  },

  mikrotikCommand: async (router, command) => {
    const user = router.username;
    const pass = router.pass;

    const connectOptions = {
      host: router.host,
      port: router.port,
      debug: false,
    };

    let data;

    const client = RouterClient.createClient(connectOptions);

    await client.login(user, pass);

    data = await client.command(command).get();

    client.close();

    return data.replies;
  },

  randomTokenString: () => {
    return randomstring.generate(40);
  },

  response: async (res, statuscode, message, data = {}) => {
    return res.status(statuscode).json({
      statuscode,
      message,
      data,
    });
  },

  sendPostData: async (url, params) => {
    const baseUrl = "https://api-mikrotik.linkdemo.web.id/api";

    try {
      const response = await axios.post(baseUrl + url, params);
      const responseData = response.data;

      // Now you can work with the JSON response content
      return responseData;
    } catch (error) {
      console.error("Error fetching data:", error);
      return null;
    }
  },
};
