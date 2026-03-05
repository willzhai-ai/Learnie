#!/usr/bin/env python3
"""
FunASR 本地语音识别服务
调试版本
"""

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import tempfile
import os
from typing import Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="FunASR 语音识别服务", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

asr_model = None


class TranscriptionResponse(BaseModel):
    success: bool
    transcript: str
    text: str
    duration: Optional[float] = None
    model: str
    debug_info: Optional[dict] = None


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_name: str


def load_model():
    """加载 FunASR 模型"""
    global asr_model

    try:
        from funasr import AutoModel

        logger.info("正在加载 Paraformer 模型...")

        asr_model = AutoModel(
            model="paraformer-zh",
            device="cpu",
            disable_pbar=True,
            disable_update=True,
        )

        logger.info("✅ 模型加载成功！")
        return True

    except Exception as e:
        logger.error(f"❌ 模型加载失败: {e}")
        return False


@app.on_event("startup")
async def startup():
    logger.info("🚀 FunASR 服务启动中...")
    success = load_model()
    if success:
        logger.info("✅ 服务就绪！")
    else:
        logger.warning("⚠️  模型未加载")


@app.get("/health")
async def health():
    """健康检查"""
    return HealthResponse(
        status="healthy",
        model_loaded=asr_model is not None,
        model_name="paraformer-zh" if asr_model else "none"
    )


def convert_audio(audio_bytes: bytes, filename: str) -> tuple:
    """转换音频为 FunASR 需要的格式"""

    # 确定文件扩展名
    ext = os.path.splitext(filename)[1] if filename else ".webm"

    logger.info(f"=== 音频转换开始 ===")
    logger.info(f"原始文件: {filename}, 大小: {len(audio_bytes)} bytes")

    # 保存临时文件
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp_input:
        tmp_input.write(audio_bytes)
        tmp_input_path = tmp_input.name

    try:
        # 方法 1: 使用 pydub + ffmpeg (最可靠)
        try:
            from pydub import AudioSegment

            logger.info("使用 pydub 处理音频...")

            audio = AudioSegment.from_file(tmp_input_path)

            logger.info(f"pydub: 原始音频 - 时长: {len(audio)/1000:.2f}s, "
                       f"声道: {audio.channels}, 采样率: {audio.frame_rate}Hz")

            # 转换为单声道 16kHz
            audio = audio.set_channels(1)
            audio = audio.set_frame_rate(16000)

            # 归一化到 -1 到 1
            samples = np.array(audio.get_array_of_samples())

            # 检查数据类型
            logger.info(f"样本类型: {samples.dtype}, 范围: [{samples.min()}, {samples.max()}]")

            # 如果是整数类型，归一化
            if samples.dtype in [np.int16, np.int32]:
                samples = samples.astype(np.float32) / 32768.0
            elif samples.dtype == np.uint8:
                samples = samples.astype(np.float32) / 255.0
            elif samples.max() > 1.0:
                samples = samples.astype(np.float32) / 32768.0

            logger.info(f"转换后 - 样本类型: {samples.dtype}, 范围: [{samples.min():.4f}, {samples.max():.4f}]")

            # 确保是一维数组
            if len(samples.shape) > 1:
                samples = samples.flatten()

            duration = len(samples) / 16000
            logger.info(f"最终音频 - 采样点: {len(samples)}, 时长: {duration:.2f}s")

            return samples, 16000, {
                "method": "pydub",
                "original_channels": audio.channels,
                "original_rate": audio.frame_rate,
                "converted_samples": len(samples),
                "data_min": float(samples.min()),
                "data_max": float(samples.max()),
                "data_mean": float(np.mean(samples)),
                "data_std": float(np.std(samples))
            }

        except Exception as e:
            logger.error(f"pydub 失败: {e}")
            raise

    finally:
        if os.path.exists(tmp_input_path):
            os.unlink(tmp_input_path)


@app.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    language: str = Form("auto"),
    vad: bool = Form(True)
):
    """语音识别"""
    if asr_model is None:
        raise HTTPException(status_code=503, detail="模型未加载，请等待")

    try:
        contents = await audio.read()
        logger.info(f"收到音频: {audio.filename}, {len(contents)} bytes")

        # 转换音频
        audio_array, sample_rate, debug_info = convert_audio(contents, audio.filename)
        duration = len(audio_array) / sample_rate

        # 调用 FunASR
        logger.info("开始识别...")
        result = asr_model.generate(
            input=audio_array,
            batch_size_s=300,
        )

        # 解析结果
        transcript = ""
        if result and len(result) > 0:
            if isinstance(result[0], dict):
                transcript = result[0].get("text", "")
            else:
                transcript = str(result[0])

        logger.info(f"识别结果: '{transcript}'")
        logger.info(f"调试信息: {debug_info}")

        return TranscriptionResponse(
            success=True,
            transcript=transcript.strip(),
            text=transcript.strip(),
            duration=round(duration, 2),
            model="paraformer-zh",
            debug_info=debug_info
        )

    except Exception as e:
        logger.error(f"识别失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"识别失败: {str(e)}")


@app.get("/")
async def root():
    return {
        "message": "FunASR 语音识别服务 - 调试版本",
        "endpoints": {
            "health": "/health",
            "transcribe": "/transcribe (POST)",
            "test": "/test (GET) - 测试页面"
        }
    }


if __name__ == "__main__":
    import uvicorn

    print("""
    ╔════════════════════════════════════════════════════════╗
    ║           FunASR 语音识别服务 (调试版)                   ║
    ╚════════════════════════════════════════════════════════╝
    """)

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
