import React, { useEffect, useState } from 'react';
import { useStudioEditorStore } from '../store/useStudioStore';
import { Image01, Monitor05, Cube01, ChartBreakoutSquare, Copy07 } from '@untitledui/icons';
import * as PhosphorIcons from '@phosphor-icons/react';
import {
  ImageUploadSection,
  AspectSection,
  FrameSection,
  StyleSection,
  ShineSection,
  ShadowSection,
  ShadowOverlaySection,
} from './left-sidebar';

interface LeftSidebarProps {
  onImageUpload: (file: File) => void;
  mobileSection?: 'image' | 'aspect' | 'frame' | 'style' | 'shadow';
  desktopCollapsed?: boolean;
}

type LeftSection = NonNullable<LeftSidebarProps['mobileSection']>;

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  onImageUpload,
  mobileSection,
  desktopCollapsed = false,
}) => {
  const state = useStudioEditorStore();
  const [activeDesktopSection, setActiveDesktopSection] = useState<LeftSection | null>(null);

  useEffect(() => {
    if (!desktopCollapsed) setActiveDesktopSection(null);
  }, [desktopCollapsed]);

  const isDeviceFrame = [
    'iphone',
    'iphone14pro',
    'iphone16',
    'iphone16-floating',
    'iphone17-dual-side',
    'macbook',
    'macbookair13',
    'samsung-s21',
    'tablet',
  ].includes(state.frameType);

  if (mobileSection) {
    if (mobileSection === 'image') return <ImageUploadSection onImageUpload={onImageUpload} />;
    if (mobileSection === 'aspect') return <AspectSection />;
    if (mobileSection === 'frame') return <FrameSection />;
    if (mobileSection === 'style') {
      return (
        <>
          {state.frameType === 'frameless' && <StyleSection />}
          <ShineSection />
        </>
      );
    }
    if (mobileSection === 'shadow') {
      return (
        <>
          {!isDeviceFrame && <ShadowSection />}
          <ShadowOverlaySection />
        </>
      );
    }
    return null;
  }

  const sections: Array<{
    id: LeftSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'image', label: 'Image & Layout', icon: Image01 },
    { id: 'aspect', label: 'Aspect Ratio', icon: Monitor05 },
    { id: 'frame', label: 'Frame Mockups', icon: Cube01 },
    ...(state.frameType === 'frameless'
      ? [{ id: 'style' as LeftSection, label: 'Style', icon: ChartBreakoutSquare }]
      : []),
    { id: 'shadow', label: 'Shadow', icon: Copy07 },
  ];

  const renderSection = (section: LeftSection) => {
    if (section === 'image') return <ImageUploadSection onImageUpload={onImageUpload} />;
    if (section === 'aspect') return <AspectSection alwaysExpanded={desktopCollapsed} />;
    if (section === 'frame') return <FrameSection alwaysExpanded={desktopCollapsed} />;
    if (section === 'style')
      return (
        <>
          <StyleSection />
          <ShineSection />
        </>
      );
    return (
      <>
        {!isDeviceFrame && <ShadowSection />}
        <ShadowOverlaySection />
      </>
    );
  };

  if (desktopCollapsed) {
    const activeMeta = sections.find((section) => section.id === activeDesktopSection);
    return (
      <div className="relative z-40 flex h-full w-full flex-col items-center border-r border-neutral-800 bg-neutral-900 py-3 text-slate-200">
        <div className="flex min-h-0 flex-1 flex-col items-center gap-1.5 overflow-y-auto px-2 pt-12 no-scrollbar">
          {sections.map((section) => {
            const Icon = section.icon;
            const active = section.id === activeDesktopSection;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveDesktopSection(active ? null : section.id)}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all cursor-pointer ${active ? 'border-pastel-blue bg-pastel-blue/15 text-pastel-blue' : 'border-transparent text-slate-400 hover:border-neutral-700 hover:bg-neutral-800 hover:text-white'}`}
                title={section.label}
                aria-label={section.label}
              >
                <Icon className="h-5 w-5" />
              </button>
            );
          })}
        </div>
        {activeDesktopSection && activeMeta && (
          <div className="absolute left-full top-0 z-50 flex h-full w-80 flex-col border-r border-neutral-700 bg-neutral-900/98 shadow-2xl backdrop-blur-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-neutral-800 px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-wider text-pastel-blue">
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
    <div className="w-full bg-neutral-900 border-r border-neutral-800 flex flex-col h-full overflow-y-auto p-4 space-y-4 text-slate-200 shrink-0">
      <ImageUploadSection onImageUpload={onImageUpload} />
      <AspectSection />
      <FrameSection />
      {state.frameType === 'frameless' && <StyleSection />}
      <ShineSection />
      {!isDeviceFrame && <ShadowSection />}
      <ShadowOverlaySection />
    </div>
  );
};
