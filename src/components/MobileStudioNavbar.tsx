import React, { useState } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import {
  Image01,
  Monitor05,
  Cube01,
  ChartBreakoutSquare,
  Copy07,
  IntersectSquare,
  Brush03,
  Bookmark,
  XClose,
} from '@untitledui/icons';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';

interface MobileStudioNavbarProps {
  onImageUpload: (file: File) => void;
}

export type MobileTab =
  'image' | 'aspect' | 'frame' | 'style' | 'shadow' | 'perspective' | 'watermark' | 'background';

export const MobileStudioNavbar: React.FC<MobileStudioNavbarProps> = ({ onImageUpload }) => {
  const [activeTab, setActiveTab] = useState<MobileTab | null>(null);
  const frameType = useStudioStore((state) => state.frameType);

  const tabs: { id: MobileTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'image', label: 'Image & Layout', icon: Image01 },
    { id: 'aspect', label: 'Aspect Ratio', icon: Monitor05 },
    { id: 'frame', label: 'Frame Mockups', icon: Cube01 },
    ...(frameType === 'frameless'
      ? [{ id: 'style' as MobileTab, label: 'Style', icon: ChartBreakoutSquare }]
      : []),
    { id: 'shadow', label: 'Shadow', icon: Copy07 },
    { id: 'perspective', label: '3D & Canvas', icon: IntersectSquare },
    { id: 'watermark', label: 'Watermark', icon: Bookmark },
    { id: 'background', label: 'Background', icon: Brush03 },
  ];

  return (
    <div className="md:hidden flex flex-col w-full bg-neutral-900 border-t border-neutral-800 shrink-0 z-30">
      {/* Bottom Horizontal Scrollable Icon Navbar */}
      <div className="flex items-center gap-1 p-2 overflow-x-auto no-scrollbar scroll-smooth">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(isSelected ? null : tab.id)}
              className={`flex flex-col items-center justify-center min-w-[72px] px-2 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-[#a2d2ff]/20 border-[#a2d2ff] text-[#a2d2ff] font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium text-center truncate max-w-[68px]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Expandable Mobile Panel Drawer */}
      {activeTab && (
        <div className="fixed inset-x-0 bottom-[68px] z-40 bg-neutral-900/95 border-t border-neutral-800 backdrop-blur-xl p-4 max-h-[45vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-neutral-800">
            <span className="text-xs font-bold uppercase tracking-wider text-pastel-pink">
              {tabs.find((t) => t.id === activeTab)?.label}
            </span>
            <button
              onClick={() => setActiveTab(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white bg-neutral-800"
            >
              <XClose className="w-4 h-4" />
            </button>
          </div>

          {/* Panel Content per selected section */}
          <div className="mobile-drawer-content">
            {activeTab === 'image' && (
              <LeftSidebar onImageUpload={onImageUpload} mobileSection="image" />
            )}
            {activeTab === 'aspect' && (
              <LeftSidebar onImageUpload={onImageUpload} mobileSection="aspect" />
            )}
            {activeTab === 'frame' && (
              <LeftSidebar onImageUpload={onImageUpload} mobileSection="frame" />
            )}
            {activeTab === 'style' && (
              <LeftSidebar onImageUpload={onImageUpload} mobileSection="style" />
            )}
            {activeTab === 'shadow' && (
              <LeftSidebar onImageUpload={onImageUpload} mobileSection="shadow" />
            )}
            {activeTab === 'perspective' && <RightSidebar mobileSection="perspective" />}
            {activeTab === 'watermark' && <RightSidebar mobileSection="watermark" />}
            {activeTab === 'background' && <RightSidebar mobileSection="background" />}
          </div>
        </div>
      )}
    </div>
  );
};
