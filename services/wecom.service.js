const axios = require("axios");

async function sendMentionMessage(users, webhook) {
  const { data: result } = await axios.post(webhook, {
    msgtype: "text",
    text: {
      content: "🚨 LƯU Ý / NOTE / 注意",
      mentioned_list: users,
    },
  });

  return result
}

async function sendJobFailureCard({
  biName,
  jobName,
  failureTime,
  status = "FAILED",
  errorDescription,
  mentionedUsers = [],
  webhook
}) {
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

  await sendMentionMessage(mentionedUsers, webhook);

  return result;
}

module.exports = {
  sendJobFailureCard,
};
