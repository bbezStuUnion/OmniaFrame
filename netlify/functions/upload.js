import { Octokit } from "@octokit/rest";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",      // ⚠ 如果你希望更安全可换指定域
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// 统一 CORS 响应函数
function response(statusCode, bodyObject) {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(bodyObject),
  };
}

export const handler = async (event) => {
  // ===== OPTIONS: Preflight =====
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "OK",
    };
  }

  if (event.httpMethod !== "POST") {
    return response(405, { error: "Method not allowed" });
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return response(400, { error: "Invalid JSON" });
  }

  // required fields
  const { fileBase64, fileName, name, className, type } = body;
  if (!fileBase64 || !fileName || !name || !className || !type) {
    return response(400, { error: "Missing fields" });
  }

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  const owner = "你的GitHub用户名";
  const repo = "你的仓库名";
  const folder = "submissions";

  const ts = new Date().toISOString().replace(/[:.]/g, "-");

  const imagePath = `${folder}/${ts}_${fileName}`;
  const jsonPath = `${folder}/${ts}.json`;

  const meta = {
    ...body,
    storedAt: new Date().toISOString(),
    file: imagePath,
  };

  try {
    // 上传文件
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: imagePath,
      message: `upload ${imagePath}`,
      content: fileBase64,
    });

    // 上传 JSON
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: jsonPath,
      message: `upload ${jsonPath}`,
      content: Buffer.from(JSON.stringify(meta, null, 2)).toString("base64"),
    });

    // ==========================
    // 返回成功（保证包含 CORS header）
    // ==========================
    return response(200, {
      ok: true,
      message: "Uploaded successfully",
      image: imagePath,
      metadata: jsonPath,
    });

  } catch (err) {
    console.error("Upload error:", err);

    return response(500, {
      ok: false,
      error: err.message,
    });
  }
};
