import mimetypes, os, sys, struct
from google import genai
from google.genai import types

def save(f, d):
    with open(f, "wb") as x: x.write(d)

def to_wav(d, m):
    p = parse(m); b, s = p["bits_per_sample"], p["rate"]; n, ds = 1, len(d); bs = b // 8; ba = n * bs; br = s * ba; cs = 36 + ds
    h = struct.pack("<4sI4s4sIHHIIHH4sI", b"RIFF", cs, b"WAVE", b"fmt ", 16, 1, n, s, br, ba, b, b"data", ds)
    return h + d

def parse(m):
    b, r = 16, 24000
    for p in m.split(";"):
        p = p.strip()
        if p.lower().startswith("rate="):
            try: r = int(p.split("=", 1)[1])
            except: pass
        elif p.startswith("audio/L"):
            try: b = int(p.split("L", 1)[1])
            except: pass
    return {"bits_per_sample": b, "rate": r}

def tts(text, out):
    c = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    cfg = types.GenerateContentConfig(temperature=1, response_modalities=["audio"], speech_config=types.SpeechConfig(voice_config=types.VoiceConfig(prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name="Orus"))))
    cnt = [types.Content(role="user", parts=[types.Part.from_text(text=f"Read in Arabic, Moroccan accent: {text}")])]
    d = b""
    for ch in c.models.generate_content_stream(model="gemini-3.1-flash-tts-preview", contents=cnt, config=cfg):
        if ch.parts and ch.parts[0].inline_data and ch.parts[0].inline_data.data:
            x = ch.parts[0].inline_data; buf = x.data
            if mimetypes.guess_extension(x.mime_type) is None: buf = to_wav(x.data, x.mime_type)
            d += buf
    save(out, d)

if __name__ == "__main__": tts(sys.argv[1], sys.argv[2])
