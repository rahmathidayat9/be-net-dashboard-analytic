const database = require("../config/database");
const helper = require("../helpers");

module.exports = {
  // NOTE list ticket
  index: async (req, res) => {
    try {
      let data = await database.query(`
        SELECT
            tickets."id", 
            tickets.detail, 
            tickets.status, 
            tickets.created_at,
            users."name" AS "user", 
            priorities."name" AS priority
        FROM
            users
            INNER JOIN
            tickets
            ON 
                users."id" = tickets.user_id
            LEFT JOIN
            priorities
            ON 
              tickets.priority_id = priorities."id"
        WHERE
            tickets.status <> 'deleted'
        ORDER BY
            tickets.created_at DESC
      `);

      if (req.user.role == "teknisi" || req.user.role == "satker") {
        data = await database.query(`
          SELECT
            tickets."id", 
            tickets.detail, 
            tickets.status, 
            tickets.created_at,
            users."name" AS "user", 
            priorities."name" AS priority
          FROM
            tickets
            INNER JOIN
            users
            ON 
              tickets.user_id = users."id"
            LEFT JOIN
            priorities
            ON 
              tickets.priority_id = priorities."id"
          WHERE
            tickets.user_id = ${req.user.id}
            AND
	          tickets.status <> 'pending'
            AND
	          tickets.status <> 'deleted'
          ORDER BY
	          tickets.created_at DESC
        `);
      }

      return helper.response(res, 200, "List Tiket", data[0]);
    } catch (err) {
      return helper.response(res, 400, "Error : " + err, err);
    }
  },

  // NOTE hapus tiket
  destroy: async (req, res) => {
    try {
      const id = req.params.id;

      let ticket = await database.query(`
        SELECT * FROM tickets WHERE id = ${id} AND tickets.status <> 'deleted'
      `);

      if (ticket[0].length == 0) {
        return helper.response(res, 400, "Data tidak ditemukan");
      }

      await database.query(
        `UPDATE tickets SET status = 'deleted', updated_at = now() WHERE id = ${id}`
      );

      return helper.response(res, 200, "Tiket berhasil dihapus");
    } catch (err) {
      return helper.response(res, 400, "Error : " + err, err);
    }
  },

  // NOTE balas ticket
  reply: async (req, res) => {
    try {
      const id = req.params.id;

      let { note, priority_id, status } = req.body;

      if (!note) {
        return helper.response(res, 400, "Mohon isi note");
      }

      let ticket;

      if (req.user.role == "teknisi" || req.user.role == "satker") {
        ticket = await database.query(`
          SELECT * FROM tickets WHERE id = ${id} AND user_id = ${req.user.id} AND tickets.status <> 'deleted'
        `);

        if (ticket[0].length == 0) {
          return helper.response(res, 400, "Data tidak ditemukan");
        }
      } else {
        ticket = await database.query(`
          SELECT * FROM tickets WHERE id = ${id} AND tickets.status <> 'deleted'
        `);

        if (ticket[0].length == 0) {
          return helper.response(res, 400, "Data tidak ditemukan");
        }

        if (!priority_id || priority_id == "" || priority_id.length == 0) {
          priority_id = ticket[0][0].priority_id;
        }

        if (!status || status == "" || status.length == 0) {
          status =
            ticket[0][0].status == "pending"
              ? "processed"
              : ticket[0][0].status;
        }

        await database.query(
          `UPDATE tickets SET priority_id = ${priority_id}, status = '${status}', updated_at = now() WHERE id = ${id}`
        );
      }

      await database.query(
        `
          INSERT INTO ticket_logs(user_id, ticket_id, note, created_at) VALUES(
              '${req.user.id}',
              '${id}',
              '${note}',
              '${await helper.getFormatedTime("datetime")}'
          ) RETURNING *
        `
      );

      return helper.response(res, 200, "Balasan berhasil dikirim");
    } catch (err) {
      return helper.response(res, 400, "Error : " + err, err);
    }
  },

  // NOTE detail tiket
  show: async (req, res) => {
    try {
      const id = req.params.id;

      let ticket = await database.query(`
        SELECT
            tickets."id", 
            tickets.detail, 
            tickets.status, 
            tickets.created_at,
            users."name" AS "user", 
            priorities."name" AS priority
        FROM
            users
            INNER JOIN
            tickets
            ON 
                users."id" = tickets.user_id
            LEFT JOIN
            priorities
            ON 
              tickets.priority_id = priorities."id"
        WHERE
            tickets.id = ${id}
            AND
            tickets.status <> 'deleted'
        ORDER BY
            tickets.created_at DESC
      `);

      if (req.user.role == "teknisi" || req.user.role == "satker") {
        ticket = await database.query(`
          SELECT
            tickets."id", 
            tickets.detail, 
            tickets.status, 
            tickets.created_at,
            users."name" AS "user", 
            priorities."name" AS priority
          FROM
            tickets
            INNER JOIN
            users
            ON 
              tickets.user_id = users."id"
            LEFT JOIN
            priorities
            ON 
              tickets.priority_id = priorities."id"
          WHERE
            tickets.id = ${id},
            AND
            tickets.user_id = ${req.user.id}
            AND
	          tickets.status <> 'pending'
            AND
            tickets.status <> 'deleted'
          ORDER BY
	          tickets.created_at DESC
        `);
      }

      if (ticket[0].length == 0) {
        return helper.response(res, 400, "Data tidak ditemukan");
      }

      const logs = await database.query(`
        SELECT
          ticket_logs.note, 
          ticket_logs.created_at, 
          users."name" AS "user"
        FROM
          ticket_logs
          INNER JOIN
          users
          ON 
            ticket_logs.user_id = users."id"
        WHERE
          ticket_logs.ticket_id = ${id}
        ORDER BY
          ticket_logs.created_at DESC
      `);

      const data = {
        ticket: ticket[0][0],
        logs: logs[0],
      };

      return helper.response(res, 200, "Detail Tiket", data);
    } catch (err) {
      return helper.response(res, 400, "Error : " + err, err);
    }
  },

  // NOTE create tiket
  store: async (req, res) => {
    try {
      let { detail, note } = req.body;

      switch (true) {
        case !detail:
          return helper.response(res, 400, "Mohon isi detail");
        case !note:
          return helper.response(res, 400, "Mohon isi note");
      }

      const data = await database.query(
        `
          INSERT INTO tickets(user_id, detail, created_at) VALUES(
              '${req.user.id}',
              '${detail}',
              '${await helper.getFormatedTime("datetime")}'
          ) RETURNING *
        `
      );

      await database.query(
        `
          INSERT INTO ticket_logs(user_id, ticket_id, note, created_at) VALUES(
              '${req.user.id}',
              '${data[0][0].id}',
              '${note}',
              '${await helper.getFormatedTime("datetime")}'
          ) RETURNING *
        `
      );

      return helper.response(
        res,
        200,
        "Tiket berhasil ditambahkan",
        data[0][0]
      );
    } catch (err) {
      return helper.response(res, 400, "Error : " + err, err);
    }
  },
};
