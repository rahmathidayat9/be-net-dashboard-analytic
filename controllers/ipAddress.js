const database = require("../config/database");
const helper = require("../helpers");

require("dotenv").config();

module.exports = {
  // NOTE ambil list data
  index: async (req, res) => {
    try {
      const data = await database.query(`
        SELECT * FROM ip_addresses ORDER BY id ASC
    `);

      return helper.response(res, 200, "List IP Address", data[0]);
    } catch (error) {
      return helper.response(res, 400, "Error : " + error, error);
    }
  },
  // NOTE delete satu data
  destroy: async (req, res) => {
    try {
      const data = await database.query(
        `SELECT * FROM ip_addresses WHERE id = ${req.params.id}`
      );

      if (data[0].length == 0) {
        return helper.response(res, 400, "IP tidak ditemukan");
      }

      await database.query(
        `DELETE FROM ip_addresses WHERE id = ${req.params.id}`
      );

      return helper.response(res, 200, "IP Address deleted");
    } catch (error) {
      return helper.response(res, 400, "Error : " + error, error);
    }
  },
  // NOTE ambil satu data
  show: async (req, res) => {
    try {
      const data = await database.query(`
          SELECT * FROM ip_addresses WHERE id = ${req.params.id}
      `);

      return helper.response(res, 200, "IP Address", data[0]);
    } catch (error) {
      return helper.response(res, 400, "Error : " + error, error);
    }
  },
  // NOTE tambah data
  store: async (req, res) => {
    try {
      const exists = await database.query(`
            SELECT * FROM ip_addresses WHERE ip = '${req.body.ip}'
        `);

      if (exists[0].length > 0) {
        return helper.response(res, 400, "IP sudah terdaftar");
      }

      await database.query(
        `
          INSERT INTO ip_addresses(ip, created_at) VALUES(
              '${req.body.ip}',
              '${await helper.getFormatedTime("datetime")}'
          )
        `
      );

      const data = await database.query(`
          SELECT * FROM ip_addresses WHERE ip = '${req.body.ip}'
      `);

      return helper.response(res, 200, "IP Saved", data[0]);
    } catch (error) {
      return helper.response(res, 400, "Error : " + error, error);
    }
  },
  // NOTE update data
  update: async (req, res) => {
    try {
      let data = await database.query(`
          SELECT * FROM ip_addresses WHERE id = ${req.params.id}
      `);

      if (data[0].length == 0) {
        return helper.response(res, 400, "IP tidak ditemukan");
      }

      const exists = await database.query(`
            SELECT * FROM ip_addresses WHERE ip = '${req.body.ip}' AND id <> ${req.params.id}
        `);

      if (exists[0].length > 0) {
        return helper.response(res, 400, "IP sudah terdaftar");
      }

      await database.query(
        `
        UPDATE ip_addresses SET ip =  '${
          req.body.ip
        }', updated_at = '${await helper.getFormatedTime(
          "datetime"
        )}' WHERE id = ${req.params.id}
        `
      );

      data = await database.query(`
        SELECT * FROM ip_addresses WHERE id = ${req.params.id}
    `);

      return helper.response(res, 200, "IP updated", data[0]);
    } catch (error) {
      return helper.response(res, 400, "Error : " + error, error);
    }
  },
};
