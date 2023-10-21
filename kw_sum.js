const { Pool } = require('pg');

const dbConfig = {
  host: 'ec2-3-108-57-100.ap-south-1.compute.amazonaws.com',
  user: 'gaurav',
  password: 'gaurav123',
  database: 'postgres',
};

const pool = new Pool(dbConfig);

function storeLastMonthAndDaySum() {
    try {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        const deviceIdsQuery = 'SELECT DISTINCT deviceid FROM ems.ems_actual_data;';

        pool.query(deviceIdsQuery, (deviceIdsError, deviceIdsResult) => {
            if (deviceIdsError) {
                console.error('Error fetching unique device IDs:', deviceIdsError);
                return;
            }

            const uniqueDeviceIds = deviceIdsResult.rows;

            uniqueDeviceIds.forEach((device) => {
                const deviceID = device.deviceid;

                const monthSumQuery = `
            SELECT
              SUM(kw) AS total_kw_month,
              SUM(kvar) AS total_kvar_month
            FROM ems.ems_actual_data
            WHERE timestamp >= $1 AND deviceid = $2;`;

                pool.query(monthSumQuery, [oneMonthAgo, deviceID], (monthError, monthResult) => {
                    if (monthError) {
                        console.error(`Error fetching last month sum for device ${deviceID}:`, monthError);
                        return;
                    }

                    const { total_kw_month, total_kvar_month } = monthResult.rows[0];

                    const lastDay = new Date();
                    lastDay.setHours(0, 0, 0, 0);
                    lastDay.setTime(lastDay.getTime() - 24 * 60 * 60 * 1000);

                    const daySumQuery = `
              SELECT
                SUM(kw) AS total_kw_day,
                SUM(kvar) AS total_kvar_day
              FROM ems.ems_actual_data
              WHERE timestamp >= $1 AND deviceid = $2;`;

                    pool.query(daySumQuery, [lastDay, deviceID], (dayError, dayResult) => {
                        if (dayError) {
                            console.error(`Error fetching last day's sum for device ${deviceID}:`, dayError);
                            return;
                        }
                        const { total_kw_day, total_kvar_day } = dayResult.rows[0];

                        const insertQuery = `
                INSERT INTO ems.sum_kw (deviceid, total_kw_month, total_kvar_month, total_kw_day, total_kvar_day, calculation_date)
                VALUES ($1, $2, $3, $4, $5, $6);`;

                        const currentDate = new Date();

                        pool.query(insertQuery, [deviceID, total_kw_month, total_kvar_month, total_kw_day, total_kvar_day, currentDate], (insertError) => {
                            if (insertError) {
                                console.error(`Error inserting into sum_table for device ${deviceID}:`, insertError);
                            }
                        });
                    });
                });
            });
        });
    } catch (error) {
        console.error('Error fetching and storing last month and last day\'s sum:', error);
    }
}

storeLastMonthAndDaySum();

setInterval(storeLastMonthAndDaySum, 24 * 60 * 60 * 1000);