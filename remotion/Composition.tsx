import { AbsoluteFill, Audio, Sequence, Video, staticFile, interpolate, useCurrentFrame } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Cairo';
const { fontFamily } = loadFont();
export const ViralVideo = ({ scenes }) => {
  let f = 0;
  return (<AbsoluteFill style={{ backgroundColor: 'black' }}>
    <Audio src={staticFile('voice.wav')} />
    {scenes.map((s, i) => {
      const d = s.duration * 30, cf = f; f += d;
      return (<Sequence key={i} from={cf} durationInFrames={d}>
        <Video src={staticFile(`scene_${i}.mp4`)} />
        <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 180 }}>
          <div style={{ backgroundColor: 'rgba(0,0,0,0.75)', padding: '25px 50px', borderRadius: 25, maxWidth: '85%' }}>
            <h1 style={{ fontFamily, fontSize: 70, color: 'white', direction: 'rtl', textAlign: 'center', margin: 0, lineHeight: 1.3 }}>{s.text}</h1>
          </div>
        </AbsoluteFill>
        {s.annotation && <Ann text={s.annotation} color={s.annotation_color || '#FF6B00'} />}
      </Sequence>);
    })}
  </AbsoluteFill>);
};
const Ann = ({ text, color }) => {
  const fr = useCurrentFrame();
  const o = interpolate(fr, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const y = interpolate(fr, [0, 15], [-50, 0], { extrapolateRight: 'clamp' });
  if (fr < 5) return null;
  return (<AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', paddingTop: 120, opacity: o, transform: `translateY(${y}px)` }}>
    <div style={{ backgroundColor: color, padding: '20px 35px', borderRadius: 15, border: '4px solid white', boxShadow: '0 8px 20px rgba(0,0,0,0.5)', maxWidth: '80%' }}>
      <h2 style={{ fontFamily, fontSize: 55, color: 'white', direction: 'rtl', textAlign: 'center', margin: 0, fontWeight: 700 }}>💡 {text}</h2>
    </div>
  </AbsoluteFill>);
};
