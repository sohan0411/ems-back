const { Client } = require('pg');
const moment = require('moment-timezone');

// PostgreSQL configuration
const pgConfig = {
  host: 'ec2-3-108-57-100.ap-south-1.compute.amazonaws.com',
  user: 'gaurav',
  password: 'gaurav123',
  database: 'postgres',
  port: 5432,
};

const db = new Client(pgConfig);

db.connect();

function MonthsData() {
  const currentTimestamp = moment().tz('Asia/Kolkata').format('YYYY-MM-DDTHH:mm:ss');
  const startOfFourMonthsAgo = moment().tz('Asia/Kolkata').subtract(1, 'months').format('YYYY-MM-DDTHH:mm:ss');

  const selectQuery = `
    SELECT "deviceuid", "voltage", "current", "kva", "kw", "pf", "freq", "timestamp"
    FROM ems.ems_actual_data
    WHERE "timestamp" >= $1 AND "timestamp" <= $2
    ORDER BY "timestamp" DESC
  `;

  const deleteQuery = `
    DELETE FROM ems.ems_actual_data
    WHERE "timestamp" < $1
  `;

  db.query(deleteQuery, [startOfFourMonthsAgo], (error, deleteResult) => {
    if (error) {
      console.error('Error deleting old data: ', error);
    } else {
      console.log(`Deleted ${deleteResult.rowCount} rows of old data.`);
    }

    db.query(selectQuery, [startOfFourMonthsAgo, currentTimestamp], (error, result) => {
      if (error) {
        console.error('Error fetching data: ', error);
        return;
      }

      const rows = result.rows;

      if (rows.length > 0) {
        const insertQuery = `
          INSERT INTO ems."1_hour" ("deviceuid", "voltage", "current", "kva", "kw", "pf", "freq", "timestamp")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;

        rows.forEach((row) => {
          const values = [
            row.deviceuid,
            row.voltage,
            row.current,
            row.kva,
            row.kw,
            row.pf,
            row.freq,
            row.timestamp,
          ];

          db.query(insertQuery, values, (error) => {
            if (error) {
              console.error('Error inserting data: ', error);
            }
          });
        });

        console.log(`Inserted ${rows.length} rows of data into 1_month_data`);
      } else {
        console.log('No data found for the last 1 months.');
      }
    });
  });
}

// Call the function immediately
MonthsData();
setInterval(MonthsData, 24 * 60 * 60 * 1000); // 24 hours in MS