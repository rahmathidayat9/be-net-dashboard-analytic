const axios = require("axios");

const database = require("../config/database");
const helper = require("../helpers");

require("dotenv").config();

module.exports = {
  // NOTE list route
  index: async (req, res) => {
    try {
      await database.query(
        `
               DELETE FROM internets WHERE uuid = '${req.params.uuid}'
          `
      );

      const url =
        process.env.MICROTIC_API_ENV + "api/router/interface/list/print";

      const params = {
        uuid: req.params.uuid,
      };

      const response = await axios.post(url, params);

      let arrData = [];

      if (response.data.success) {
        const responseData = response.data.massage;

        responseData.forEach(async (value) => {
          arrData.push({
            uuid: req.params.uuid,
            name: value.name,
          });

          await database.query(
            `
                INSERT INTO internets(uuid, name, created_at) VALUES(
                    '${req.params.uuid}',
                    '${value.name}',
                    '${await helper.getFormatedTime("datetime")}'
                ) 
            `
          );
        });
      }

      return helper.response(res, 200, "List Internet", arrData);
    } catch (error) {
      return helper.response(res, 400, "Error : " + error, error);
    }
  },
};
