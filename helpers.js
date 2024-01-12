const axios = require("axios");
const bcrypt = require("bcrypt");

const database = require("./config/database.js");

const sendPostData = async (url, params) => {
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
};

const getRandomInt = async (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);

  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateTicketNumber = async () => {
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
};

const getFormatedTime = (format) => {
  const now = new Date();
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

  return format;
};

const hashPassword = (password) => {
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
};

module.exports = {
  sendPostData,
  getRandomInt,
  generateTicketNumber,
  getFormatedTime,
  hashPassword,
};
