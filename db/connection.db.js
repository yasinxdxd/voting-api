const pgp = require('pg-promise')(/* options */)
require('dotenv').config()

const db = pgp({
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        host: process.env.PGHOST,
        port: process.env.PGPORT,
        database: process.env.PGDATABASE,
        ssl: {
            rejectUnauthorized: false // Disable this only for testing
        }
    }
)

exports.db = db;

// let result = await db.any(`
//     SELECT u.first_name, u.last_name, r.city_id
//     FROM users u
//     LEFT JOIN residences r
//     ON r.user_id = u.id
//     WHERE r.city_id = (
//       SELECT DISTINCT ct.id FROM cities ct WHERE ct.title = $1
//     );
//   `, ["ERZURUM"]);