const path = require("path");

function createReportFile(reportName) {
  const now = new Date();

  const pad = (n) => String(n).padStart(2, "0");

  const timestamp =
    now.getFullYear() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    "_" +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds());

  return path.join(
    __dirname,
    "../excel_reports",
    `${reportName}_${timestamp}.xlsx`,
  );
}
/**
 * Chia chuỗi thành các nhóm, mỗi nhóm 6 phần tử
 */
function splitIntoGroups(text, itemsPerGroup = 6) {
    if (!text) return [];
    
    // Tách thành các phần tử bằng dấu phẩy
    const parts = text.split(', ').filter(p => p.trim() !== '');
    
    const groups = [];
    for (let i = 0; i < parts.length; i += itemsPerGroup) {
        groups.push(parts.slice(i, i + itemsPerGroup).join(', '));
    }
    
    return groups;
}

module.exports = {
  createReportFile,
  splitIntoGroups

}
