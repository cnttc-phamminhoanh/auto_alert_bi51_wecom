const axios = require("axios");

async function sendJobFailureCard({
  biName,
  jobName,
  failureTime,
  status = "FAILED",
  errorDescription
}) {
  const webhook = process.env.ALERT_BI_51_WECOM_WEBHOOK_4_COLUMN;

  const message = `
# 🚨 SQL Job Execution Failure

> **BI Name:** ${biName}
> **Job Name:** ${jobName}
> **Failure Time:** ${failureTime}
> **Status:** <font color="warning">${status}</font>

> **Error Description:**
> ${errorDescription}

⚠️ Please check the SQL Job immediately!
`;

  const { data: result } = await axios.post(webhook, {
    msgtype: "markdown",
    markdown: {
      content: message
    }
  });

  if (result.errcode !== 0) {
    throw new Error(result.errmsg);
  }

  return result;
}

module.exports = {
  sendJobFailureCard,
};
