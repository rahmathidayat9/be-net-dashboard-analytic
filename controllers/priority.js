const database = require("../config/database");
const helper = require("../helpers");

module.exports = {
  // NOTE list priotritas
  index: async (req, res) => {
    try {
      const data = await database.query(`
          SELECT * FROM priorities ORDER BY id ASC
      `);

      return helper.response(res, 200, "List Priority", data[0]);
    } catch (err) {
      return helper.response(res, 400, "Error : " + err, err);
    }
  },
};
