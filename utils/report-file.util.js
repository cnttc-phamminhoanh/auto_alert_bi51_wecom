const path = require("path");

function getReportFilePath(reportName) {
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
    "../reports",
    `${reportName}_${timestamp}.xlsx`,
  );
}

// Chia chuỗi thành các nhóm, mỗi nhóm 6 phần tử
function splitIntoGroups(text, itemsPerGroup = 6) {
  if (!text) return [];

  // Tách thành các phần tử bằng dấu phẩy
  const parts = text.split(", ").filter((p) => p.trim() !== "");

  const groups = [];
  for (let i = 0; i < parts.length; i += itemsPerGroup) {
    groups.push(parts.slice(i, i + itemsPerGroup).join(", "));
  }

  return groups;
}

function getWarningStats(data) {
  const stats = {
    total: data.length,
    do: data.filter((r) => r.color === "do").length,
    cam: data.filter((r) => r.color === "cam").length,
    vang: data.filter((r) => r.color === "vang").length,
    byWorker: {},
    byFlow: {},
  };

  data.forEach((row) => {
    const worker = row["Worker Name"] || "Unknown";

    if (!stats.byWorker[worker]) {
      stats.byWorker[worker] = { total: 0, do: 0, cam: 0, vang: 0 };
    }

    stats.byWorker[worker].total++;
    
    if (row.color === "do") stats.byWorker[worker].do++;
    else if (row.color === "cam") stats.byWorker[worker].cam++;
    else if (row.color === "vang") stats.byWorker[worker].vang++;

    const flow = row["Flow"] || "Unknown";

    if (!stats.byFlow[flow]) {
      stats.byFlow[flow] = { total: 0, do: 0, cam: 0, vang: 0 };
    }

    stats.byFlow[flow].total++;

    if (row.color === "do") stats.byFlow[flow].do++;
    else if (row.color === "cam") stats.byFlow[flow].cam++;
    else if (row.color === "vang") stats.byFlow[flow].vang++;
  });

  return stats;
}

module.exports = {
  getReportFilePath,
  splitIntoGroups,
  getWarningStats,
};
