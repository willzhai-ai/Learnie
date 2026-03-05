# FunASR 语音识别服务

基于阿里巴巴达摩院 FunASR 的本地语音识别服务。

## 功能特点

- ✅ **离线运行** - 无需网络连接
- ✅ **高精度识别** - Paraformer 模型
- ✅ **中英文混合** - 自动检测语言
- ✅ **实时识别** - 支持流式识别
- ✅ **GPU 加速** - 支持 CUDA

## 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 启动服务

```bash
python main.py
```

服务将在 http://localhost:8000 启动。

### 3. 测试 API

访问 http://localhost:8000/docs 查看 API 文档。

## API 接口

### POST /transcribe

语音识别接口。

**请求:**
```bash
curl -X POST "http://localhost:8000/transcribe" \
  -F "audio=@test.wav" \
  -F "language=auto" \
  -F "vad=true"
```

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

健康检查接口。

**响应:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_name": "paraformer-zh"
}
```

## 配置

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| USE_CUDA | 是否使用 GPU 加速 | 0 |
| HOST | 服务监听地址 | 0.0.0.0 |
| PORT | 服务端口 | 8000 |

### 使用 GPU 加速

```bash
# 安装 CUDA 版本的 PyTorch
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118

# 设置环境变量
export USE_CUDA=1

# 启动服务
python main.py
```

## 模型说明

### Paraformer-zh

- **模型**: paraformer-zh
- **语言**: 中文、英文
- **采样率**: 16kHz
- **模型大小**: ~200MB
- **用途**: 通用语音识别

### 模型下载

首次运行时会自动从 ModelScope 下载模型。如果下载失败，可以手动下载：

```bash
# 使用 modelscope
pip install modelscope
python -c "from modelscope import snapshot_download; snapshot_download('damo/speech_paraformer-large-vad-punc_asr_nat-zh-cn-16k-common-vocab8404-pytorch')"
```

## 故障排查

### 1. ModuleNotFoundError

```bash
pip install -r requirements.txt --upgrade
```

### 2. 模型下载失败

使用国内镜像：

```bash
pip install modelscope -i https://mirrors.aliyun.com/pypi/simple/
```

### 3. CUDA 相关错误

确保安装了正确版本的 CUDA 和 PyTorch。

```bash
# 检查 CUDA 是否可用
python -c "import torch; print(torch.cuda.is_available())"
```

## 开发

### 运行测试

```bash
# 安装测试依赖
pip install pytest pytest-asyncio httpx

# 运行测试
pytest tests/
```

### 代码结构

```
server/
├── main.py              # 主服务文件
├── requirements.txt     # 依赖列表
├── setup.sh            # Linux/macOS 设置脚本
├── setup.bat           # Windows 设置脚本
└── README.md           # 本文档
```

## 许可证

- FunASR: MIT License
- 本项目: MIT License
