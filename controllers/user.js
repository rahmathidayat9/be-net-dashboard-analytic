const axios = require("axios");
const moment = require("moment");

const database = require("../config/database");
const helper = require("../helpers");

module.exports = {
  index: async (req, res) => {
    try {
      const data = await database.query(`
        SELECT id, name, email, username, role, created_at, updated_at FROM users WHERE deleted_at IS NULL AND role <> 'superadmin' ORDER BY name ASC
      `);

      return helper.response(res, 200, "Data ditemukan", data[0]);
    } catch (error) {
      return helper.response(res, 400, "Error : " + error, error);
    }
  },

  changePassword: async (req, res) => {
    try {
      const { oldPassword, password, password_conf } = req.body;

      const match = await helper.comparePassword(
        oldPassword,
        req.user.password
      );

      if (!match) {
        return helper.response(res, 400, "Password tidak cocok");
      }

      if (!password) {
        return helper.response(res, 400, "Mohon isi password");
      } else if (password.length < 8) {
        return helper.response(
          res,
          400,
          "Password harus mengandung paling sedikit 8 karakter"
        );
      } else if (password !== password_conf) {
        return helper.response(res, 400, "Konfirmasi password salah");
      }

      await database.query(
        `
            UPDATE users
            SET password = '${await helper.hashPassword(
              password
            )}', updated_at = '${await helper.getFormatedTime("datetime")}'
            WHERE id = '${req.user.id}'
        `
      );

      return helper.response(res, 200, "Password berhasil diubah");
    } catch (error) {
      return helper.response(res, 400, "Error : " + error, error);
    }
  },

  destroy: async (req, res) => {
    try {
      const id = req.params.id;

      const oldData = await database.query(`
            SELECT * FROM users WHERE deleted_at IS NULL AND role <> 'superadmin' AND id = '${id}'
        `);

      if (oldData[0].length == 0) {
        return helper.response(res, 400, "Data tidak ditemukan");
      }

      await database.query(
        `
            UPDATE users
            SET deleted_at = '${await helper.getFormatedTime(
              "datetime"
            )}', updated_at = '${await helper.getFormatedTime("datetime")}'
            WHERE id = '${id}'
        `
      );

      return helper.response(res, 200, "User berhasil dihapus");
    } catch (error) {
      return helper.response(res, 400, "Error : " + error, error);
    }
  },

  profile: async (req, res) => {
    try {
      const data = await database.query(`
            SELECT id, name, email, username, role, created_at, updated_at FROM users WHERE deleted_at IS NULL AND role <> 'superadmin' AND id = '${req.user.id}' ORDER BY name ASC
          `);

      return helper.response(res, 200, "Data ditemukan", data[0]);
    } catch (error) {
      return helper.response(res, 400, "Error : " + error, error);
    }
  },

  show: async (req, res) => {
    try {
      const id = req.params.id;

      const data = await database.query(`
            SELECT id, name, email, username, role, created_at, updated_at FROM users WHERE deleted_at IS NULL AND role <> 'superadmin' AND id = '${id}' ORDER BY name ASC
          `);

      return helper.response(res, 200, "Data ditemukan", data[0]);
    } catch (error) {
      return helper.response(res, 400, "Error : " + error, error);
    }
  },

  store: async (req, res) => {
    try {
      const { name, email, username, password, role } = req.body;

      if (!name) {
        return helper.response(res, 400, "Mohon isi nama");
      } else if (!email) {
        return helper.response(res, 400, "Mohon isi email");
      } else if (!username) {
        return helper.response(res, 400, "Mohon isi username");
      } else if (!password) {
        return helper.response(res, 400, "Mohon isi password");
      } else if (password.length < 8) {
        return helper.response(
          res,
          400,
          "Password harus mengandung paling sedikit 8 karakter"
        );
      } else if (!role) {
        return helper.response(res, 400, "Mohon isi role");
      } else if (role !== "satker" && role !== "teknisi" && role !== "admin") {
        return helper.response(res, 400, "Mohon isi role yang valid");
      }

      const emailRegistered = await database.query(`
        SELECT * FROM users WHERE deleted_at IS NULL AND role <> 'superadmin' AND email = '${email}'
      `);

      if (emailRegistered[0].length > 0) {
        return helper.response(res, 400, "E-mail sudah terdaftar");
      }

      const usernameRegistered = await database.query(`
        SELECT * FROM users WHERE deleted_at IS NULL AND role <> 'superadmin' AND username = '${username}'
      `);

      if (usernameRegistered[0].length > 0) {
        return helper.response(res, 400, "Username sudah terdaftar");
      }

      await database.query(
        `
            INSERT INTO users(name, email, username, password, role, created_at) VALUES(
                '${name}',
                '${email}',
                '${username}',
                '${await helper.hashPassword(password)}',
                '${role}',
                '${await helper.getFormatedTime("datetime")}'
            )
        `
      );

      const data = await database.query(`
         SELECT id, name, email, username, role, created_at, updated_at FROM users WHERE deleted_at IS NULL AND role <> 'superadmin' AND username = '${username}'
      `);

      return helper.response(res, 201, "User berhasil ditambahkan", data[0]);
    } catch (error) {
      return helper.response(res, 400, "Error : " + error, error);
    }
  },

  update: async (req, res) => {
    try {
      const id = req.params.id;

      let { name, email, username, role } = req.body;

      const oldData = await database.query(`
            SELECT * FROM users WHERE deleted_at IS NULL AND role <> 'superadmin' AND id = '${id}'
        `);

      if (oldData[0].length == 0) {
        return helper.response(res, 400, "Data tidak ditemukan");
      }

      if (!name) {
        name = oldData[0][0].name;
      } else if (!email) {
        email = oldData[0][0].email;
      } else if (!username) {
        username = oldData[0][0].username;
      } else if (!role) {
        role = oldData[0][0].role;
      } else if (role !== "satker" && role !== "teknisi" && role !== "admin") {
        return helper.response(res, 400, "Mohon isi role yang valid");
      }

      const emailRegistered = await database.query(`
        SELECT * FROM users WHERE deleted_at IS NULL AND role <> 'superadmin' AND email = '${email}' AND id <> ${id} ORDER BY name ASC
      `);

      if (emailRegistered[0].length > 0) {
        return helper.response(res, 400, "E-mail sudah terdaftar");
      }

      const usernameRegistered = await database.query(`
        SELECT * FROM users WHERE deleted_at IS NULL AND role <> 'superadmin' AND username = '${username}' AND id <> ${id} ORDER BY name ASC
      `);

      if (usernameRegistered[0].length > 0) {
        return helper.response(res, 400, "Username sudah terdaftar");
      }

      await database.query(
        `
            UPDATE users
            SET name = '${name}', email = '${email}', username = '${username}', role = '${role}', updated_at = '${await helper.getFormatedTime(
          "datetime"
        )}'
            WHERE id = '${id}'
        `
      );

      const data = await database.query(`
         SELECT id, name, email, username, role, created_at, updated_at FROM users WHERE deleted_at IS NULL AND role <> 'superadmin' AND id = '${id}' ORDER BY name ASC
      `);

      return helper.response(res, 200, "User berhasil diperbaharui", data[0]);
    } catch (error) {
      return helper.response(res, 400, "Error : " + error, error);
    }
  },
};
