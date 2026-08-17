async function getFlowWarningStats(db) {
    const sql = `
        SELECT warning_type, STRING_AGG(short_name + ' (' + CAST(cnt AS VARCHAR(20)) + ')', ', ') AS result
FROM (
    SELECT CASE WHEN warning_txt = '46 ~ 60 Minutes' THEN N'Cam' ELSE N'Đỏ' END AS warning_type,
        ISNULL(s.short_name, 'Other') AS short_name,
        COUNT(*) AS cnt
    FROM bi_ig_process_bundle_mins b
    LEFT JOIN gi_BI.dbo.flow_inf_b51 s ON s.flow = b.flow
    WHERE warning_txt IN ('46 ~ 60 Minutes','61 ~ 90 Minutes','91 ~ 120 Minutes','> 120 Minutes')
    GROUP BY CASE WHEN warning_txt = '46 ~ 60 Minutes' THEN N'Cam' ELSE N'Đỏ' END, ISNULL(s.short_name, 'Other')
) x
GROUP BY warning_type
ORDER BY CASE WHEN warning_type = N'Cam' THEN 1 ELSE 2 END;
    `;
    try {
        console.log('📊 [cardwecom] Đang lấy thống kê Flow...');
        const result = await db.query(sql);
    const rows = result.recordset; 

        console.log(`✅ [cardwecom] Lấy được ${rows.length} dòng thống kê`);
        const stats = {};
        rows.forEach(row => {
            stats[row.warning_type] = row.result;
        });
        return stats;
    } catch (error) {
        console.error('❌ [cardwecom] Lỗi lấy thống kê Flow:', error.message);
    }
}
// 🆕
async function getWeComIDsFromDB(db) {
    const sql = `
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
    `;

    try {
        console.log('📊 [notewc] Đang lấy danh sách ID WeCom từ database...');
        const result = await db.query(sql);
        const rows = result.recordset;   // 🔧 sửa bug
        console.log(`✅ [notewc] Lấy được ${rows.length} ID từ database`);
        return rows.map(row => row.ID_wc).filter(id => id && id.trim() !== '');
    } catch (error) {
        console.error('❌ [notewc] Lỗi lấy ID từ database:', error.message);
        return [];
    }
}

module.exports = {
    getFlowWarningStats,
    getWeComIDsFromDB
};