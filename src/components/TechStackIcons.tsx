import React from 'react';

export type TechStackId =
  | 'angular'
  | 'bootstrap'
  | 'cakephp'
  | 'codeigniter'
  | 'css3'
  | 'figma'
  | 'firebase'
  | 'flutter'
  | 'go'
  | 'html5'
  | 'java'
  | 'javascript'
  | 'laravel'
  | 'mongodb'
  | 'mysql'
  | 'nextjs'
  | 'nodejs'
  | 'nuxtjs'
  | 'php'
  | 'postgresql'
  | 'python'
  | 'react'
  | 'redis'
  | 'ruby'
  | 'sketch'
  | 'sqlite'
  | 'svelte'
  | 'tailwindcss'
  | 'typescript'
  | 'vercel'
  | 'vite'
  | 'vue';

export interface TechStackIconProps {
  id: TechStackId;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export const TECH_STACK_MAP: Record<TechStackId, { label: string; file: string }> = {
  react: { label: 'React', file: 'React.png' },
  nextjs: { label: 'Next.js', file: 'Next.js.png' },
  typescript: { label: 'TypeScript', file: 'TypeScript.png' },
  tailwindcss: { label: 'Tailwind CSS', file: 'Tailwind CSS.png' },
  javascript: { label: 'JavaScript', file: 'JavaScript.png' },
  vue: { label: 'Vue.js', file: 'Vue.js.png' },
  svelte: { label: 'Svelte', file: 'Svelte.png' },
  angular: { label: 'Angular', file: 'Angular.png' },
  nodejs: { label: 'Node.js', file: 'Node.js.png' },
  html5: { label: 'HTML5', file: 'HTML5.png' },
  css3: { label: 'CSS3', file: 'CSS3.png' },
  nuxtjs: { label: 'Nuxt.js', file: 'Nuxt JS.png' },
  vite: { label: 'Vite', file: 'Vite.js.png' },
  vercel: { label: 'Vercel', file: 'Vercel.png' },
  python: { label: 'Python', file: 'Python.png' },
  go: { label: 'Go', file: 'Go.png' },
  java: { label: 'Java', file: 'Java.png' },
  flutter: { label: 'Flutter', file: 'Flutter.png' },
  php: { label: 'PHP', file: 'PHP.png' },
  laravel: { label: 'Laravel', file: 'Laravel.png' },
  codeigniter: { label: 'CodeIgniter', file: 'CodeIgniter.png' },
  cakephp: { label: 'CakePHP', file: 'CakePHP.png' },
  ruby: { label: 'Ruby', file: 'Ruby.png' },
  firebase: { label: 'Firebase', file: 'Firebase.png' },
  postgresql: { label: 'PostgreSQL', file: 'PostgresSQL.png' },
  mysql: { label: 'MySQL', file: 'MySQL.png' },
  mongodb: { label: 'MongoDB', file: 'MongoDB.png' },
  sqlite: { label: 'SQLite', file: 'SQLite.png' },
  redis: { label: 'Redis', file: 'Redis.png' },
  figma: { label: 'Figma', file: 'Figma.png' },
  sketch: { label: 'Sketch', file: 'Sketch.png' },
  bootstrap: { label: 'Bootstrap', file: 'Bootstrap.png' },
};

export const TECH_STACK_ITEMS: { id: TechStackId; label: string }[] = Object.entries(
  TECH_STACK_MAP
).map(([id, item]) => ({
  id: id as TechStackId,
  label: item.label,
}));

export const TechStackIcon: React.FC<TechStackIconProps> = ({
  id,
  size = 24,
  className = '',
  style,
}) => {
  const item = TECH_STACK_MAP[id];
  if (!item) return null;

  const width = typeof size === 'number' ? `${size}px` : size;
  const height = typeof size === 'number' ? `${size}px` : size;

  return (
    <img
      src={`/techstack/${item.file}`}
      alt={item.label}
      title={item.label}
      className={`object-contain shrink-0 ${className}`}
      style={{
        width,
        height,
        ...style,
      }}
    />
  );
};
