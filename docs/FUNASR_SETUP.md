# FunASR 本地语音识别服务部署指南

## 概述

FunASR 是阿里巴巴达摩院开源的语音识别工具包，支持离线运行、高精度识别，特别适合教育场景。

### 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 前端 (3001)                       │
│                    - 录音并上传音频                           │
└──────────────────────────┬───────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│             Next.js API 路由 (/api/speech/evaluate)           │
│                    - 转发到 FunASR 服务                       │
└──────────────────────────┬───────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              Python FastAPI (8000)                           │
│              - FunASR 语音识别引擎                            │
└─────────────────────────────────────────────────────────────┘
```

## 快速开始

### 1. 安装 Python 依赖

#### macOS / Linux

```bash
# 进入项目目录
cd game01

# 运行设置脚本
chmod +x server/setup.sh
./server/setup.sh
```

#### Windows

```cmd
# 双击运行
server\setup.bat

# 或在命令行中运行
cd server
python setup.bat
```

### 2. 启动 FunASR 服务

```bash
# 方式1: 直接运行
python server/main.py

# 方式2: 使用 uvicorn
uvicorn server.main:app --reload --host 0.0.0.0 --port 8000
```

服务启动后会自动下载模型（首次约 200MB），看到以下消息表示成功：

```
✅ FunASR 模型加载成功！

╔════════════════════════════════════════════════════════╗
║                                                        ║
║           FunASR 语音识别服务                           ║
║                                                        ║
║   API 文档: http://localhost:8000/docs                  ║
║   健康检查: http://localhost:8000/health                ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
```

### 3. 启动 Next.js 服务

```bash
npm run dev
```

### 4. 测试

访问 http://localhost:3001/child/practice?difficulty=1 开始测试！

## API 文档

### POST /transcribe

语音识别接口

**参数:**
- `audio`: 音频文件 (支持 wav, mp3, webm, ogg)
- `language`: 语言类型 (auto/zh/en)
- `vad`: 是否启用 VAD (true/false)

**响应:**
```json
{
  "success": true,
  "transcript": "识别的文字内容",
  "text": "识别的文字内容",
  "duration": 2.5,
  "model": "paraformer-zh"
}
```

### GET /health

健康检查接口

**响应:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_name": "paraformer-zh"
}
```

## 环境变量

在 `.env.local` 中配置：

```env
# FunASR 服务地址（默认）
FUNASR_SERVICE_URL=http://localhost:8000

# OpenAI API Key（可选 - 用于 AI 智能判题）
# 如果不配置，将使用本地规则匹配
NEXT_PUBLIC_OPENAI_API_KEY=your_key_here
```

## 性能优化

### 使用 GPU 加速

如果有 NVIDIA GPU，可以启用 CUDA 加速：

```bash
# 安装 CUDA 版本的 PyTorch
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118

# 设置环境变量
export USE_CUDA=1

# 启动服务
python server/main.py
```

### 调整音频采样率

FunASR 最佳采样率为 16kHz，前端录音会自动转换。

## 常见问题

### 1. 模型下载失败

**解决方案**: 使用国内镜像

```bash
pip install modelscope -i https://mirrors.aliyun.com/pypi/simple/
```

### 2. ModuleNotFoundError: No module named 'funasr'

**解决方案**: 重新安装依赖

```bash
cd server
pip install -r requirements.txt
```

### 3. 端口 8000 被占用

**解决方案**: 修改端口号

```bash
# 使用其他端口
uvicorn server.main:app --port 8001
```

然后更新 `.env.local`:

```env
FUNASR_SERVICE_URL=http://localhost:8001
```

### 4. 识别结果不准确

**解决方案**:
1. 确保录音环境安静
2. 使用质量较好的麦克风
3. 说话时保持正常语速和音量

## 文件结构

```
game01/
├── server/
│   ├── main.py              # FastAPI 服务主文件
│   ├── requirements.txt     # Python 依赖
│   ├── setup.sh             # Linux/macOS 设置脚本
│   └── setup.bat            # Windows 设置脚本
├── src/
│   ├── app/api/speech/evaluate/
│   │   └── route.ts         # Next.js API 路由
│   └── hooks/
│       └── useSpeechWithOpenAI.ts  # 录音 Hook
└── docs/
    └── FUNASR_SETUP.md      # 本文档
```

## 技术栈

| 组件 | 技术 |
|------|------|
| 语音识别 | FunASR (Paraformer 模型) |
| 后端框架 | FastAPI |
| 前端框架 | Next.js 15 |
| 音频处理 | MediaRecorder API |
| 可选判题 | OpenAI GPT-4 |

## 许可证

FunASR 采用 MIT 许可证，可自由商用。
