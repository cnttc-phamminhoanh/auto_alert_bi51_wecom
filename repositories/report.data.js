
class DataProcessor {
    async getWarningData(db) {
        const sql = `
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
        `;

        try {
            console.log('📊 Đang thực thi truy vấn SQL...');
            const result = await db.query(sql);
            const data = result.recordset;   // 🔧 lấy đúng mảng dữ liệu

            console.log(`✅ Lấy được ${data.length} dòng dữ liệu`);
            // ✅ IN CHI TIẾT DỮ LIỆU
        console.log('📝 Danh sách dữ liệu:');
        data.forEach((row, index) => {
            console.log(`  ${index + 1}. WO: ${row['WO No']} | Warning: ${row['Warning']} | Flow: ${row['Flow']}`);
        });
        console.log('--- Hết dữ liệu ---');
    return data
        } catch (error) {
            console.error('❌ Lỗi lấy dữ liệu từ database:', error.message);
            console.log('⚠️ Sử dụng dữ liệu mẫu để test...');
            return this.getSampleData();
        }
    }

    getWarningStats(data) {
        const stats = {
            total: data.length,
            do: data.filter(r => r.color === 'do').length,
            cam: data.filter(r => r.color === 'cam').length,
            vang: data.filter(r => r.color === 'vang').length,
            byWorker: {},
            byFlow: {}
        };

        data.forEach(row => {
            const worker = row['Worker Name'] || 'Unknown';
            if (!stats.byWorker[worker]) {
                stats.byWorker[worker] = { total: 0, do: 0, cam: 0, vang: 0 };
            }
            stats.byWorker[worker].total++;
            if (row.color === 'do') stats.byWorker[worker].do++;
            else if (row.color === 'cam') stats.byWorker[worker].cam++;
            else if (row.color === 'vang') stats.byWorker[worker].vang++;

            const flow = row['Flow'] || 'Unknown';
            if (!stats.byFlow[flow]) {
                stats.byFlow[flow] = { total: 0, do: 0, cam: 0, vang: 0 };
            }
            stats.byFlow[flow].total++;
            if (row.color === 'do') stats.byFlow[flow].do++;
            else if (row.color === 'cam') stats.byFlow[flow].cam++;
            else if (row.color === 'vang') stats.byFlow[flow].vang++;
        });

        return stats;
    }

    getSampleData() {
        return [
        ];
    }
}

module.exports = new DataProcessor();