import React, { useEffect, useRef, useState } from 'react';
import { useStudioEditorStore } from '../store/useStudioStore';
import * as PhosphorIcons from '@phosphor-icons/react';
import { IntersectSquare, Brush03, Type01, Bookmark } from '@untitledui/icons';
import { SocialIcon } from './SocialIcons';
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

type RightSection =
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

export interface RightSidebarProps {
  mobileSection?: RightSection;
  desktopCollapsed?: boolean;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  mobileSection,
  desktopCollapsed = false,
}) => {
  const state = useStudioEditorStore();
  const onChange = state.updateState;
  const [activeDesktopSection, setActiveDesktopSection] = useState<RightSection | null>(null);
  const previousSelectionRef = useRef({
    text: state.selectedTextLayerId,
    element: state.selectedElementId,
    shape: state.selectedShapeId,
  });

  useEffect(() => {
    if (!desktopCollapsed) setActiveDesktopSection(null);
  }, [desktopCollapsed]);

  useEffect(() => {
    const previous = previousSelectionRef.current;
    const next = {
      text: state.selectedTextLayerId,
      element: state.selectedElementId,
      shape: state.selectedShapeId,
    };

    if (desktopCollapsed) {
      const selectedText = Boolean(next.text && next.text !== previous.text);
      const selectedElement = Boolean(next.element && next.element !== previous.element);
      const selectedShape = Boolean(next.shape && next.shape !== previous.shape);

      if (selectedText) {
        setActiveDesktopSection('text');
      } else if (selectedElement || selectedShape) {
        setActiveDesktopSection('elements');
      }
    }

    previousSelectionRef.current = next;
  }, [desktopCollapsed, state.selectedElementId, state.selectedShapeId, state.selectedTextLayerId]);

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

  const sections: Array<{
    id: RightSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'quick', label: 'Quick Mode', icon: PhosphorIcons.LightningIcon },
    { id: 'perspective', label: 'Perspective', icon: IntersectSquare },
    { id: 'background', label: 'Background', icon: Brush03 },
    {
      id: 'social',
      label: 'Social',
      icon: (props) => <SocialIcon platform="instagram" size={20} {...props} />,
    },
    { id: 'techstack', label: 'Tech Stack', icon: PhosphorIcons.AtomIcon },
    { id: 'icons', label: 'Icons', icon: PhosphorIcons.SparkleIcon },
    { id: 'text', label: 'Text', icon: Type01 },
    { id: 'elements', label: 'Elements', icon: PhosphorIcons.CursorClickIcon },
    { id: 'layers', label: 'Layers', icon: PhosphorIcons.StackIcon },
    { id: 'watermark', label: 'Watermark', icon: Bookmark },
  ];

  const renderSection = (section: RightSection) => {
    if (section === 'quick') return <QuickModeSection />;
    if (section === 'perspective') return <PerspectiveSection />;
    if (section === 'social') return <SocialSection />;
    if (section === 'techstack') return <TechStackSection />;
    if (section === 'icons') return <PhosphorIconsSection />;
    if (section === 'text') return <TextSection />;
    if (section === 'elements') return <ElementsSection />;
    if (section === 'layers') return <LayersSection />;
    if (section === 'watermark') return <WatermarkSection />;
    return <BackgroundSection />;
  };

  if (desktopCollapsed) {
    const activeMeta = sections.find((section) => section.id === activeDesktopSection);
    return (
      <div className="relative z-40 flex h-full w-full flex-col items-center border-l border-neutral-800 bg-neutral-900 py-3 text-slate-200">
        <div className="flex min-h-0 flex-1 flex-col items-center gap-1.5 overflow-y-auto px-2 pt-12 no-scrollbar">
          {sections.map((section) => {
            const Icon = section.icon;
            const active = section.id === activeDesktopSection;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveDesktopSection(active ? null : section.id)}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all cursor-pointer ${active ? 'border-pastel-pink bg-pastel-pink/15 text-pastel-pink' : 'border-transparent text-slate-400 hover:border-neutral-700 hover:bg-neutral-800 hover:text-white'}`}
                title={section.label}
                aria-label={section.label}
              >
                <Icon className="h-5 w-5" />
              </button>
            );
          })}
        </div>
        {activeDesktopSection && activeMeta && (
          <div className="absolute right-full top-0 z-50 flex h-full w-80 flex-col border-l border-neutral-700 bg-neutral-900/98 shadow-2xl backdrop-blur-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-neutral-800 px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-wider text-pastel-pink">
                {activeMeta.label}
              </span>
              <button
                type="button"
                onClick={() => setActiveDesktopSection(null)}
                className="rounded-lg bg-neutral-800 p-1.5 text-slate-400 hover:text-white cursor-pointer"
                aria-label="Close section"
              >
                <PhosphorIcons.XIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
              {renderSection(activeDesktopSection)}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full bg-neutral-900 border-l border-neutral-800 flex flex-col h-full overflow-y-auto p-4 space-y-4 text-slate-200 shrink-0">
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
