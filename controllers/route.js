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
          UPDATE routers SET status = 'deactive'
        `
      );

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
      let { name, host, username, pass, port, ethernet } = req.body;

      switch (true) {
        case !host:
          return helper.response(res, 400, "Mohon isi host");
          break;
        case !username:
          return helper.response(res, 400, "Mohon isi name");
          break;
        case !pass:
          return helper.response(res, 400, "Mohon isi ipaddress");
          break;
        case !port:
          return helper.response(res, 400, "Mohon isi user_name");
          break;
      }

      ethernet =
        ethernet !== undefined && ethernet !== "" ? ethernet : "ether1";

      port = parseInt(req.body.port);

      await database.query(
        `
            INSERT INTO routers(name, host, username, pass, port, ethernet, status, created_at) VALUES(
                '${name}',
                '${host}',
                '${username}',
                '${pass}',
                '${port}',
                '${ethernet}',
                'deactive',
                '${await helper.getFormatedTime("datetime")}'
            )
          `
      );

      const data = await database.query(`
        SELECT * FROM routers WHERE host = '${host}'
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

      let { name, host, username, pass, port, ethernet } = req.body;

      switch (true) {
        case !host:
          return helper.response(res, 400, "Mohon isi host");
          break;
        case !username:
          return helper.response(res, 400, "Mohon isi name");
          break;
        case !pass:
          return helper.response(res, 400, "Mohon isi ipaddress");
          break;
        case !port:
          return helper.response(res, 400, "Mohon isi user_name");
          break;
      }

      const oldData = await database.query(
        `
          SELECT * FROM routers WHERE id = ${id}
        `
      );

      ethernet =
        ethernet !== undefined && ethernet !== ""
          ? ethernet
          : oldData[0][0].ethernet;

      await database.query(
        `
          UPDATE routers SET name = '${name}', host = '${host}', username = '${username}', pass = '${pass}', ethernet = '${ethernet}', port = '${port}', updated_at = '${await helper.getFormatedTime(
          "datetime"
        )}' WHERE id = ${id}
        `
      );

      const data = await database.query(`
        SELECT * FROM routers WHERE id = '${id}'
    `);

      return helper.response(res, 200, "Data berhasil diperbaharui", data[0]);
    } catch (error) {
      return helper.response(res, 400, "Error : " + error, error);
    }
  },
};
