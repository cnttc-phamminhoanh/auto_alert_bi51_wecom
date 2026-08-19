const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const { splitIntoGroups } = require("../utils/report-file.util");
const { getFlowWarningStats, getWeComIDsFromDB } = require("../repositories/report.repository");

async function sendMentionMessage(users, webhook) {
  const { data: result } = await axios.post(webhook, {
    msgtype: "text",
    text: {
      content: "🚨 LƯU Ý / NOTE / 注意",
      mentioned_list: users,
    },
  });

  return result;
}

async function sendJobFailureCard({
  biName,
  jobName,
  failureTime,
  status = "FAILED",
  errorDescription,
  mentionedUsers = [],
  webhook,
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
      content: message,
    },
  });

  if (result.errcode !== 0) {
    throw new Error(result.errmsg);
  }

  await sendMentionMessage(mentionedUsers, webhook);

  return result;
}

// Tạo tin nhắn thống kê Flow từ dữ liệu database
async function generateFlowMessage() {
  const stats = await getFlowWarningStats();

  let message = `<font color="0D47A1">**Thống kê 统计 (bundle)**</font>\n\n`;

  // Cam - Chỉ tiêu đề có màu cam, dữ liệu màu đen
  message += `<font color="EF6C00">**Cam 橙色**</font>\n`;
  if (stats["Cam"]) {
    // Chia thành các nhóm 6 phần tử
    const groups = splitIntoGroups(stats["Cam"], 5);

    // Dữ liệu màu đen (không có font color)
    groups.forEach((group, index) => {
      if (index === 0) {
        message += `> ${group}`;
      } else {
        message += `\n> ${group}`;
      }
    });
  } else {
    message += `> ...`;
  }
  message += "\n\n";
  // Đỏ - Chỉ tiêu đề có màu đỏ, dữ liệu màu đen
  message += `<font color="red">**Đỏ 红色**</font>\n`;
  if (stats["Đỏ"]) {
    // Chia thành các nhóm 6 phần tử
    const groups = splitIntoGroups(stats["Đỏ"], 5);

    // Dữ liệu màu đen (không có font color)
    groups.forEach((group, index) => {
      if (index === 0) {
        message += `> ${group}`;
      } else {
        message += `\n> ${group}`;
      }
    });
  } else {
    message += `> ...`;
  }
  message += "\n\n";

  // Footer - màu xám
  message += `<font color="comment">**Các bộ phận chú ý và xử lý!**</font>\n`;
  message += `<font color="comment">请相关部门注意并及时处理！</font>`;

  return message;
}

// Gửi tin nhắn thống kê Flow lên WeCom
async function sendFlowStatsMessage(webhookUrl) {
  try {
    const message = await generateFlowMessage();

    await axios.post(webhookUrl, {
      msgtype: "markdown",
      markdown: { content: message },
    });

    // console.log("✅ [cardwecom] Đã gửi tin nhắn thống kê Flow");
    return true;
  } catch (error) {
    console.error(`❌ [cardwecom] Lỗi gửi tin nhắn: ${error.message}`);
    return false;
  }
}

// 🆕 Gộp ID cứng + ID từ DB
async function getWeComIDs() {
  const userIds = process.env.ALERT_BI_51_WECOM_USERS
    ? process.env.ALERT_BI_51_WECOM_USERS.split(",").map((id) => id.trim()).filter(Boolean)
    : [];

  // const userIds = ALERT_BI_51_WECOM_USERS.filter((id) => id && id.trim() !== "");
  const dbIds = await getWeComIDsFromDB();

  const allIds = [...userIds];
  dbIds.forEach((id) => {
    if (!allIds.includes(id)) allIds.push(id);
  });

  return allIds;
}

// 🆕 Gửi tin nhắn tag người liên quan cảnh báo (đổi tên tránh trùng sendMentionMessage)
async function sendWarningMentionMessage(webhookUrl, customMessage = null) {
  try {
    const ids = await getWeComIDs();
    if (ids.length === 0) {
      // console.log("⚠️ [notewc] Không có ID để tag. Bỏ qua gửi tin nhắn.");
      return false;
    }
    const content = customMessage || "🚨 LƯU Ý / NOTE / 注意 \n";
    const { data: result } = await axios.post(webhookUrl, {
      msgtype: "text",
      text: { content, mentioned_list: ids },
    });
    if (result.errcode === 0) {
      // console.log(`✅ [notewc] Đã gửi tin nhắn tag ${ids.length} người`);
      return true;
    }
    console.error(`❌ [notewc] Gửi tin nhắn thất bại:`, result);
    return false;
  } catch (error) {
    console.error(`❌ [notewc] Lỗi gửi tin nhắn tag: ${error.message}`);
    return false;
  }
}

// 🆕 Gửi file Excel lên WeCom
async function sendFileToWecom(webhookUrl, filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File không tồn tại: ${filePath}`);
    }

    // console.log(`📤 [wecom] Đang gửi file: ${path.basename(filePath)}...`);

    const key = webhookUrl.split("key=")[1];
    if (!key) {
      throw new Error("Webhook URL không hợp lệ!");
    }

    const uploadUrl = `https://qyapi.weixin.qq.com/cgi-bin/webhook/upload_media?key=${key}&type=file`;

    const formData = new FormData();
    formData.append("media", fs.createReadStream(filePath), {
      filename: path.basename(filePath),
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const { data: uploadData } = await axios.post(uploadUrl, formData, {
      headers: formData.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    if (uploadData.errcode && uploadData.errcode !== 0) {
      throw new Error(`Upload thất bại: ${uploadData.errmsg}`);
    }

    const mediaId = uploadData.media_id;
    // console.log(`✅ [wecom] Upload thành công, media_id: ${mediaId}`);

    await axios.post(webhookUrl, {
      msgtype: "file",
      file: { media_id: mediaId },
    });

    // console.log(`✅ [wecom] Gửi file thành công`);
  } catch (error) {
    console.error(`❌ [wecom] Lỗi gửi file: ${error.message}`);
    throw error;
  }
}

module.exports = {
  sendJobFailureCard,
  generateFlowMessage,
  sendFlowStatsMessage,
  sendWarningMentionMessage,
  sendFileToWecom,
};
