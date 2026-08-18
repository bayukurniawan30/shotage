export interface ShadeshifterPreset {
  id: string;
  name: string;
  bgColor: string;
  colors: [string, string, string, string, string]; // [primary, secondary, accent, highlight, ambient]
  blur?: number; // optional custom blur (default 40px)
}

export const SHADESHIFTER_PRESETS: ShadeshifterPreset[] = [
  {
    id: 'shadeshifter-1',
    name: 'Cyber Velvet',
    bgColor: '#06060f',
    colors: ['#7928ca', '#0070f3', '#ff0080', '#00dfd8', '#f5a623'],
  },
  {
    id: 'shadeshifter-2',
    name: 'Solar Flare',
    bgColor: '#0f0505',
    colors: ['#ff4b1f', '#ff9068', '#fbc531', '#eb2f06', '#c23616'],
  },
  {
    id: 'shadeshifter-3',
    name: 'Aurora Borealis',
    bgColor: '#030c14',
    colors: ['#00b894', '#0984e3', '#6c5ce7', '#55efc4', '#00cec9'],
  },
  {
    id: 'shadeshifter-4',
    name: 'Hyperpop Mirage',
    bgColor: '#0f0412',
    colors: ['#e84393', '#8e44ad', '#00cec9', '#fd79a8', '#fdcb6e'],
  },
  {
    id: 'shadeshifter-5',
    name: 'Ocean Abyss',
    bgColor: '#03071e',
    colors: ['#1e3799', '#38ada9', '#4a69bd', '#82ccdd', '#0c2461'],
  },
  {
    id: 'shadeshifter-6',
    name: 'Acid Neon',
    bgColor: '#060a04',
    colors: ['#78e08f', '#6ab04c', '#badc58', '#38ada9', '#1e272e'],
  },
  {
    id: 'shadeshifter-7',
    name: 'Sunset Boulevard',
    bgColor: '#0e0514',
    colors: ['#e056fd', '#ff7979', '#f0932b', '#686de0', '#30336b'],
  },
  {
    id: 'shadeshifter-8',
    name: 'Monochrome Noir',
    bgColor: '#090a0f',
    colors: ['#718093', '#dcdde1', '#2f3640', '#f5f6fa', '#192a56'],
  },
  {
    id: 'shadeshifter-9',
    name: 'Prism Spectral',
    bgColor: '#080811',
    colors: ['#e84118', '#00a8ff', '#9c88ff', '#4cd137', '#fbc531'],
  },
  {
    id: 'shadeshifter-10',
    name: 'Volcanic Ember',
    bgColor: '#0d0402',
    colors: ['#eb2f06', '#fa983a', '#f6b93b', '#b71540', '#1e272e'],
  },
  {
    id: 'shadeshifter-11',
    name: 'Lagoon Mist',
    bgColor: '#020d11',
    colors: ['#00d2d3', '#1dd1a1', '#48dbfb', '#01a3a4', '#10ac84'],
  },
  {
    id: 'shadeshifter-12',
    name: 'Mystic Amethyst',
    bgColor: '#0a0314',
    colors: ['#a55eea', '#fd79a8', '#6c5ce7', '#e056fd', '#4b4b4b'],
  },
  {
    id: 'shadeshifter-13',
    name: 'Cosmic Nebula',
    bgColor: '#06030c',
    colors: ['#ff007f', '#00e5ff', '#7b2cbf', '#9d4edd', '#ffffff'],
  },
  {
    id: 'shadeshifter-14',
    name: 'Golden Hour',
    bgColor: '#0f0803',
    colors: ['#e67e22', '#d35400', '#f39c12', '#f1c40f', '#2c3e50'],
  },
  {
    id: 'shadeshifter-15',
    name: 'Cyberpunk Horizon',
    bgColor: '#090412',
    colors: ['#ffd32a', '#05c46b', '#ff3f34', '#575fcf', '#0fbcf9'],
  },
  {
    id: 'shadeshifter-16',
    name: 'Deep Forest',
    bgColor: '#020b06',
    colors: ['#009432', '#A3CB38', '#C4E538', '#1289A7', '#006266'],
  },
];
