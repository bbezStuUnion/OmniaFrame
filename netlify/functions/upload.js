export const handler = async (event) => {
  try {
    // 解析前端表单
    const data = event.body ? JSON.parse(event.body) : {};
    const { name, className, title, category, description, fileData, fileName } = data;

    if (!fileData || !fileName) {
      return { statusCode: 400, body: "Missing file" };
    }

    // 将 Base64 文件内容上传至 GitHub
    const githubResponse = await fetch(
      `https://api.github.com/repos/bbezStuUnion/OmniaFrame/contents/submissions/${fileName}`,
      {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Upload by ${name} (${className})`,
          content: fileData.split(",")[1], // 去掉 data:image/jpeg;base64, 前缀
          committer: {
            name: "Netlify Bot",
            email: "bot@netlify.app",
          },
        }),
      }
    );

    if (!githubResponse.ok) {
      const text = await githubResponse.text();
      throw new Error(text);
    }

    // 保存投稿信息（可选：创建一个 info.json）
    const metadata = {
      name,
      className,
      title,
      category,
      description,
      file: fileName,
      timestamp: new Date().toISOString(),
    };

    await fetch(
      `https://api.github.com/repos/bbezStuUnion/OmniaFrame/contents/submissions/${fileName}.json`,
      {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Metadata for ${fileName}`,
          content: Buffer.from(JSON.stringify(metadata, null, 2)).toString("base64"),
        }),
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    return { statusCode: 500, body: `Error: ${err.message}` };
  }
};
