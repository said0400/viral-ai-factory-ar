import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from 'pexels';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import https from 'https';
import dotenv from 'dotenv';

dotenv.config();
const execAsync = promisify(exec);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const pexels = createClient(process.env.PEXELS_API_KEY);

['assets', 'output'].forEach(dir =>!fs.existsSync(dir) && fs.mkdirSync(dir, { recursive: true }));

async function generateScript(topic) {
  console.log('[1/4] جيميناي يكتب السكريبت...');
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  const prompt = `أنت كاتب محتوى فيروسي ليوتيوب شورتس. الموضوع: ${topic}
  أرجع JSON فقط بدون أي شرح:
  {
    "title": "عنوان قصير",
    "scenes": [
      {"text": "نص عربي للمشهد", "duration": 9, "keywords": "sad man rain", "annotation": "هل تعلم أن 90% يستسلمون؟", "annotation_color": "#FF6B00"},
      {"text": "نص عربي للمشهد", "duration": 9, "keywords": "city night traffic", "annotation": "نصيحة: السر في الاستمرارية", "annotation_color": "#00C853"},
      {"text": "نص عربي للمشهد", "duration": 9, "keywords": "success business man", "annotation": "حقيقة: النجاح تراكمي", "annotation_color": "#2962FF"},
      {"text": "نص عربي للمشهد", "duration": 9, "keywords": "happy family sunset", "annotation": "تحذير: لا تقارن نفسك", "annotation_color": "#D50000"},
      {"text": "نص عربي للمشهد", "duration": 9, "keywords": "motivational sunrise", "annotation": "الخلاصة: ابدأ اليوم", "annotation_color": "#FF6B00"}
    ]
  }
  5 مشاهد بالضبط، المجموع 45 ثانية. اللهجة مغربية مبسطة.`;

  const result = await model.generateContent(prompt);
  const jsonText = result.response.text().replace(/```json|```/g, '').trim();
  const data = JSON.parse(jsonText);
  fs.writeFileSync('assets/script.json', JSON.stringify(data, null, 2));
  return data;
}

async function downloadVideos(scenes) {
  console.log('[2/4] نحمل فيديوهات من Pexels...');
  for (let i = 0; i < scenes.length; i++) {
    const res = await pexels.videos.search({ query: scenes[i].keywords, per_page: 1, orientation: 'portrait' });
    if (!res.videos.length) throw new Error(`No video found for: ${scenes[i].keywords}`);
    const file = res.videos[0].video_files.find(v => v.quality === 'hd') || res.videos[0].video_files[0];
    await new Promise((resolve, reject) => {
      https.get(file.link, response => {
        const stream = fs.createWriteStream(`assets/scene_${i}.mp4`);
        response.pipe(stream);
        stream.on('finish', () => stream.close(resolve));
        stream.on('error', reject);
      }).on('error', reject);
    });
    console.log(` ✓ مشهد ${i + 1}`);
  }
}

async function main() {
  try {
    const topic = process.argv[2] || "قصة نجاح ملهمة";
    console.log(`🚀 الموضوع: ${topic}\n`);
    const script = await generateScript(topic);
    await downloadVideos(script.scenes);
    const fullText = script.scenes.map(s => s.text).join('. ');
    console.log('[3/4] جيميناي TTS يسوي الصوت...');
    await execAsync(`python scripts/tts_gemini.py "${fullText.replace(/"/g, '\\"')}" assets/voice.wav`);
    console.log('[4/4] Remotion يركب الفيديو...');
    await execAsync('npm run render');
    console.log('\n✅ تم! الفيديو: output/video.mp4');
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  }
}

main();
