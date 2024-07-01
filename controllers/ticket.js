const moment = require("moment");

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
            tickets.number,
            tickets.due_date,
            tickets.cause,
            tickets.solution,
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

      if (req.params.role == "teknisi" || req.params.role == "satker") {
        data = await database.query(`
          SELECT
            tickets."id", 
            tickets.detail, 
            tickets.status, 
            tickets.created_at,
            tickets.number,
            tickets.due_date,
            tickets.cause,
            tickets.solution,
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
            tickets.user_id = ${req.params.user_id}
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

  // NOTE hitung tiket
  count: async (req, res) => {
    // status = pending, processed, deleted, closed, all (x)
    try {
      const status = req.params.status;

      let ticket = await database.query(`
        SELECT * FROM tickets WHERE status = '${status}'
      `);

      if (status == "all") {
        ticket = await database.query(`
          SELECT * FROM tickets WHERE status <> 'deleted'
        `);
      } else if (status == "deleted") {
        ticket = await database.query(`
          SELECT * FROM tickets WHERE status = 'deleted'
        `);
      }

      const data = {
        ticket: ticket[0].length,
      };

      return helper.response(res, 200, "Data ditemukan", data);
    } catch (err) {
      return helper.response(res, 400, "Error : " + err, err);
    }
  },

  // NOTE closed ticket
  closed: async (req, res) => {
    try {
      const id = req.params.id;

      let { cause, solution, user_id } = req.body;

      switch (true) {
        case !cause:
          return helper.response(res, 400, "Mohon isi cause");
          break;
        case !solution:
          return helper.response(res, 400, "Mohon isi solution");
          break;
      }

      const note = `Isu terselesaikan. Penyebab: ${cause}, diselesaikan dengan: ${solution}`;

      await database.query(
        `UPDATE tickets SET cause = '${cause}', solution = '${solution}', status = 'closed', updated_at = now() WHERE id = ${id}`
      );

      await database.query(
        `
            INSERT INTO ticket_logs(user_id, ticket_id, note, created_at) VALUES(
                '${user_id}',
                '${id}',
                '${note}',
                '${await helper.getFormatedTime("datetime")}'
            ) RETURNING *
          `
      );

      return helper.response(res, 200, "Status berhasil diperbaharui");
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

  // NOTE pending ticket
  pending: async (req, res) => {
    try {
      const id = req.params.id;

      let { reason, user_id } = req.body;

      if (!reason) {
        return helper.response(res, 400, "Mohon isi reason");
      }

      reason = `terpending dengan alasan: ${reason}`;

      await database.query(
        `UPDATE tickets SET status = 'pending', updated_at = now() WHERE id = ${id}`
      );

      await database.query(
        `
            INSERT INTO ticket_logs(user_id, ticket_id, note, created_at) VALUES(
                '${user_id}',
                '${id}',
                '${reason}',
                '${await helper.getFormatedTime("datetime")}'
            ) RETURNING *
          `
      );

      return helper.response(res, 200, "Status berhasil diperbaharui");
    } catch (err) {
      return helper.response(res, 400, "Error : " + err, err);
    }
  },

  // NOTE balas ticket
  reply: async (req, res) => {
    try {
      const id = req.params.id;

      let { note, priority_id, due_date, user_id } = req.body;

      if (!note) {
        return helper.response(res, 400, "Mohon isi note");
      }

      let ticket;

      // if (req.user.role == "teknisi" || req.user.role == "satker") {
      // ticket = await database.query(`
      //   SELECT * FROM tickets WHERE id = ${id} AND user_id = ${req.user.id} AND tickets.status <> 'deleted'
      // `);

      // if (ticket[0].length == 0) {
      //   return helper.response(res, 400, "Data tidak ditemukan");
      // }
      // } else {
      ticket = await database.query(`
          SELECT * FROM tickets WHERE id = ${id} AND tickets.status <> 'deleted'
        `);

      if (ticket[0].length == 0) {
        return helper.response(res, 400, "Data tidak ditemukan");
      }

      if (!priority_id || priority_id == "" || priority_id.length == 0) {
        priority_id = ticket[0][0].priority_id;
      }

      if (!due_date || due_date == "" || due_date.length == 0) {
        if (!ticket[0][0].due_date) {
          return helper.response(res, 400, "Mohon isi due_date");
        } else {
          due_date = ticket[0][0].due_date;
        }
      } else {
        due_date = moment(due_date).format("YYYY-MM-DD");
      }

      await database.query(
        `UPDATE tickets SET priority_id = ${priority_id}, due_date = '${due_date}', updated_at = now() WHERE id = ${id}`
      );
      // }

      await database.query(
        `
          INSERT INTO ticket_logs(user_id, ticket_id, note, created_at) VALUES(
              '${user_id}',
              '${id}',
              '${note}',
              '${await helper.getFormatedTime("datetime")}'
          ) RETURNING *
        `
      );

      return helper.response(res, 200, "Balasan berhasil dikirim");
    } catch (err) {
      console.log(err);
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
            tickets.number,
            tickets.due_date,
            tickets.cause,
            tickets.solution,
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

      // if (req.user.role == "teknisi" || req.user.role == "satker") {
      //   ticket = await database.query(`
      //     SELECT
      //       tickets."id",
      //       tickets.detail,
      //       tickets.status,
      //       tickets.created_at,
      //       tickets.number,
      //       tickets.due_date,
      //       tickets.cause,
      //       tickets.solution,
      //       users."name" AS "user",
      //       priorities."name" AS priority
      //     FROM
      //       tickets
      //       INNER JOIN
      //       users
      //       ON
      //         tickets.user_id = users."id"
      //       LEFT JOIN
      //       priorities
      //       ON
      //         tickets.priority_id = priorities."id"
      //     WHERE
      //       tickets.id = ${id},
      //       AND
      //       tickets.user_id = ${req.user.id}
      //       AND
      //       tickets.status <> 'pending'
      //       AND
      //       tickets.status <> 'deleted'
      //     ORDER BY
      //       tickets.created_at DESC
      //   `);
      // }

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

  // NOTE closed ticket
  status: async (req, res) => {
    try {
      const id = req.params.id;

      let { status } = req.body;

      if (!status) {
        return helper.response(res, 400, "Mohon isi status");
      }

      await database.query(
        `UPDATE tickets SET status = '${status}', updated_at = now() WHERE id = ${id}`
      );

      return helper.response(res, 200, "Status berhasil diperbaharui");
    } catch (err) {
      return helper.response(res, 400, "Error : " + err, err);
    }
  },

  // NOTE create tiket
  store: async (req, res) => {
    try {
      let { detail, note, user_id, priority_id } = req.body;

      switch (true) {
        case !detail:
          return helper.response(res, 400, "Mohon isi detail");
        case !note:
          return helper.response(res, 400, "Mohon isi note");
      }

      let tickets = await database.query(
        `
          SELECT * FROM tickets
        `
      );

      if (!user_id) {
        user_id = req.user.id;
      }

      if (!priority_id) priority_id = 4;

      tickets = tickets[0].length;

      tickets = tickets + 1;

      let number;

      if (tickets < 10) {
        number = `000000${tickets}`;
      } else if (tickets > 9 && tickets < 100) {
        number = `00000${tickets}`;
      } else if (tickets > 99 && tickets < 1000) {
        number = `0000${tickets}`;
      } else if (tickets > 999 && tickets < 10000) {
        number = `000${tickets}`;
      } else if (tickets > 9999 && tickets < 100000) {
        number = `00${tickets}`;
      } else if (tickets > 99999 && tickets < 1000000) {
        number = `0${tickets}`;
      } else {
        number = `0${tickets}`;
      }

      const data = await database.query(
        `
          INSERT INTO tickets(user_id, priority_id ,detail, number, created_at) VALUES(
              '${user_id}',
              '${priority_id}',
              '${detail}',
              '${number}',
              '${await helper.getFormatedTime("datetime")}'
          ) RETURNING *
        `
      );

      await database.query(
        `
          INSERT INTO ticket_logs(user_id, ticket_id, note, created_at) VALUES(
              '${user_id}',
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
