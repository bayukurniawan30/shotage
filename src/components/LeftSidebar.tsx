import React from 'react';
import { useStudioStore } from '../store/useStudioStore';
import {
  ImageUploadSection,
  AspectSection,
  FrameSection,
  StyleSection,
  ShadowSection,
  ShadowOverlaySection,
} from './left-sidebar';

interface LeftSidebarProps {
  onImageUpload: (file: File) => void;
  mobileSection?: 'image' | 'aspect' | 'frame' | 'style' | 'shadow';
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ onImageUpload, mobileSection }) => {
  const state = useStudioStore();

  const isDeviceFrame = [
    'iphone',
    'iphone14pro',
    'iphone16',
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
    if (mobileSection === 'style') return <StyleSection />;
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

  return (
    <div className="w-80 bg-neutral-900 border-r border-neutral-800 flex flex-col h-full overflow-y-auto p-4 space-y-4 text-slate-200 shrink-0">
      <ImageUploadSection onImageUpload={onImageUpload} />
      <AspectSection />
      <FrameSection />
      {state.frameType === 'frameless' && <StyleSection />}
      {!isDeviceFrame && <ShadowSection />}
      <ShadowOverlaySection />
    </div>
  );
};
