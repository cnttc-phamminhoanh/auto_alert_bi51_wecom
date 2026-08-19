const { getPool, sql } = require("../config/database");

async function getJobHistory(name, date, time) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("name", sql.VarChar, name)
    .input("date", sql.Int, date)
    .input("time", sql.Int, time)
    .query(`
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

async function getFlowWarningStats() {
  const pool = await getPool();

  const result = await pool
    .request()
    .query(`
      SELECT warning_type, STRING_AGG(short_name + ' (' + CAST(cnt AS VARCHAR(20)) + ')', ', ') AS result
      FROM (
        SELECT
          CASE WHEN warning_txt = '46 ~ 60 Minutes' THEN N'Cam' ELSE N'Đỏ' END AS warning_type,
          ISNULL(s.short_name, 'Other') AS short_name,
          COUNT(*) AS cnt
        FROM bi_ig_process_bundle_mins b
        LEFT JOIN gi_BI.dbo.flow_inf_b51 s ON s.flow = b.flow
        WHERE warning_txt IN ('46 ~ 60 Minutes','61 ~ 90 Minutes','91 ~ 120 Minutes','> 120 Minutes')
        GROUP BY CASE WHEN warning_txt = '46 ~ 60 Minutes' THEN N'Cam' ELSE N'Đỏ' END, ISNULL(s.short_name, 'Other')
      ) x
      GROUP BY warning_type
      ORDER BY CASE WHEN warning_type = N'Cam' THEN 1 ELSE 2 END;
    `);

  const stats = {};

  result.recordset.forEach((row) => {
    stats[row.warning_type] = row.result;
  });

  return stats;
}

async function getWeComIDsFromDB() {
  const pool = await getPool();

  const result = await pool
    .request()
    .query(`
      SELECT DISTINCT ID_wc
      FROM (
        SELECT
          cust_style, cust_po, wo, process, process_info, bundle, f_at, l_at, 
          step, b.flow, flow_workers, worker, qty, sizx, allow_mins, now_m_gap, warning_txt, 
          modified_at, ISNULL(s.short_name, 'Other') AS short_name, s.ID_wc
        FROM bi_ig_process_bundle_mins b
        LEFT JOIN dbo.flow_inf_b51 s ON s.flow = b.flow 
        WHERE warning_txt IN ('46 ~ 60 Minutes', '61 ~ 90 Minutes', '91 ~ 120 Minutes', '> 120 Minutes')
      ) x
      WHERE ID_wc IS NOT NULL AND ID_wc != ''
    `);

  const rows = result.recordset;

  return rows.map((row) => row.ID_wc).filter((id) => id && id.trim() !== "");
}

async function getWarningData() {
  const pool = await getPool();

  const result = await pool
    .request()
    .query(`
      SELECT 
        cust_style AS "Customer Style",
        cust_po AS "PO No",
        wo AS "WO No",
        process AS "Process",
        process_info AS "Process Info",
        bundle AS "Bundle",
        f_at AS "Start At",
        l_at AS "Last At",
        step AS "Step",
        flow AS "Flow",
        flow_workers AS "Workers",
        worker AS "Worker Name",
        qty AS "Qty",
        sizx AS "Sizx",
        allow_mins AS "Allow Mins",
        now_m_gap AS "Use Mins",
        warning_txt AS "Warning",
        modified_at AS "Modified At"
      FROM bi_ig_process_bundle_mins
      WHERE warning_txt IN ('46 ~ 60 Minutes', '61 ~ 90 Minutes', '91 ~ 120 Minutes', '> 120 Minutes')
    `);

  return result.recordset;
}

module.exports = {
  getJobHistory,
  getFlowWarningStats,
  getWeComIDsFromDB,
  getWarningData,
};
