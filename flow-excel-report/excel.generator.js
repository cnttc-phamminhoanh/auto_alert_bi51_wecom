
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const config = require('./config');

// Import styles
const {
    STYLES,
    getWarningStyle,
    createFill,
    createFont,
    createBorder,
    createAlignment
} = require('../css/excelStyles');

class ExcelGenerator {
    constructor() {
        this.workbook = null;
        this.worksheet = null;
    }

    async generateExcel(data, options = {}) {
        const {
            companyName = STYLES.title.company,
            reportTitle = STYLES.title.report,
            sheetName = 'Thống Kê Báo Cáo Cam và Đỏ (15 phút)'
        } = options;

        // ===== 1. TẠO WORKBOOK =====
        this.workbook = new ExcelJS.Workbook();
        this.worksheet = this.workbook.addWorksheet(sheetName, {
            properties: { tabColor: { argb: STYLES.colors.secondary } },
            pageSetup: {
                orientation: 'landscape',
                fitToPage: true,
                margins: {
                    left: 0.5,
                    right: 0.5,
                    top: 0.5,
                    bottom: 0.5
                }
            }
        });

        // ===== 2. LẤY HEADERS =====
        const headers = data.length > 0 ? Object.keys(data[0]) : [];
        const totalColumns = Math.max(headers.length, 1);

        const getColumnLetter = (num) => {
            let column = '';
            while (num > 0) {
                const remainder = (num - 1) % 26;
                column = String.fromCharCode(65 + remainder) + column;
                num = Math.floor((num - 1) / 26);
            }
            return column;
        };

        const lastColumn = getColumnLetter(totalColumns);
        const headerRowNumber = 5;

        // ===== 3. TIÊU ĐỀ =====
        this.worksheet.mergeCells(`A1:${lastColumn}1`);
        const companyCell = this.worksheet.getCell('A1');
        companyCell.value = companyName;
        companyCell.font = createFont(STYLES.fonts.company);
        companyCell.alignment = createAlignment('center', 'middle');
        companyCell.fill = createFill(STYLES.colors.white);

        this.worksheet.mergeCells(`A2:${lastColumn}2`);
        const titleCell = this.worksheet.getCell('A2');
        titleCell.value = reportTitle;
        titleCell.font = createFont(STYLES.fonts.title);
        titleCell.alignment = createAlignment('center', 'middle');
        titleCell.fill = createFill(STYLES.colors.white);

        this.worksheet.mergeCells(`A3:${lastColumn}3`);
        const timeCell = this.worksheet.getCell('A3');
        timeCell.value = `${STYLES.title.timestamp}${new Date().toLocaleString('vi-VN')}`;
        timeCell.font = createFont(STYLES.fonts.timestamp);
        timeCell.alignment = createAlignment('center', 'middle');
        timeCell.fill = createFill(STYLES.colors.white);

        // ===== 4. DÒNG TRỐNG =====
        this.worksheet.addRow([]);

        // ===== 5. HEADER BẢNG =====
        this.worksheet.getRow(headerRowNumber).values = headers;

        // ===== 6. SET ĐỘ RỘNG CỘT CỐ ĐỊNH =====
        const columnWidths = {
            'Customer Style': 20,
            'PO No': 16,
            'WO No': 25,
            'Process': 12,
            'Process Info': 14,
            'Bundle': 14,
            'Start At': 18,        // Độ rộng vừa đủ cho yyyy-mm-dd hh:mm
            'Last At': 18,          // Độ rộng vừa đủ cho yyyy-mm-dd hh:mm
            'Step': 10,
            'Flow': 22,
            'Workers': 10,
            'Worker Name': 28,
            'Qty': 8,
            'Sizx': 8,
            'Allow Mins': 14,
            'Use Mins': 14,
            'Warning': 22,
            'Modified At': 20
        };

        this.worksheet.columns = headers.map((header) => ({
            key: header,
            width: columnWidths[header] || 15
        }));

        // ===== 7. THÊM DỮ LIỆU =====
        data.forEach((row) => {
            // Clone row để không ảnh hưởng dữ liệu gốc
            const newRow = {};
            headers.forEach(key => {
                newRow[key] = row[key];
            });
            this.worksheet.addRow(newRow);
        });

        // ===== 8. ĐỊNH DẠNG HEADER =====
        const headerRow = this.worksheet.getRow(headerRowNumber);
        headerRow.height = STYLES.sizes.headerRowHeight;

        headerRow.eachCell((cell) => {
            cell.font = createFont(STYLES.fonts.header);
            cell.fill = createFill(STYLES.colors.primary);
            cell.alignment = createAlignment('center', 'middle', true);
            cell.border = createBorder(STYLES.borders.header);
        });

        // ===== 9. TÌM VỊ TRÍ CỘT QUAN TRỌNG =====
        const flowIndex = headers.indexOf('Flow') + 1;
        const warningIndex = headers.indexOf('Warning') + 1;
        const numericColumns = STYLES.columns.numericColumns || ['Qty', 'Sizx', 'Allow Mins', 'Use Mins', 'Workers', 'Step'];

        // ===== 10. ĐỊNH DẠNG DỮ LIỆU VÀ NGÀY THÁNG =====
        this.worksheet.eachRow((row, rowNumber) => {
            if (rowNumber <= headerRowNumber) return;

            const warningValue = row.getCell(warningIndex).value || '';
            const warningStyle = getWarningStyle(warningValue);

            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                const headerText = this.worksheet.getRow(headerRowNumber).getCell(colNumber).value;

                // === CỘT FLOW: Luôn màu vàng ===
                if (colNumber === flowIndex) {
                    cell.fill = createFill(STYLES.colors.flow.bg);
                    cell.font = createFont({
                        ...STYLES.fonts.dataBold,
                        color: STYLES.colors.flow.text
                    });
                }
                // === CỘT WARNING: Màu theo cảnh báo ===
                else if (colNumber === warningIndex && warningStyle) {
                    cell.fill = createFill(warningStyle.bg);
                    cell.font = createFont({
                        ...STYLES.fonts.dataBold,
                        color: warningStyle.text
                    });
                }
                // === CÁC CỘT KHÁC ===
                else {
                    cell.fill = createFill(STYLES.colors.white);
                    cell.font = createFont(STYLES.fonts.data);
                }

                // === BORDER ===
                cell.border = createBorder(STYLES.borders.data);

                // === CĂN CHỈNH ===
                const isNumeric = numericColumns.includes(headerText);
                cell.alignment = createAlignment(
                    isNumeric ? 'center' : 'left',
                    'middle',
                    true
                );
            });

            // === ĐỊNH DẠNG NGÀY THÁNG CHO CÁC CỘT ===
            this.formatDateColumns(row, headers, headerRowNumber);
        });

        // ===== 11. FREEZE =====
        this.worksheet.views = [{ state: 'frozen', ySplit: headerRowNumber }];

        // ===== 12. AUTO FILTER =====
        if (headers.length > 0) {
            this.worksheet.autoFilter = {
                from: { row: headerRowNumber, column: 1 },
                to: { row: headerRowNumber, column: headers.length }
            };
        }

        // ===== 13. LƯU FILE =====
        const fileName = `Bao_cao_canh_bao_${new Date().toISOString().split('T')[0]}.xlsx`;
        const filePath = path.join(config.paths.reportsDir, fileName);

        if (!fs.existsSync(config.paths.reportsDir)) {
            fs.mkdirSync(config.paths.reportsDir, { recursive: true });
        }

        await this.workbook.xlsx.writeFile(filePath);
        console.log(`✅ Đã tạo file Excel: ${filePath}`);

        return filePath;
    }

    /**
     * Định dạng ngày tháng cho các cột Start At, Last At, Modified At
     * Format: yyyy-mm-dd hh:mm
     */
    formatDateColumns(row, headers, headerRowNumber) {
        const dateColumns = ['Start At', 'Last At', 'Modified At'];
        
        dateColumns.forEach(colName => {
            const colIndex = headers.indexOf(colName);
            if (colIndex === -1) return;
            
            const cell = row.getCell(colIndex + 1);
            const value = cell.value;
            
            // Nếu giá trị là chuỗi hoặc số, thử chuyển thành Date
            if (value && (typeof value === 'string' || typeof value === 'number')) {
                let date = new Date(value);
                // Nếu là số (timestamp), convert sang Date
                if (typeof value === 'number') {
                    date = new Date(value);
                }
                // Nếu là chuỗi, thử parse
                if (typeof value === 'string') {
                    // Thử các định dạng phổ biến
                    const formats = [
                        value, // Giữ nguyên
                        value.replace(/\//g, '-'), // Đổi / thành -
                        value.replace(/\./g, ':') // Đổi . thành :
                    ];
                    for (const fmt of formats) {
                        const d = new Date(fmt);
                        if (!isNaN(d.getTime())) {
                            date = d;
                            break;
                        }
                    }
                }
                
                // Nếu là Date hợp lệ, định dạng lại
                if (date instanceof Date && !isNaN(date.getTime())) {
                    const formatted = this.formatDate(date);
                    cell.value = formatted;
                }
            }
            // Nếu là Date object
            else if (value instanceof Date && !isNaN(value.getTime())) {
                const formatted = this.formatDate(value);
                cell.value = formatted;
            }
        });
    }

    /**
     * Định dạng Date thành chuỗi yyyy-mm-dd hh:mm
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }
}

module.exports = new ExcelGenerator();