import mimetypes
import os
import sys
import struct
from google import genai
from google.genai import types

def save_binary_file(file_name, data):
    with open(file_name, "wb") as f:
        f.write(data)

def convert_to_wav(audio_data, mime_type):
    parameters = parse_audio_mime_type(mime_type)
    bits_per_sample = parameters["bits_per_sample"]
    sample_rate = parameters["rate"]
    num_channels = 1
    data_size = len(audio_data)
    bytes_per_sample = bits_per_sample // 8
    block_align = num_channels * bytes_per_sample
    byte_rate = sample_rate * block_align
    chunk_size = 36 + data_size
    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF", chunk_size, b"WAVE", b"fmt ", 16, 1, num_channels,
        sample_rate, byte_rate, block_align, bits_per_sample,
        b"data", data_size
    )
    return header + audio_data

def parse_audio_mime_type(mime_type):
    bits_per_sample = 16
    rate = 24000
    for param in mime_type.split(";"):
        param = param.strip()
        if param.lower().startswith("rate="):
            try:
                rate = int(param.split("=", 1)[1])
            except:
                pass
        elif param.startswith("audio/L"):
            try:
                bits_per_sample = int(param.split("L", 1)[1])
            except:
                pass
    return {"bits_per_sample": bits_per_sample, "rate": rate}

def generate_tts(text_to_speak, output_path):
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    model = "gemini-3.1-flash-tts-preview"
    contents = [types.Content(
        role="user",
        parts=[types.Part.from_text(text=f"Read in Arabic with Neutral Moroccan accent: {text_to_speak}")]
    )]
    config = types.GenerateContentConfig(
        temperature=1,
        response_modalities=["audio"],
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name="Orus")
            )
        )
    )
    audio_data = b""
    for chunk in client.models.generate_content_stream(model=model, contents=contents, config=config):
        if chunk.parts and chunk.parts[0].inline_data and chunk.parts[0].inline_data.data:
            inline_data = chunk.parts[0].inline_data
            data_buffer = inline_data.data
            if mimetypes.guess_extension(inline_data.mime_type) is None:
                data_buffer = convert_to_wav(inline_data.data, inline_data.mime_type)
            audio_data += data_buffer
    save_binary_file(output_path, audio_data)
    print(f"TTS saved: {output_path}")

if __name__ == "__main__":
    generate_tts(sys.argv[1], sys.argv[2])
