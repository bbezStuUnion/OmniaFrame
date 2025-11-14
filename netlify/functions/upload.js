// /netlify/functions/upload.js

import { Octokit } from "@octokit/rest";

const headers = {
  "Access-Control-Allow-Origin": "*",             // ← 允许所有源调用（可改成你的域名）
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const handler = async (event) => {
  // 处理预检请求（browser preflight）
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "OK",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: "Method Not Allowed",
    };
  }

  try {
    const body = JSON.parse(event.body);

    const {
      fileBase64,
      fileName,
      name,
      className,
      type,
      sentence = "",
      portraitApproval = false,
    } = body;

    if (!fileBase64 || !fileName || !name || !className || !type) {
      return {
        statusCode: 400,
        headers,
        body: "Missing fields",
      };
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    const owner = "bbezStuUnion";
    const repo = "OmniaFrame";
    const folder = "submissions";

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    const imagePath = `${folder}/${timestamp}_${fileName}`;
    const metaPath = `${folder}/${timestamp}.json`;

    const meta = {
      name,
      class: className,
      type,
      sentence,
      portraitApproval,
      file: imagePath,
      time: new Date().toISOString(),
    };

    // 上传图片
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: imagePath,
      message: `upload ${timestamp}_${fileName}`,
      content: fileBase64,
    });

    // 上传 JSON
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: metaPath,
      message: `upload ${timestamp}.json`,
      content: Buffer.from(JSON.stringify(meta, null, 2)).toString("base64"),
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        image: imagePath,
        meta: metaPath,
      }),
    };
  } catch (err) {
    console.error("Upload error:", err);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
