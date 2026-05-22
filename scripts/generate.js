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
['assets', 'output'].forEach(dir =>!fs.existsSync(dir) && fs.mkdirSync(dir));

async function generateScript(topic) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `أنت كاتب محتوى فيروسي ليوتيوب شورتس. الموضوع: ${topic}
  أرجع JSON فقط: {"title":"عنوان","scenes":[{"text":"نص عربي","duration":9,"keywords":"sad man rain","annotation":"هل تعلم؟","annotation_color":"#FF6B00"}]}
  5 مشاهد، المجموع 45 ثانية. اللهجة مغربية مبسطة.`;
  const result = await model.generateContent(prompt);
  const data = JSON.parse(result.response.text().replace(/```json|```/g, '').trim());
  fs.writeFileSync('assets/script.json', JSON.stringify(data, null, 2));
  return data;
}

async function downloadVideos(scenes) {
  for (let i = 0; i < scenes.length; i++) {
    const res = await pexels.videos.search({ query: scenes[i].keywords, per_page: 1, orientation: 'portrait' });
    if (!res.videos.length) throw new Error(`No video: ${scenes[i].keywords}`);
    const file = res.videos[0].video_files.find(v => v.quality === 'hd') || res.videos[0].video_files[0];
    await new Promise((r, e) => https.get(file.link, res => res.pipe(fs.createWriteStream(`assets/scene_${i}.mp4`)).on('finish', r).on('error', e)));
  }
}

async function main() {
  const topic = process.argv[2] || "قصة نجاح ملهمة";
  const script = await generateScript(topic);
  await downloadVideos(script.scenes);
  const fullText = script.scenes.map(s => s.text).join('. ');
  await execAsync(`python scripts/tts_gemini.py "${fullText.replace(/"/g, '\\"')}" assets/voice.wav`);
  await execAsync('npm run render');
  console.log('Done: output/video.mp4');
}
main().catch(e => { console.error(e); process.exit(1); });
