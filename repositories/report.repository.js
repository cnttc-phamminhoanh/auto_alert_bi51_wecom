const { getPool, sql } = require("../config/database");

async function getJobHistory(name, date, time) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("name", sql.VarChar, name)
    .input("date", sql.Int, date)
    .input("time", sql.Int, time).query(`
      SELECT TOP 1
        h.run_status,
        h.message,
        h.run_date,
        h.run_time
      FROM msdb.dbo.sysjobhistory h
      JOIN msdb.dbo.sysjobs j ON h.job_id = j.job_id
      WHERE j.name = @name
        AND h.step_id = 1
        AND h.run_date = @date
        AND (h.run_time / 100) = @time
      ORDER BY h.run_time DESC
    `);

  return result.recordset;
}

module.exports = {
  getJobHistory,
};
