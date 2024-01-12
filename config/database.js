const dotenv = require("dotenv");

const { Sequelize } = require("sequelize");

dotenv.config();

const sequelize = new Sequelize(
  process.env.DATABASE_DB,
  process.env.DATABASE_USERNAME,
  process.env.DATABASE_PASSWORD,
  {
    host: process.env.DATABASE_HOST,
    dialect: "postgres",
  }
);

try {
  sequelize.authenticate();
  console.log("Connection has been established successfully.");
} catch (error) {
  console.error("Unable to connect to the database:", error);
}

module.exports = sequelize;
