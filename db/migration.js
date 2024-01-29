const { faker } = require("@faker-js/faker/locale/id_ID");

const database = require("../config/database");
const helpers = require("../helpers");

const migrate = async () => {
  try {
    console.log("Migrating database...");

    await database.query("DROP TABLE IF EXISTS bandwiths");
    await database.query("DROP TABLE IF EXISTS system_resources");
    await database.query("DROP TABLE IF EXISTS microtic_logs");
    await database.query("DROP TABLE IF EXISTS ticket_logs");
    await database.query("DROP TABLE IF EXISTS tickets");
    await database.query("DROP TABLE IF EXISTS priorities");
    await database.query("DROP TABLE IF EXISTS auth_logs");
    await database.query("DROP TABLE IF EXISTS refresh_tokens");
    await database.query("DROP TABLE IF EXISTS users");

    await database.query(
      "CREATE TABLE users (id int NOT NULL GENERATED ALWAYS AS IDENTITY, name varchar(255) NOT NULL, email varchar(255) NOT NULL, username varchar(255) NOT NULL, password varchar(255) NOT NULL, role varchar(255) NOT NULL, created_at timestamp(0) NOT NULL, updated_at timestamp(0) NULL DEFAULT NULL, deleted_at timestamp(0) NULL DEFAULT NULL, PRIMARY KEY (id), CONSTRAINT email UNIQUE (email), CONSTRAINT username UNIQUE (username))"
    );

    await database.query(
      "CREATE TABLE priorities (id int NOT NULL GENERATED ALWAYS AS IDENTITY, name varchar(255) NOT NULL, created_at timestamp(0) NOT NULL, updated_at timestamp(0) NULL DEFAULT NULL, deleted_at timestamp(0) NULL DEFAULT NULL, PRIMARY KEY (id), CONSTRAINT name UNIQUE (name))"
    );

    await database.query(
      "CREATE TABLE refresh_tokens (id int NOT NULL GENERATED ALWAYS AS IDENTITY, user_id int NOT NULL REFERENCES users(id), token varchar(255) NOT NULL, expire_at timestamp(0) NULL DEFAULT NULL, revoked timestamp(0) NULL DEFAULT NULL, created_at timestamp(0) NOT NULL, updated_at timestamp(0) NULL DEFAULT NULL, PRIMARY KEY (id))"
    );

    await database.query(
      "CREATE TABLE auth_logs (id int NOT NULL GENERATED ALWAYS AS IDENTITY, user_id int NOT NULL REFERENCES users(id), created_at timestamp(0) NOT NULL, updated_at timestamp(0) NULL DEFAULT NULL, deleted_at timestamp(0) NULL DEFAULT NULL, PRIMARY KEY (id))"
    );

    await database.query(
      "CREATE TABLE tickets (id int NOT NULL GENERATED ALWAYS AS IDENTITY, user_id int NOT NULL REFERENCES users(id), priority_id int NULL DEFAULT NULL REFERENCES priorities(id), detail text NOT NULL, status varchar(255) NOT NULL DEFAULT 'pending', number varchar(255) NOT NULL, due_date date NULL DEFAULT NULL, cause text NULL DEFAULT NULL, solution text NULL DEFAULT NULL, created_at timestamp(0) NOT NULL, updated_at timestamp(0) NULL DEFAULT NULL, PRIMARY KEY (id))"
    );

    await database.query(
      "CREATE TABLE ticket_logs (id int NOT NULL GENERATED ALWAYS AS IDENTITY, user_id int NOT NULL REFERENCES users(id), ticket_id int NOT NULL REFERENCES tickets(id), note text NOT NULL, created_at timestamp(0) NOT NULL, updated_at timestamp(0) NULL DEFAULT NULL, PRIMARY KEY (id))"
    );

    await database.query(
      "CREATE TABLE microtic_logs (id int NOT NULL GENERATED ALWAYS AS IDENTITY, router varchar(255) NOT NULL, name varchar(255) NOT NULL, rx_byte varchar(255) NOT NULL, tx_byte varchar(255) NOT NULL, order_number int NOT NULL, created_at timestamp(0) NOT NULL, PRIMARY KEY (id))"
    );

    await database.query(
      "CREATE TABLE bandwiths (id int NOT NULL GENERATED ALWAYS AS IDENTITY, high_rx_bit_per_second varchar(255) NOT NULL, high_tx_bit_per_second varchar(255) NOT NULL, date date NOT NULL, created_at timestamp(0) NOT NULL, PRIMARY KEY (id))"
    );

    await database.query(
      "CREATE TABLE system_resources (id int NOT NULL GENERATED ALWAYS AS IDENTITY, high_rx_bit_per_second varchar(255) NOT NULL, average_rx_bit_per_second varchar(255) NOT NULL, date date NOT NULL, created_at timestamp(0) NOT NULL, PRIMARY KEY (id))"
    );

    await database.query(
      `
            INSERT INTO users(name, email, username, password, role, created_at) VALUES(
                '${faker.person.fullName()}',
                '${faker.internet.email().toLowerCase()}',
                'superadmin',
                '${await helpers.hashPassword("12345678")}',
                'super admin',
                '${await helpers.getFormatedTime("datetime")}'
            )
        `
    );

    for (let i = 0; i < 3; i++) {
      await database.query(
        `
                INSERT INTO users(name, email, username, password, role, created_at) VALUES(
                    '${faker.person.fullName()}',
                    '${faker.internet.email().toLowerCase()}',
                    'admin${i + 1}',
                    '${await helpers.hashPassword("12345678")}',
                    'admin',
                    '${await helpers.getFormatedTime("datetime")}'
                )
            `
      );
    }

    for (let i = 0; i < 3; i++) {
      await database.query(
        `
                INSERT INTO users(name, email, username, password, role, created_at) VALUES(
                    '${faker.person.fullName()}',
                    '${faker.internet.email().toLowerCase()}',
                    'teknisi${i + 1}',
                    '${await helpers.hashPassword("12345678")}',
                    'teknisi',
                    '${await helpers.getFormatedTime("datetime")}'
                )
            `
      );
    }

    for (let i = 0; i < 3; i++) {
      await database.query(
        `
                INSERT INTO users(name, email, username, password, role, created_at) VALUES(
                    '${faker.person.fullName()}',
                    '${faker.internet.email().toLowerCase()}',
                    'satker${i + 1}',
                    '${await helpers.hashPassword("12345678")}',
                    'satker',
                    '${await helpers.getFormatedTime("datetime")}'
                )
            `
      );
    }

    await database.query(
      `
        INSERT INTO priorities(name, created_at) VALUES(
            'Level 1',
            '${await helpers.getFormatedTime("datetime")}'
        )
      `
    );

    await database.query(
      `
        INSERT INTO priorities(name, created_at) VALUES(
            'Level 2',
            '${await helpers.getFormatedTime("datetime")}'
        )
      `
    );

    await database.query(
      `
        INSERT INTO priorities(name, created_at) VALUES(
            'Level 3',
            '${await helpers.getFormatedTime("datetime")}'
        )
      `
    );

    await database.query(
      `
        INSERT INTO priorities(name, created_at) VALUES(
            'Level 4',
            '${await helpers.getFormatedTime("datetime")}'
        )
      `
    );

    console.log("Migration completed");

    process.exit();
  } catch (err) {
    console.log(err);

    process.exit();
  }
};

migrate();
