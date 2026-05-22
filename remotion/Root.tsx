import { Composition } from 'remotion';
import { ViralVideo } from './Composition';
import scriptData from '../assets/script.json';

export const Root: React.FC = () => {
  const totalDuration = scriptData.scenes.reduce((sum, scene) => sum + scene.duration, 0);
  return (
    <Composition
      id="ViralVideo"
      component={ViralVideo}
      durationInFrames={totalDuration * 30}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ scenes: scriptData.scenes }}
    />
  );
};
