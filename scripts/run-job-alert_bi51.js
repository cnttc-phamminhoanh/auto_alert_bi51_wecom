const path = require("path");
const fs = require("fs/promises");
require("dotenv").config({
  path: path.join(__dirname, "../.env"),
  quiet: true
});
const { getJobHistory } = require("../repositories/report.repository")
const { createReportFile } = require("../utils/report-file.util")
const { closePool } = require("../config/database");
const { sendJobFailureCard } = require("../services/wecom.service");

(async () => {
  const jobName = process.argv[2];

  if (!jobName) {
    throw new Error("Job name is required");
  }

  try {
    console.log(`[${new Date().toISOString()}] [JOB] ${jobName}: === START ===`);
    
    // Check BI51 has updated
    const now = new Date();
    now.setMinutes(now.getMinutes() - 2);
    const runDate = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    const runTime = now.getHours() * 100 + now.getMinutes();
    

    const history = await getJobHistory(
      process.env.ALERT_BI_51_JOB_NAME,
      runDate,
      runTime
    );

    const mentioned_users = process.env.ALERT_BI_51_WECOM_USERS || ""
    const mentionedUsers = mentioned_users .split(",").map(x => x.trim()).filter(Boolean)

    // Job không có history
    if (history.length === 0) {
      await sendJobFailureCard({
        biName: process.env.ALERT_BI_51_BI_NAME,
        jobName: process.env.ALERT_BI_51_JOB_NAME,
        failureTime: `${runDate} ${runTime}`,
        status: "NOT EXECUTED",
        errorDescription: "IG Bundle Abnormal Hour Gap has not been executed. Please check!",
        mentionedUsers,
        webhook: process.env.ALERT_BI_51_WECOM_WEBHOOK_4_COLUMN || "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=a446d827-927d-42cd-9c1b-766c9fa6b25a"
      });

      return;
    }

    const job = history[0];

    // Job đã chạy nhưng fail
    if (job.run_status === 0) {
      await sendJobFailureCard({
        biName: process.env.ALERT_BI_51_BI_NAME,
        jobName: process.env.ALERT_BI_51_JOB_NAME,
        failureTime: `${runDate} ${runTime}`,
        status: "FAILED",
        errorDescription: job.message || "IG Bundle Abnormal Hour Gap has failed. Please check!",
        mentionedUsers
      });

      return;
    }

    console.log(`[${new Date().toISOString()}] [JOB] ${jobName} === COMPLETED ===`)
  } catch (err) {
    console.error(`[${new Date().toISOString()}] [JOB] ${jobName} === FAILED ===`, err);
    process.exit(1);
  } finally {
    await closePool();
  }
})();
