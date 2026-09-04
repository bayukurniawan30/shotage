export interface FlowPreset {
  id: string;
  name: string;
  colors: string[];
  distortion?: number;
  swirl?: number;
  scale?: number;
  speed?: number;
}

export const FLOW_PRESETS: FlowPreset[] = [
  {
    id: 'flow-1',
    name: 'Feral Flow (Japanese Dawn)',
    colors: ['#EAF4FC', '#1E50A2', '#F09199', '#895B8A'],
    distortion: 60,
    swirl: 15,
    scale: 50,
    speed: 30,
  },
  {
    id: 'flow-2',
    name: 'Tokyo Twilight',
    colors: ['#0B0D1B', '#5A189A', '#E0AAFF', '#FF007F'],
    distortion: 65,
    swirl: 20,
    scale: 55,
    speed: 32,
  },
  {
    id: 'flow-3',
    name: 'Sakura Mist',
    colors: ['#FFF0F5', '#FFB7B2', '#FF6F91', '#845EC2'],
    distortion: 55,
    swirl: 12,
    scale: 48,
    speed: 26,
  },
  {
    id: 'flow-4',
    name: 'Matcha Spring',
    colors: ['#F1F8E9', '#A5D6A7', '#43A047', '#1B5E20'],
    distortion: 58,
    swirl: 18,
    scale: 50,
    speed: 28,
  },
  {
    id: 'flow-5',
    name: 'Midnight Aurora',
    colors: ['#050811', '#0F3460', '#00ADB5', '#9D4EDD'],
    distortion: 70,
    swirl: 25,
    scale: 52,
    speed: 35,
  },
  {
    id: 'flow-6',
    name: 'Pastel Dream',
    colors: ['#FDE2E4', '#FFCAD4', '#B5E2FA', '#C5A3FF'],
    distortion: 50,
    swirl: 10,
    scale: 45,
    speed: 24,
  },
  {
    id: 'flow-7',
    name: 'Electric Neon',
    colors: ['#050505', '#00F2FE', '#4FACFE', '#FA709A'],
    distortion: 68,
    swirl: 22,
    scale: 55,
    speed: 36,
  },
  {
    id: 'flow-8',
    name: 'Sunset Horizon',
    colors: ['#FFEAA7', '#FAB1A0', '#E17055', '#6C5CE7'],
    distortion: 62,
    swirl: 16,
    scale: 50,
    speed: 30,
  },
  {
    id: 'flow-9',
    name: 'Cosmic Violet',
    colors: ['#1A0B2E', '#4B1248', '#8B008B', '#FF77AA'],
    distortion: 65,
    swirl: 20,
    scale: 50,
    speed: 32,
  },
  {
    id: 'flow-10',
    name: 'Oceanic Drift',
    colors: ['#E0F7FA', '#4DD0E1', '#007791', '#071E26'],
    distortion: 56,
    swirl: 14,
    scale: 48,
    speed: 28,
  },
  {
    id: 'flow-11',
    name: 'Amber Ember',
    colors: ['#260805', '#D35400', '#F39C12', '#F1C40F'],
    distortion: 64,
    swirl: 18,
    scale: 52,
    speed: 30,
  },
  {
    id: 'flow-12',
    name: 'Himalayan Salt',
    colors: ['#FCF8F5', '#F8C8B8', '#D47368', '#5E3A4D'],
    distortion: 52,
    swirl: 12,
    scale: 46,
    speed: 25,
  },
];

export const getRandomFlowColors = (): string[] => {
  const preset = FLOW_PRESETS[Math.floor(Math.random() * FLOW_PRESETS.length)];
  return [...preset.colors];
};
