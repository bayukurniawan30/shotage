import React, { useRef, useEffect } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { CanvasStage } from '../components/CanvasStage';
import { LeftSidebar } from '../components/LeftSidebar';
import { RightSidebar } from '../components/RightSidebar';

export const Studio: React.FC = () => {
  const setImage = useStudioStore((state) => state.setImage);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImage(e.target.result as string, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  // Clipboard Paste Support (Cmd+V / Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) handleImageUpload(blob);
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Studio Top Navigation Bar */}
      <header className="h-14 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-40">
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-cyan-400 flex items-center justify-center font-bold text-white shadow-md text-xs group-hover:scale-105 transition-transform">
              S
            </div>
            <span className="font-bold text-base tracking-tight text-slate-200 group-hover:text-white transition-colors">
              Shotage Studio
            </span>
          </a>
        </div>

        <div className="flex items-center gap-3">
          <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 rounded-lg cursor-pointer transition-all flex items-center gap-1.5">
            <svg
              className="w-3.5 h-3.5 text-brand-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Upload Screenshot
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
            />
          </label>

          <a
            href="/"
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors px-2 py-1"
          >
            Back to Home
          </a>
        </div>
      </header>

      {/* 3-Column Studio Workspace: Left (Image/Frame) | Center (Canvas Content) | Right (Tilt/Background/Export) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Image Upload, Zoom, Padding, Aspect Ratios, Frame Selection */}
        <LeftSidebar onImageUpload={handleImageUpload} />

        {/* Center Stage: Interactive Canvas Workspace */}
        <div className="flex-1 bg-slate-950 relative overflow-hidden flex items-center justify-center">
          <CanvasStage canvasRef={canvasRef} />
        </div>

        {/* Right Sidebar: 3D Pitch/Yaw Tilt, Background Controls & PNG/JPEG/WEBP Export */}
        <RightSidebar canvasRef={canvasRef} />
      </div>
    </div>
  );
};

export default Studio;
