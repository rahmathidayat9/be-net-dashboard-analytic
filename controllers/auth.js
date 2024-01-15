const moment = require("moment");

const database = require("../config/database");
const helper = require("../helpers");

module.exports = {
  // NOTE proses login
  login: async (req, res) => {
    try {
      let { username, password } = req.body;

      if (!username || username == "") {
        return helper.response(res, 400, "Mohon isi username anda");
      } else if (!password || password == "") {
        return helper.response(res, 400, "Mohon isi password anda");
      } else if (password.length < 8) {
        return helper.response(
          res,
          400,
          "Password harus mengandung setidaknya 8 karakter"
        );
      }

      var user = await database.query(`
          SELECT * FROM users WHERE username = '${username}'
      `);

      if (user[0].length == 0) {
        return helper.response(res, 400, "username tidak ditemukan");
      }

      user = user[0][0];

      const match = await helper.comparePassword(password, user.password);

      if (!match) {
        return helper.response(res, 400, "Password tidak cocok");
      }

      await database.query(`
          INSERT INTO auth_logs (user_id, created_at) VALUES (
              '${user.id}',
              '${await helper.getFormatedTime("datetime")}'
          )
      `);

      await database.query(
        `UPDATE refresh_tokens SET revoked = now(), updated_at = now() WHERE user_id = '${user.id}'`
      );

      const token = helper.generateToken(user.id);

      const refreshToken = await helper.generateRefreshToken(user.id);

      const data = {
        user_id: user.id,
        token,
        name: user.name,
        email: user.email,
        username: user.username,
        jabatan: user.role,
        refreshToken,
      };

      return helper.response(res, 200, "Login berhasil", data);
    } catch (err) {
      return helper.response(res, 400, "Error : " + err, err);
    }
  },

  // NOTE refresh token
  refresh: async (req, res) => {
    try {
      let { token } = req.body;

      if (!token) {
        return helper.response(res, 400, "Mohon Masukan Token");
      }

      var refreshToken = await database.query(
        `SELECT * FROM refresh_tokens WHERE token = '${token}' AND revoked IS NULL`
      );

      if (refreshToken[0].length == 0) {
        return helper.response(res, 400, "Token tidak terdaftar");
      }

      refreshToken = refreshToken[0][0];

      if (
        moment(refreshToken.expire_at).toISOString() < moment().toISOString()
      ) {
        return helper.response(res, 400, "Token sudah kedaluarsa");
      }

      await database.query(
        `UPDATE refresh_tokens SET revoked = now() WHERE user_id = '${refreshToken.user_id}'`
      );

      token = helper.generateToken(refreshToken.user_id);

      refreshToken = await helper.generateRefreshToken(refreshToken.user_id);

      const data = {
        token,
        refreshToken,
      };

      return helper.response(res, 200, "Token berhasil direfresh", data);
    } catch (err) {
      return helper.response(res, 400, "Error : " + err, err);
    }
  },
};
