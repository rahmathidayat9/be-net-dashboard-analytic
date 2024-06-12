const { faker } = require("@faker-js/faker/locale/id_ID");

const database = require("../config/database");
const helpers = require("../helpers");

const migrate = async () => {
  try {
    console.log("Migrating database...");

    await database.query("DROP TABLE IF EXISTS top_sites_2");
    await database.query("DROP TABLE IF EXISTS top_sites");
    await database.query("DROP TABLE IF EXISTS internets");
    await database.query("DROP TABLE IF EXISTS traffic_by_ports");
    await database.query("DROP TABLE IF EXISTS top_host_names");
    await database.query("DROP TABLE IF EXISTS top_interfaces");
    await database.query("DROP TABLE IF EXISTS system_resources");
    await database.query("DROP TABLE IF EXISTS microtic_logs");
    await database.query("DROP TABLE IF EXISTS routers");
    await database.query("DROP TABLE IF EXISTS ip_addresses");
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
      "CREATE TABLE routers (id int NOT NULL GENERATED ALWAYS AS IDENTITY, host varchar(255) NOT NULL, username varchar(255) NOT NULL, pass varchar(255) NOT NULL, port int NOT NULL, ethernet varchar(255) NOT NULL, status varchar(255) NOT NULL, created_at timestamp(0) NOT NULL, updated_at timestamp(0) NULL DEFAULT NULL, deleted_at timestamp(0) NULL DEFAULT NULL, PRIMARY KEY (id))"
    );

    await database.query(
      "CREATE TABLE ip_addresses (id int NOT NULL GENERATED ALWAYS AS IDENTITY, ip varchar(255) NOT NULL, created_at timestamp(0) NOT NULL, updated_at timestamp(0) NULL DEFAULT NULL, deleted_at timestamp(0) NULL DEFAULT NULL, PRIMARY KEY (id))"
    );

    await database.query(
      "CREATE TABLE internets (id int NOT NULL GENERATED ALWAYS AS IDENTITY, uuid varchar(255) NOT NULL, name varchar(255) NOT NULL, created_at timestamp(0) NOT NULL, updated_at timestamp(0) NULL DEFAULT NULL, deleted_at timestamp(0) NULL DEFAULT NULL, PRIMARY KEY (id))"
    );

    await database.query(
      "CREATE TABLE microtic_logs (id int NOT NULL GENERATED ALWAYS AS IDENTITY, router varchar(255) NOT NULL, name varchar(255) NOT NULL, rx_byte varchar(255) NOT NULL, tx_byte varchar(255) NOT NULL, order_number int NOT NULL, created_at timestamp(0) NOT NULL, PRIMARY KEY (id))"
    );

    await database.query(
      "CREATE TABLE top_interfaces (id int NOT NULL GENERATED ALWAYS AS IDENTITY, router int NOT NULL, name varchar(255) NOT NULL, rx_byte bigint, tx_byte bigint, date date NOT NULL, created_at timestamp(0) NOT NULL, PRIMARY KEY (id))"
    );

    await database.query(
      "CREATE TABLE system_resources (id int NOT NULL GENERATED ALWAYS AS IDENTITY, router varchar(255) NOT NULL, cpu decimal NOT NULL, hdd decimal NOT NULL, memory decimal NOT NULL, date date NOT NULL, created_at timestamp(0) NOT NULL, PRIMARY KEY (id))"
    );

    await database.query(
      "CREATE TABLE top_sites_2 (id int NOT NULL GENERATED ALWAYS AS IDENTITY, site varchar(255) NOT NULL, count int NOT NULL DEFAULT 1, date date NOT NULL, created_at timestamp(0) NOT NULL, updated_at timestamp(0), PRIMARY KEY (id))"
    );

    await database.query(
      "CREATE TABLE traffic_by_ports (id int NOT NULL GENERATED ALWAYS AS IDENTITY, router varchar(255) NOT NULL, name varchar(255) NOT NULL, rx_byte varchar(255) NULL, tx_byte varchar(255) NOT NULL, mac_address text NOT NULL,  order_number int NOT NULL, created_at timestamp(0) NOT NULL, PRIMARY KEY (id))"
    );

    await database.query(
      "CREATE TABLE top_sites (id int NOT NULL GENERATED ALWAYS AS IDENTITY, router int NOT NULL, name varchar(255) NOT NULL, activity varchar(255) NULL, identifier varchar(255) NOT NULL, date date NOT NULL, created_at timestamp(0) NOT NULL, PRIMARY KEY (id))"
    );

    await database.query(
      "CREATE TABLE top_host_names (id int NOT NULL GENERATED ALWAYS AS IDENTITY, host_name varchar(255) NOT NULL, identifier varchar(255) NOT NULL, date date NOT NULL, bytes_down bigint NOT NULL, router int NOT NULL, created_at timestamp(0) NOT NULL, PRIMARY KEY (id))"
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

    await database.query(
      `
        INSERT INTO ip_addresses(ip, created_at) VALUES(
            '10.0.0.26',
            '${await helpers.getFormatedTime("datetime")}'
        )
      `
    );

    await database.query(
      `
        INSERT INTO ip_addresses(ip, created_at) VALUES(
            '139.255.41.66',
            '${await helpers.getFormatedTime("datetime")}'
        )
      `
    );

    await database.query(
      `
        INSERT INTO routers(host,username,pass,port,ethernet,status, created_at) VALUES(
            '191.101.190.202',
            'monitor_stb',
            'Joseph12345!',
            '8042',
            'ether1',
            'active',
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
