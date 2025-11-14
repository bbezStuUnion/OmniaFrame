import { Octokit } from "@octokit/rest";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

// 统一响应
function respond(status, obj) {
  return {
    statusCode: status,
    headers,
    body: JSON.stringify(obj)
  };
}

export const handler = async (event) => {

  // --- 预检请求 ---
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "OK"
    };
  }

  if (event.httpMethod !== "POST") {
    return respond(405, { error: "Method Not Allowed" });
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch (e) {
    return respond(400, { error: "Invalid JSON" });
  }

  const { fileBase64, name, className, type, sentence = "", portraitApproval = false } = data;
  if (!fileBase64 || !name || !className || !type) {
    return respond(400, { error: "Missing fields" });
  }

  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    const owner = "你的GitHub用户名";
    const repo = "你的仓库名";
    const folder = "submissions";

    // 统一命名：例如 2025-11-14-12-59-33_abc123.jpg
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const random = Math.random().toString(36).slice(2, 10);
    const imageFile = `${folder}/${ts}_${random}.jpg`;  // 文件名不再使用原始名称
    const jsonFile = `${folder}/${ts}_${random}.json`;

    // 1. 上传图片
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: imageFile,
      message: `upload image ${imageFile}`,
      content: fileBase64
    });

    // 2. 上传 JSON（不包含 base64）
    const jsonPayload = {
      name,
      class: className,
      type,
      sentence,
      portraitApproval,
      image: imageFile,        // 仅保存文件路径
      time: new Date().toISOString()
    };

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: jsonFile,
      message: `upload metadata ${jsonFile}`,
      content: Buffer.from(JSON.stringify(jsonPayload, null, 2)).toString("base64")
    });

    return respond(200, {
      ok: true,
      image: imageFile,
      metadata: jsonFile
    });

  } catch (err) {
    console.error("Upload error:", err);
    return respond(500, { ok: false, error: err.message });
  }
};
