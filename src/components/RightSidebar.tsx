import React from 'react';
import { useStudioStore } from '../store/useStudioStore';
import * as PhosphorIcons from '@phosphor-icons/react';
import { QuickModeSection } from './QuickModeSection';
import {
  PerspectiveSection,
  BackgroundSection,
  SocialSection,
  TechStackSection,
  PhosphorIconsSection,
  TextSection,
  ElementsSection,
  LayersSection,
  WatermarkSection,
  GOOGLE_FONTS,
} from './right-sidebar';

export { GOOGLE_FONTS };

export interface RightSidebarProps {
  mobileSection?:
    | 'quick'
    | 'perspective'
    | 'watermark'
    | 'background'
    | 'text'
    | 'social'
    | 'techstack'
    | 'icons'
    | 'elements'
    | 'layers';
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ mobileSection }) => {
  const state = useStudioStore();
  const onChange = state.updateState;

  if (mobileSection) {
    if (mobileSection === 'quick') return <QuickModeSection />;
    if (mobileSection === 'perspective') return <PerspectiveSection />;
    if (mobileSection === 'social') return <SocialSection />;
    if (mobileSection === 'techstack') return <TechStackSection />;
    if (mobileSection === 'icons') return <PhosphorIconsSection />;
    if (mobileSection === 'text') return <TextSection />;
    if (mobileSection === 'elements') return <ElementsSection />;
    if (mobileSection === 'layers') return <LayersSection />;
    if (mobileSection === 'watermark') return <WatermarkSection />;
    if (mobileSection === 'background') return <BackgroundSection />;
    return null;
  }

  const sidebarMode = state.sidebarMode || 'quick';

  return (
    <div className="w-80 bg-neutral-900 border-l border-neutral-800 flex flex-col h-full overflow-y-auto p-4 space-y-4 text-slate-200 shrink-0">
      {/* Quick vs Advanced Mode Switcher */}
      <div className="grid grid-cols-2 gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 shrink-0">
        <button
          type="button"
          onClick={() => onChange({ sidebarMode: 'quick' })}
          className={`py-1.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            sidebarMode === 'quick'
              ? 'bg-pastel-pink text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-neutral-900'
          }`}
        >
          <PhosphorIcons.LightningIcon
            weight={sidebarMode === 'quick' ? 'fill' : 'bold'}
            className="w-3.5 h-3.5"
          />
          <span>Quick Mode</span>
        </button>
        <button
          type="button"
          onClick={() => onChange({ sidebarMode: 'advanced' })}
          className={`py-1.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            sidebarMode === 'advanced'
              ? 'bg-pastel-pink text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-neutral-900'
          }`}
        >
          <PhosphorIcons.SlidersHorizontalIcon
            weight={sidebarMode === 'advanced' ? 'fill' : 'bold'}
            className="w-3.5 h-3.5"
          />
          <span>Advanced</span>
        </button>
      </div>

      {/* Mode Content */}
      {sidebarMode === 'quick' ? (
        <QuickModeSection />
      ) : (
        <>
          <PerspectiveSection />
          <BackgroundSection />
          <SocialSection />
          <TechStackSection />
          <PhosphorIconsSection />
          <TextSection />
          <ElementsSection />
          <LayersSection />
          <WatermarkSection />
        </>
      )}
    </div>
  );
};
