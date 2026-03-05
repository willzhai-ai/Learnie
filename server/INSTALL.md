# FunASR 快速安装指南

## 一键安装（推荐）

```bash
cd server
pip3 install fastapi uvicorn python-multipart pydantic funasr modelscope soundfile librosa numpy
```

## 启动服务

```bash
python3 main.py
```

## 说明

1. **首次运行会下载模型** (~950MB)，请耐心等待
2. 模型下载后会缓存到 `~/.cache/modelscope/`
3. 之后的启动会很快

## 验证安装

访问 http://localhost:8000/health

应该返回：
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_name": "paraformer-zh"
}
```

## 故障排查

### Q: 安装 funasr 失败

**A**: 使用国内镜像
```bash
pip3 install funasr -i https://mirrors.aliyun.com/pypi/simple/
```

### Q: 模型下载很慢

**A**: 模型约 950MB，首次需要等待。可以使用国内网络加速。

### Q: Python 版本问题

**A**: 确保使用 Python 3.8+
```bash
python3 --version
```

### Q: 依赖冲突

**A**: 使用虚拟环境
```bash
python3 -m venv venv
source venv/bin/activate
pip3 install -r requirements.txt
```
