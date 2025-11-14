// /netlify/functions/submit-art.js

import { Octokit } from "@octokit/rest";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  // Netlify 会自动解析 multipart/form-data
  const body = JSON.parse(event.body);

  // 投稿字段
  const {
    title = "",
    name,
    className,
    type, // 摄影 / 绘画
    sentence = "",
    portraitApproval = false, // bool
    fileBase64, // 前端将图片转 base64
    fileName,    // 如 xx.jpg
  } = body;

  // 校验基本字段
  if (!name || !className || !type || !fileBase64 || !fileName) {
    return {
      statusCode: 400,
      body: "Missing required fields",
    };
  }

  // GitHub 连接
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN, // 记得在 Netlify 环境变量里配置
  });

  const owner = "bbezStuUnion";
  const repo = "OmniaFrame"; // 例如 campus-art-system
  const folder = "submissions";

  // 生成唯一文件名
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  const imagePath = `${folder}/${timestamp}_${fileName}`;
  const jsonPath  = `${folder}/${timestamp}.json`;

  // 要上传的 JSON 数据
  const submissionData = {
    title,
    name,
    class: className,
    type,
    sentence,
    portraitApproval,
    originalFile: imagePath,
    submitTime: new Date().toISOString(),
  };

  try {
    // 上传作品文件（Base64）
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: imagePath,
      message: `Upload artwork ${timestamp}_${fileName}`,
      content: fileBase64, // base64 无需再转
    });

    // 上传 JSON
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: jsonPath,
      message: `Create metadata ${timestamp}.json`,
      content: Buffer.from(JSON.stringify(submissionData, null, 2)).toString("base64"),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Submission uploaded to GitHub",
        file: imagePath,
        metadata: jsonPath,
      }),
    };
  } catch (error) {
    console.error("Upload error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};
