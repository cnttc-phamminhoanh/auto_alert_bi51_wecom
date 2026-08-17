/**
 * Excel Styles Configuration
 * Tất cả style cho file Excel được tập trung tại đây
 */

const STYLES = {
    // ===== MÀU SẮC CHÍNH =====
    colors: {
        // Màu nền
        primary: 'FF1F4E78',      // Xanh navy đậm (header)
        secondary: 'FF4472C4',    // Xanh dương
        white: 'FFFFFFFF',         // Trắng
        lightGray: 'FFF5F5F5',    // Xám nhạt
        
        // Màu cảnh báo
        warning: {
            do: {
                bg: 'FFFFE6E6',    // Đỏ nhạt
                text: 'FFCC0000',  // Đỏ đậm
                label: 'ĐỎ'
            },
            cam: {
                bg: 'FFFFE6C9',    // Cam nhạt
                text: 'FFCC6600',  // Cam đậm
                label: 'CAM'
            },
            vang: {
                bg: 'FFFFF2CC',    // Vàng nhạt
                text: 'FFCC9900',  // Vàng đậm
                label: 'VÀNG'
            }
        },
        
        // Màu flow (cố định)
        flow: {
            bg: 'FFFFF2CC',        // Vàng nhạt
            text: 'FFCC9900'       // Vàng đậm
        }
    },

    // ===== FONT =====
    fonts: {
        header: {
            name: 'Arial',
            size: 11,
            bold: true,
            color: 'FFFFFFFF'
        },
        title: {
            name: 'Arial',
            size: 16,
            bold: true,
            color: 'FF1E4E79'
        },
        company: {
            name: 'Arial',
            size: 18,
            bold: true,
            color: 'FF1E4E79'
        },
        timestamp: {
            name: 'Arial',
            size: 10,
            italic: true,
            color: 'FF888888'
        },
        data: {
            name: 'Arial',
            size: 10,
            color: 'FF333333'
        },
        dataBold: {
            name: 'Arial',
            size: 10,
            bold: true,
            color: 'FF333333'
        }
    },

    // ===== KÍCH THƯỚC =====
    sizes: {
        headerRowHeight: 30,
        dataRowHeight: 28,
        titleRowHeight: 35,
        companyRowHeight: 40
    },

    // ===== BORDER =====
    borders: {
        header: {
            top: { style: 'medium', color: { argb: 'FF1F4E78' } },
            left: { style: 'medium', color: { argb: 'FF1F4E78' } },
            bottom: { style: 'medium', color: { argb: 'FF1F4E78' } },
            right: { style: 'medium', color: { argb: 'FF1F4E78' } }
        },
        data: {
            top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
            left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
            bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
            right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
        },
        stats: {
            top: { style: 'thin', color: { argb: 'FFB0B0B0' } },
            left: { style: 'thin', color: { argb: 'FFB0B0B0' } },
            bottom: { style: 'thin', color: { argb: 'FFB0B0B0' } },
            right: { style: 'thin', color: { argb: 'FFB0B0B0' } }
        }
    },

    // ===== CẤU HÌNH CỘT =====
    columns: {
        // Định nghĩa độ rộng cho từng cột
        widths: {
            'Customer Style': 20,
            'PO No': 16,
            'WO No': 30,
            'Process': 12,
            'Bundle': 14,
            'Start At': 14,
            'Last At': 14,
            'Step': 10,
            'Flow': 28,
            'Workers': 10,
            'Worker Name': 30,
            'Qty': 8,
            'Sizx': 8,
            'Allow Mins': 12,
            'Use Mins': 12,
            'Warning': 22,
            'Modified At': 20
        },
        // Các cột số (căn giữa)
        numericColumns: ['Qty', 'Sizx', 'Allow Mins', 'Use Mins', 'Workers', 'Step']
    },

    // ===== CẤU HÌNH TIÊU ĐỀ =====
    title: {
        //company: 'GERMTON VIETNAM',
        report: ' Thống kê cảnh báo cam và đỏ (15 phút)/ 15分钟橙色及红色预警统计',
        timestamp: 'Generated At: '
    }
};

/**
 * Lấy style cho warning dựa trên giá trị
 */
function getWarningStyle(warningValue) {
    if (!warningValue) return null;

    const warningStr = String(warningValue);

    if (warningStr.includes('46') || warningStr.includes('60')) {
        return STYLES.colors.warning.cam;
    }

    if (warningStr.includes('61') || warningStr.includes('90') || warningStr.includes('120')) {
        return STYLES.colors.warning.do;
    }

    return null;
}

/**
 * Tạo object fill cho ExcelJS
 */
function createFill(color) {
    return {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: color }
    };
}

/**
 * Tạo object font cho ExcelJS
 */
function createFont(config) {
    const font = {
        name: config.name || 'Arial',
        size: config.size || 10,
        color: { argb: config.color || 'FF333333' }
    };

    if (config.bold) font.bold = true;
    if (config.italic) font.italic = true;

    return font;
}

/**
 * Tạo object border cho ExcelJS
 */
function createBorder(config) {
    return {
        top: { style: config.top?.style || 'thin', color: { argb: config.top?.color || 'FFD0D0D0' } },
        left: { style: config.left?.style || 'thin', color: { argb: config.left?.color || 'FFD0D0D0' } },
        bottom: { style: config.bottom?.style || 'thin', color: { argb: config.bottom?.color || 'FFD0D0D0' } },
        right: { style: config.right?.style || 'thin', color: { argb: config.right?.color || 'FFD0D0D0' } }
    };
}

/**
 * Tạo object alignment cho ExcelJS
 */
function createAlignment(horizontal = 'center', vertical = 'middle', wrapText = true) {
    return {
        horizontal,
        vertical,
        wrapText
    };
}

module.exports = {
    STYLES,
    getWarningStyle,
    createFill,
    createFont,
    createBorder,
    createAlignment
};