const { Pool } = require('pg');

const dbConfig = {
  host: 'ec2-3-108-57-100.ap-south-1.compute.amazonaws.com',
  user: 'gaurav',
  password: 'gaurav123',
  database: 'postgres',
};

const pool = new Pool(dbConfig);

function updateCompanyInfo() {
  const getCompanyNamesQuery = 'SELECT DISTINCT "companyname" FROM "ems"."ems_users"';

  try {
    pool.connect((err, client, done) => {
      if (err) {
        console.error('Error getting a database connection:', err);
        return;
      }

      client.query(getCompanyNamesQuery, (err, result) => {
        done();

        if (err) {
          console.error('Error fetching company names:', err);
          return;
        }

        const companyNames = result.rows.map(row => row.companyname);
        for (const companyName of companyNames) {
          calculateCompanyStatistics(client, companyName);
        }
      });
    });
  } catch (err) {
    console.error('Error updating company info:', err);
  }
}

function calculateCompanyStatistics(client, companyName) {
  const userCountQuery = 'SELECT COUNT(*) AS total_users FROM "ems"."ems_users" WHERE "companyname" = $1';
  const activeUserCountQuery = 'SELECT COUNT(*) AS active_users FROM "ems"."ems_users" WHERE "companyname" = $1 AND "is_online" = 1';
  const inactiveUserCountQuery = 'SELECT COUNT(*) AS inactive_users FROM "ems"."ems_users" WHERE "companyname" = $1 AND "is_online" = 0';

  client.query(userCountQuery, [companyName], (err, userCountResult) => {
    if (err) {
      console.error(`Error calculating total users for ${companyName}:`, err);
      return;
    }

    client.query(activeUserCountQuery, [companyName], (err, activeUserCountResult) => {
      if (err) {
        console.error(`Error calculating active users for ${companyName}:`, err);
        return;
      }

      client.query(inactiveUserCountQuery, [companyName], (err, inactiveUserCountResult) => {
        if (err) {
          console.error(`Error calculating inactive users for ${companyName}:`, err);
          return;
        }

        const totalUsers = userCountResult.rows[0].total_users;
        const activeUsers = activeUserCountResult.rows[0].active_users;
        const inactiveUsers = inactiveUserCountResult.rows[0].inactive_users;
        const insertCompanyDataQuery = 'INSERT INTO ems."company_info" ("company_name", "total_users", "active_users", "inactive_users") VALUES ($1, $2, $3, $4)';
        const deleteCompanyDataQuery = 'DELETE FROM ems."company_info" WHERE "company_name" = $1';

        client.query(deleteCompanyDataQuery, [companyName.toLowerCase()], (err) => {
          if (err) {
            console.error(`Error deleting old company data for ${companyName}:`, err);
            return;
          }
          client.query(insertCompanyDataQuery, [companyName.toLowerCase(), totalUsers, activeUsers, inactiveUsers], (err) => {
            if (err) {
              console.error(`Error inserting company data for ${companyName}:`, err);
            }
          });
        });
      });
    });
  });
}

updateCompanyInfo();

setInterval(updateCompanyInfo, 10000);
