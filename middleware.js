const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

const database = require("./config/database.js");
const helper = require("./helpers");

dotenv.config();

const env = process.env;

module.exports = {
  // NOTE middleware login
  auth: async (req, res, next) => {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      try {
        token = req.headers.authorization.split(" ")[1];

        const decoded = jwt.verify(token, env.JWT_SECRET);

        let user = await database.query(
          `SELECT * FROM users WHERE id = ${decoded.id}`
        );

        req.user = user[0][0];

        next();
      } catch (err) {
        return helper.response(res, 400, "Token Expired");
      }
    } else {
      return helper.response(res, 400, "Header Authentication Is Missing");
    }
  },

  // NOTE middleware bottom
  bottomRole: async (req, res, next) => {
    try {
      if (req.user.role == "teknisi" || req.user.role == "satker") {
        next();
      }
    } catch (err) {
      return helper.response(
        res,
        403,
        "Anda tidak diperkenankan menggunakan fitur ini"
      );
    }
  },

  // NOTE middleware upper
  upperRole: async (req, res, next) => {
    try {
      if (req.user.role == "super admin" || req.user.role == "admin") {
        next();
      }
    } catch (err) {
      return helper.response(
        res,
        403,
        "Anda tidak diperkenankan menggunakan fitur ini"
      );
    }
  },
};
