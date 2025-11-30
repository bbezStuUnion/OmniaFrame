import base64
import json
import requests
from pathlib import Path

# ⚙️ 请替换成你自己的 Netlify Function 地址
NETLIFY_UPLOAD_URL = "https://omniaframe.netlify.app/.netlify/functions/upload"

# 读取图片
file_path = Path("pictures.jpg")
if not file_path.exists():
    raise FileNotFoundError("未找到 pictures.jpg，请将图片放在同目录下")

with open(file_path, "rb") as f:
    file_bytes = f.read()
    base64_file = base64.b64encode(file_bytes).decode("utf-8")

# 构造请求体
payload = {
    "name": "测试用户",
    "className": "高一1班",
    "title": "测试图片上传",
    "category": "photography",
    "description": "这是一张测试用的图片",
    "fileName": "pictures.jpg",
    "fileData": f"data:image/jpeg;base64,{base64_file}",
}

# 发送 POST 请求
print("🚀 正在上传...")
response = requests.post(
    NETLIFY_UPLOAD_URL,
    headers={"Content-Type": "application/json"},
    data=json.dumps(payload),
)

# 打印结果
print("✅ 状态码:", response.status_code)
print("📩 返回内容:", response.text)
