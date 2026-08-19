const ExcelJS = require("exceljs");

const {
  STYLES,
  getWarningStyle,
  createFill,
  createFont,
  createBorder,
  createAlignment,
} = require("../css/excelStyles");

const { getReportFilePath } = require("../utils/report-file.util");

/**
 * Convert column number to Excel column letter
 *
 * 1  -> A
 * 26 -> Z
 * 27 -> AA
 */
function getColumnLetter(num) {
  let column = "";

  while (num > 0) {
    const remainder = (num - 1) % 26;

    column = String.fromCharCode(65 + remainder) + column;

    num = Math.floor((num - 1) / 26);
  }

  return column;
}

/**
 * Format Date thành:
 * yyyy-mm-dd hh:mm
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * Generate Excel report
 */
async function generateExcel(data, options = {}) {
  const {
    companyName = STYLES.title.company,
    reportTitle = STYLES.title.report,
    sheetName = "15m_oran_red",
  } = options;

  // ========================================
  // 1. CREATE WORKBOOK
  // ========================================

  const workbook = new ExcelJS.Workbook();

  const sheet = workbook.addWorksheet(sheetName);

  const headerRowNumber = 5;

  // ========================================
  // 2. GET DYNAMIC HEADERS
  // ========================================

  const headers = data.length > 0 ? Object.keys(data[0]) : [];

  const totalColumns = Math.max(headers.length, 1);

  const lastColumn = getColumnLetter(totalColumns);

  // ========================================
  // 3. REPORT TITLE
  // ========================================

  sheet.mergeCells(`A1:${lastColumn}1`);

  sheet.getCell("A1").value = companyName;

  sheet.mergeCells(`A2:${lastColumn}2`);

  sheet.getCell("A2").value = reportTitle;

  sheet.mergeCells(`A3:${lastColumn}3`);

  sheet.getCell("A3").value =
    `${STYLES.title.timestamp}${new Date().toLocaleString("sv-SE")}`;

  // Alignment title
  ["A1", "A2", "A3"].forEach((address) => {
    const cell = sheet.getCell(address);

    cell.alignment = createAlignment("center", "middle", true);
  });

  // Font title
  sheet.getCell("A1").font = createFont(STYLES.fonts.company);

  sheet.getCell("A2").font = createFont(STYLES.fonts.title);

  sheet.getCell("A3").font = createFont(STYLES.fonts.timestamp);

  // Background title
  sheet.getCell("A1").fill = createFill(STYLES.colors.white);

  sheet.getCell("A2").fill = createFill(STYLES.colors.white);

  sheet.getCell("A3").fill = createFill(STYLES.colors.white);

  // ========================================
  // 4. ROW HEIGHT
  // ========================================

  sheet.getRow(1).height = STYLES.sizes.companyRowHeight;

  sheet.getRow(2).height = STYLES.sizes.titleRowHeight;

  sheet.getRow(3).height = 22;

  // ========================================
  // 5. BLANK ROWS
  // ========================================

  sheet.addRow([]);

  sheet.addRow([]);

  // ========================================
  // 6. DYNAMIC HEADER
  // ========================================

  sheet.getRow(headerRowNumber).values = headers;

  // QUAN TRỌNG:
  // Giữ nguyên cách của excel.service.js gốc

  sheet.columns = headers.map((header) => ({
    key: header,
  }));

  // ========================================
  // 7. ADD DATA
  // ========================================

  data.forEach((row) => {
    sheet.addRow(row);
  });

  // ========================================
  // 8. DATE FORMAT
  // ========================================

  headers.forEach((header, index) => {
    const sampleValue = data.find((row) => row[header] != null)?.[header];

    if (sampleValue instanceof Date) {
      sheet.getColumn(index + 1).numFmt = "yyyy-mm-dd hh:mm";
    }
  });

  // ========================================
  // 9. COLUMN WIDTH
  // ========================================

  const columnWidths = STYLES.columns?.widths || {};

  sheet.columns.forEach((column, index) => {
    const header = headers[index];

    /*
     * Nếu excelStyles.js có width
     * thì dùng width đó.
     */
    if (columnWidths[header]) {
      column.width = columnWidths[header];

      return;
    }

    /*
     * Nếu không có width cấu hình
     * thì dùng auto width giống
     * excel.service.js gốc.
     */

    let maxLength = 0;

    column.eachCell(
      {
        includeEmpty: true,
      },
      (cell) => {
        const value = cell.value == null ? "" : cell.value.toString();

        maxLength = Math.max(maxLength, value.length);
      },
    );

    column.width = Math.min(Math.max(maxLength + 2, 15), 22);
  });

  // ========================================
  // 10. HEADER STYLE
  // ========================================

  const headerRow = sheet.getRow(headerRowNumber);

  headerRow.height = STYLES.sizes.headerRowHeight;

  headerRow.eachCell(
    {
      includeEmpty: true,
    },
    (cell) => {
      cell.font = createFont(STYLES.fonts.header);

      cell.fill = createFill(STYLES.colors.primary);

      cell.alignment = createAlignment("center", "middle", true);

      cell.border = createBorder(STYLES.borders.header);
    },
  );

  // ========================================
  // 11. COLUMN INDEX
  // ========================================

  const flowIndex = headers.indexOf("Flow") + 1;

  const warningIndex = headers.indexOf("Warning") + 1;

  const numericColumns = STYLES.columns?.numericColumns || [
    "Qty",
    "Sizx",
    "Allow Mins",
    "Use Mins",
    "Workers",
    "Step",
  ];

  // ========================================
  // 12. DATA STYLE
  // ========================================

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRowNumber) {
      return;
    }

    row.height = STYLES.sizes.dataRowHeight;

    const warningValue =
      warningIndex > 0 ? row.getCell(warningIndex).value || "" : "";

    const warningStyle = getWarningStyle(warningValue);

    row.eachCell(
      {
        includeEmpty: true,
      },
      (cell, colNumber) => {
        const headerText = headers[colNumber - 1];

        // ==================================
        // FLOW
        // ==================================

        if (flowIndex > 0 && colNumber === flowIndex) {
          cell.fill = createFill(STYLES.colors.flow.bg);

          cell.font = createFont({
            ...STYLES.fonts.dataBold,

            color: STYLES.colors.flow.text,
          });
        }

        // ==================================
        // WARNING
        // ==================================
        else if (
          warningIndex > 0 &&
          colNumber === warningIndex &&
          warningStyle
        ) {
          cell.fill = createFill(warningStyle.bg);

          cell.font = createFont({
            ...STYLES.fonts.dataBold,

            color: warningStyle.text,
          });
        }

        // ==================================
        // OTHER DATA
        // ==================================
        else {
          cell.fill = createFill(STYLES.colors.white);

          cell.font = createFont(STYLES.fonts.data);
        }

        // ==================================
        // BORDER
        // ==================================

        cell.border = createBorder(STYLES.borders.data);

        // ==================================
        // ALIGNMENT
        // ==================================

        const isNumeric = numericColumns.includes(headerText);

        cell.alignment = createAlignment(
          isNumeric ? "center" : "left",
          "middle",
          true,
        );
      },
    );
  });

  // ========================================
  // 13. FREEZE HEADER
  // ========================================

  sheet.views = [
    {
      state: "frozen",
      ySplit: headerRowNumber,
    },
  ];

  // ========================================
  // 14. AUTO FILTER
  // ========================================

  if (headers.length > 0) {
    sheet.autoFilter = {
      from: {
        row: headerRowNumber,
        column: 1,
      },

      to: {
        row: headerRowNumber,
        column: headers.length,
      },
    };
  }

  // ========================================
  // 15. SAVE FILE
  // ========================================

  const filePath = getReportFilePath(
    process.env.ALERT_BI_51_FILE_NAME || "15m_oran_red",
  );

  await workbook.xlsx.writeFile(filePath);

  return filePath;
}

module.exports = {
  generateExcel,
  formatDate,
  getColumnLetter,
};
