const moment = require("moment");

const database = require("../config/database");
const helper = require("../helpers");

require("dotenv").config();

module.exports = {
  // NOTE list route
  index: async (req, res) => {
    try {
      const data = await database.query(`
        SELECT * FROM routers WHERE deleted_at IS NULL
      `);

      return helper.response(res, 200, "List Router", data[0]);
    } catch (error) {
      return helper.response(res, 400, "Error : " + error, error);
    }
  },

  // NOTE active route
  active: async (req, res) => {
    try {
      const id = req.params.id;

      const valid = await database.query(`
        SELECT * FROM routers WHERE deleted_at IS NULL AND status = 'deactive' AND id = ${id}
      `);

      if (valid[0].length == 0) {
        return helper.response(res, 400, "Data tidak ditemukan");
      }

      await database.query(
        `
           UPDATE routers SET status = 'active' WHERE id = ${id}
          `
      );

      const data = await database.query(`
        SELECT * FROM routers WHERE id = '${id}'
    `);

      return helper.response(res, 200, "Router berhasil diaktifkan", data[0]);
    } catch (error) {
      return helper.response(res, 400, "Error : " + error, error);
    }
  },

  // NOTE deactive route
  deactive: async (req, res) => {
    try {
      const id = req.params.id;

      const valid = await database.query(`
        SELECT * FROM routers WHERE deleted_at IS NULL AND status = 'active' AND id = ${id}
      `);

      if (valid[0].length == 0) {
        return helper.response(res, 400, "Data tidak ditemukan");
      }

      await database.query(
        `
           UPDATE routers SET status = 'deactive' WHERE id = ${id}
          `
      );

      const data = await database.query(`
        SELECT * FROM routers WHERE id = '${id}'
    `);

      return helper.response(
        res,
        200,
        "Router berhasil dinonaktifkan",
        data[0]
      );
    } catch (error) {
      return helper.response(res, 400, "Error : " + error, error);
    }
  },

  // NOTE hapus route
  destroy: async (req, res) => {
    try {
      const id = req.params.id;

      const valid = await database.query(`
        SELECT * FROM routers WHERE deleted_at IS NULL AND id = ${id}
      `);

      if (valid[0].length == 0) {
        return helper.response(res, 400, "Data tidak ditemukan");
      }

      await database.query(
        `
           UPDATE routers SET deleted_at = '${await helper.getFormatedTime(
             "datetime"
           )}' WHERE id = ${id}
          `
      );

      const data = await database.query(`
        SELECT * FROM routers WHERE id = '${id}'
    `);

      return helper.response(res, 200, "Router berhasil dihapus", data[0]);
    } catch (error) {
      return helper.response(res, 400, "Error : " + error, error);
    }
  },

  // NOTE list route by id
  show: async (req, res) => {
    try {
      const id = req.params.id;

      const data = await database.query(`
        SELECT * FROM routers WHERE id = '${id}' AND deleted_at IS NULL
      `);

      return helper.response(res, 200, "List Router", data[0]);
    } catch (error) {
      return helper.response(res, 400, "Error : " + error, error);
    }
  },

  // NOTE tambah route
  store: async (req, res) => {
    try {
      let { uuid, name, ipaddress, user_name, pass, internet, port } = req.body;

      switch (true) {
        case !uuid:
          return helper.response(res, 400, "Mohon isi uuid");
          break;
        case !name:
          return helper.response(res, 400, "Mohon isi name");
          break;
        case !ipaddress:
          return helper.response(res, 400, "Mohon isi ipaddress");
          break;
        case !user_name:
          return helper.response(res, 400, "Mohon isi user_name");
          break;
        case !pass:
          return helper.response(res, 400, "Mohon isi pass");
          break;
        case !port:
          return helper.response(res, 400, "Mohon isi port");
          break;
      }

      port = parseInt(req.body.port);

      await database.query(
        `
            INSERT INTO routers(uuid, name, ipaddress, user_name, pass, internet, port, status, created_at) VALUES(
                '${uuid}',
                '${name}',
                '${ipaddress}',
                '${user_name}',
                '${pass}',
                '${internet}',
                '${port}',
                'active',
                '${await helper.getFormatedTime("datetime")}'
            )
          `
      );

      const data = await database.query(`
        SELECT * FROM routers WHERE uuid = '${uuid}'
    `);

      return helper.response(res, 201, "Data berhasil ditambahkan", data[0]);
    } catch (error) {
      return helper.response(res, 400, "Error : " + error, error);
    }
  },

  // NOTE update route
  update: async (req, res) => {
    try {
      const id = req.params.id;

      let { uuid, name, ipaddress, user_name, pass, internet, port } = req.body;

      switch (true) {
        case !uuid:
          return helper.response(res, 400, "Mohon isi uuid");
          break;
        case !name:
          return helper.response(res, 400, "Mohon isi name");
          break;
        case !ipaddress:
          return helper.response(res, 400, "Mohon isi ipaddress");
          break;
        case !user_name:
          return helper.response(res, 400, "Mohon isi user_name");
          break;
        case !pass:
          return helper.response(res, 400, "Mohon isi pass");
          break;
        case !port:
          return helper.response(res, 400, "Mohon isi port");
          break;
      }

      port = parseInt(req.body.port);

      await database.query(
        `
            UPDATE routers SET uuid = '${uuid}', name = '${name}', ipaddress = '${ipaddress}', user_name = '${user_name}', pass = '${pass}', internet = '${internet}', port = '${port}', updated_at = '${await helper.getFormatedTime(
          "datetime"
        )}' WHERE id = ${id}
          `
      );

      const data = await database.query(`
        SELECT * FROM routers WHERE uuid = '${uuid}'
    `);

      return helper.response(res, 200, "Data berhasil diperbaharui", data[0]);
    } catch (error) {
      return helper.response(res, 400, "Error : " + error, error);
    }
  },
};
