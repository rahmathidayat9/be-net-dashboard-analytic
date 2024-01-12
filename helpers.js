const axios = require("axios");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const randomstring = require("randomstring");

const database = require("./config/database.js");

dotenv.config();

const env = process.env;

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

// NOTE verifying user password
const comparePassword = (password, hashed) => {
  return bcrypt.compare(password, hashed);
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

// generate token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, env.JWT_SECRET, {
    expiresIn: 60 * 60 * 24 * 365,
  });
};

// generate refresh token
const generateRefreshToken = async (id) => {
  await database.query(
    `
        INSERT INTO refresh_tokens (user_id, token, expire_at, created_at) VALUES(
            '${id}',
            '${randomTokenString()}',
            '${await getFormatedTime("week")}',
            '${await getFormatedTime("datetime")}'
        )
    `
  );

  var token = await database.query(
    `SELECT * FROM refresh_tokens WHERE user_id = '${id}' AND revoked IS NULL`
  );

  return token[0][0].token;
};

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

const getRandomInt = async (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);

  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// NOTE hashing password
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

// NOTE random string untuk token
function randomTokenString() {
  return randomstring.generate(40);
}

// NOTE API response
const response = async (res, statuscode, message, data = {}) => {
  return res.status(statuscode).json({
    statuscode,
    message,
    data,
  });
};

module.exports = {
  comparePassword,
  getRandomInt,
  generateTicketNumber,
  generateToken,
  generateRefreshToken,
  getFormatedTime,
  hashPassword,
  sendPostData,
  response,
};
