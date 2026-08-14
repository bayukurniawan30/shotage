import React, { useState, useEffect } from 'react';

interface Project {
  name: string;
  tagline: string;
  url: string;
  favicon: string;
  card: string;
  accent: string;
}

const PROJECTS: Project[] = [
  {
    name: 'Morphic CMS',
    tagline: 'Modern, Edge-Ready Headless CMS',
    url: 'https://morphic-cms.com/?ref=shotage.studio',
    favicon: 'https://morphic-cms.com/favicon.png',
    card: 'https://morphic-cms.com/twitter_card.png',
    accent: 'from-violet-500 to-indigo-500',
  },
  {
    name: 'Heylookat.me',
    tagline: 'Digital Card for Your Identity',
    url: 'https://www.heylookat.me/?ref=shotage.studio',
    favicon: 'https://www.heylookat.me/favicon.png',
    card: 'https://www.heylookat.me/twitter_card.webp',
    accent: 'from-rose-500 to-amber-500',
  },
];

interface ProjectSpotlightProps {
  onClose: () => void;
}

export const ProjectSpotlight: React.FC<ProjectSpotlightProps> = ({ onClose }) => {
  const [project] = useState(() => PROJECTS[Math.floor(Math.random() * PROJECTS.length)]);
  const [cardFailed, setCardFailed] = useState(false);
  const [faviconFailed, setFaviconFailed] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(5);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {!cardFailed && (
          <div className={`w-full aspect-video bg-gradient-to-br ${project.accent} overflow-hidden`}>
            <img
              src={project.card}
              alt=""
              onError={() => setCardFailed(true)}
              className="h-full w-full object-contain scale-[1.06]"
            />
          </div>
        )}

        <div className="p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
            A project you might like
          </p>
          <div className="flex items-center gap-3.5 mb-4">
            {!faviconFailed && (
              <img
                src={project.favicon}
                alt=""
                onError={() => setFaviconFailed(true)}
                className="w-11 h-11 rounded-xl object-contain border border-slate-700/60 bg-slate-800 p-1.5 shrink-0"
              />
            )}
            <div className="min-w-0">
              <h2 className="text-xl font-extrabold text-white leading-tight">{project.name}</h2>
              <p className="text-sm text-slate-400 mt-0.5">{project.tagline}</p>
            </div>
          </div>

          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full py-3 rounded-xl bg-gradient-to-r ${project.accent} text-white font-extrabold text-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer mb-2.5`}
          >
            <span>Visit {project.name}</span>
            <ArrowIcon />
          </a>

          <button
            type="button"
            onClick={onClose}
            disabled={secondsLeft > 0}
            className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-sm transition-all active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
          >
            {secondsLeft > 0
              ? `Close & view the studio in ${secondsLeft}s...`
              : 'Close & view the studio →'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ArrowIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H8M17 7v9" />
  </svg>
);