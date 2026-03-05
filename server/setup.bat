@echo off
REM FunASR 服务安装脚本 (Windows)

echo ========================================
echo  FunASR 语音识别服务安装
echo ========================================
echo.

REM 检查 Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Python，请先安装 Python 3.8+
    pause
    exit /b 1
)

echo [1/2] 检测 Python 版本...
python --version

echo.
echo [2/2] 安装依赖...
pip install fastapi uvicorn python-multipart pydantic funasr modelscope soundfile librosa numpy

echo.
echo ========================================
echo  安装完成！
echo ========================================
echo.
echo 启动服务:
echo   cd server
echo   python main.py
echo.
echo API 文档: http://localhost:8000/docs
echo.
pause
