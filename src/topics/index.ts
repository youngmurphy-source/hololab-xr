import { qualitativeAnalysis } from './qualitativeAnalysis';
import { biology } from './biology';
import { hydrogen } from './hydrogen';
import { indicators } from './indicators';
import { oxygen } from './oxygen';
import { physics } from './physics';
import { separation } from './separation';
import { equipment } from './equipment';
import type { TopicDef } from './topic';

// Topics in menu order. All core curriculum experiments are now active and ready.
export const TOPICS: TopicDef[] = [
  qualitativeAnalysis,
  indicators,
  separation,
  equipment,
  hydrogen,
  oxygen,
  biology,
  physics,
];

