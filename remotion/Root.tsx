import { Composition } from 'remotion';
import { ViralVideo } from './Composition';
import scriptData from '../assets/script.json';
export const Root: React.FC = () => {
  const dur = scriptData.scenes.reduce((s, x) => s + x.duration, 0);
  return (<Composition id="ViralVideo" component={ViralVideo} durationInFrames={dur * 30} fps={30} width={1080} height={1920} defaultProps={{ scenes: scriptData.scenes }} />);
};
