// const path = require('path');

// // ✅ Đọc file .env với đường dẫn tuyệt đối
// require('dotenv').config({ 
//     path: path.join(__dirname, '..', '.env') 
// });

// // ✅ Log để kiểm tra
// console.log('📌 [config] Đang đọc file .env...');
// console.log('   DB_DATABASE:', process.env.DB_DATABASE);
// console.log('   DB_HOST:', process.env.DB_HOST);
// console.log('   DB_USER:', process.env.DB_USER);

// module.exports = {
//     // Database Config
//     db: {
//         type: process.env.DB_TYPE || 'mssql',
//         host: process.env.DB_HOST || 'localhost',
//         port: parseInt(process.env.DB_PORT) || 1433,  // ✅ Thêm giá trị mặc định
//         user: process.env.DB_USER,
//         password: process.env.DB_PASSWORD || '',
//         database: process.env.DB_DATABASE,  // ✅ SỬA: DB_DATABASE (khớp với .env)
//         options: {
//             encrypt: false,  // ✅ SỬA: false để tránh lỗi TLS với IP
//             trustServerCertificate: true
//         }
//     },
    
//     // WeCom Config
//     wecom: {
//         webhookUrl: process.env.ALERT_BI_51_WECOM_WEBHOOK
//     },
    
//     // Schedule Config
//     schedule: {
//         cron: process.env.SCHEDULE_CRON || '*/15 * * * *'
//     },
    
//     // Warning Config
//     warning: {
//         doThreshold: parseInt(process.env.DO_THRESHOLD) || 91,
//         camThreshold: parseInt(process.env.CAM_THRESHOLD) || 61,
//         vangThreshold: parseInt(process.env.VANG_THRESHOLD) || 46
//     },
    
//     // Paths
//     paths: {
//         rootDir: path.join(__dirname, '..'),
//         reportsDir: path.join(__dirname, '..', 'reports'),
//         logsDir: path.join(__dirname, '..', 'logs')
//     }
// };

const path = require('path');

module.exports = {
    // Paths
    paths: {
        reportsDir: path.join(__dirname, '..', 'reports'),
    }
};