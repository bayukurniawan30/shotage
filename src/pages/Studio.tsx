import React, { useRef, useEffect, useState } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { CanvasStage } from '../components/CanvasStage';
import { LeftSidebar } from '../components/LeftSidebar';
import { RightSidebar } from '../components/RightSidebar';
import { ExportModal } from '../components/ExportModal';
import {
  FlipBackward,
  FlipForward,
  RefreshCcw01,
  Expand03,
  MessageTextSquare01,
  Download01,
  UploadCloud01,
} from '@untitledui/icons';

export const Studio: React.FC = () => {
  const setImage = useStudioStore((state) => state.setImage);
  const resetAll = useStudioStore((state) => state.resetAll);
  const isPreviewMode = useStudioStore((state) => state.isPreviewMode);
  const togglePreviewMode = useStudioStore((state) => state.togglePreviewMode);
  const previewCanvasZoom = useStudioStore((state) => state.previewCanvasZoom);
  const updateState = useStudioStore((state) => state.updateState);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isStartOverModalOpen, setIsStartOverModalOpen] = useState(false);

  const confirmStartOver = () => {
    resetAll();
    temporalStore.getState().clear();
    setIsStartOverModalOpen(false);
  };

  // Access temporal store for undo / redo
  const temporalStore = useStudioStore.temporal;
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    const unsubscribe = temporalStore.subscribe((state) => {
      setCanUndo(state.pastStates.length > 0);
      setCanRedo(state.futureStates.length > 0);
    });
    return () => unsubscribe();
  }, [temporalStore]);

  const canvasRef = useRef<HTMLDivElement>(null);

  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragCounter = useRef(0);

  const isValidImage = (file: File) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (validTypes.includes(file.type.toLowerCase())) return true;
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext || '');
  };

  const handleImageUpload = (file: File) => {
    if (!isValidImage(file)) {
      alert('Please upload a valid image file (.png, .jpg, .jpeg, .webp, .svg)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImage(e.target.result as string, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag and Drop Fullscreen Handler
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current += 1;
      if (e.dataTransfer?.types && Array.from(e.dataTransfer.types).includes('Files')) {
        setIsDraggingFile(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current -= 1;
      if (dragCounter.current === 0) {
        setIsDraggingFile(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingFile(false);
      dragCounter.current = 0;

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const droppedFile = e.dataTransfer.files[0];
        handleImageUpload(droppedFile);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

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

  // BeforeUnload handler to prompt user before closing tab or refreshing page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue =
        'Are you sure you want to leave? Your unsaved work in Shotage Studio will be lost.';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Handle Brand / Home navigation with confirmation prompt
  const handleNavHome = (e: React.MouseEvent) => {
    e.preventDefault();
    if (
      window.confirm(
        'Are you sure you want to leave Shotage Studio? Any unsaved edits will be lost.'
      )
    ) {
      window.location.href = '/';
    }
  };

  return (
    <div className="h-screen w-screen bg-neutral-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Studio Header Bar */}
      <header className="h-14 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-40 relative">
        {/* Left Section: Brand Logo */}
        <div className="flex items-center gap-4">
          <a href="/" onClick={handleNavHome} className="flex items-center gap-2.5 group">
            <img
              src="/shotage-logo-small.png"
              alt="Shotage Logo"
              className="h-7 w-auto object-contain group-hover:scale-105 transition-transform"
            />
            <span className="font-bold text-base tracking-tight text-slate-200 group-hover:text-pastel-pinkLight transition-colors">
              Shotage
            </span>
          </a>
        </div>

        {/* Center Section: Toolbar (Undo -> Redo -> Start Over -> Preview -> Feedback) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-neutral-950/90 p-1 rounded-xl border border-neutral-800 shadow-inner">
          {/* 1. Undo Button */}
          <button
            onClick={() => temporalStore.getState().undo()}
            disabled={!canUndo}
            className={`p-1.5 rounded-lg border transition-all ${
              canUndo
                ? 'bg-neutral-800 hover:bg-neutral-700 text-slate-200 border-neutral-700 cursor-pointer'
                : 'bg-neutral-950/50 text-slate-600 border-neutral-800/50 cursor-not-allowed'
            }`}
            title={canUndo ? 'Undo (Cmd+Z)' : 'Nothing to undo'}
          >
            <FlipBackward className="w-4 h-4" />
          </button>

          {/* 2. Redo Button */}
          <button
            onClick={() => temporalStore.getState().redo()}
            disabled={!canRedo}
            className={`p-1.5 rounded-lg border transition-all ${
              canRedo
                ? 'bg-neutral-800 hover:bg-neutral-700 text-slate-200 border-neutral-700 cursor-pointer'
                : 'bg-neutral-950/50 text-slate-600 border-neutral-800/50 cursor-not-allowed'
            }`}
            title={canRedo ? 'Redo (Cmd+Shift+Z)' : 'Nothing to redo'}
          >
            <FlipForward className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-neutral-800 my-auto mx-0.5"></div>

          {/* 3. Start Over Button */}
          <button
            onClick={() => setIsStartOverModalOpen(true)}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-slate-200 hover:text-white rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
            title="Reset canvas and settings to initial state"
          >
            <RefreshCcw01 className="w-3.5 h-3.5 text-[#cdb4db]" />
            Start Over
          </button>

          <div className="h-4 w-px bg-neutral-800 my-auto mx-0.5"></div>

          {/* 4. Preview Toggle Button (Expand03 icon) */}
          <button
            onClick={togglePreviewMode}
            className={`p-1.5 rounded-lg border transition-all ${
              isPreviewMode
                ? 'bg-pastel-pink text-slate-950 border-pastel-pinkLight font-bold shadow-md shadow-pastel-pink/25'
                : 'bg-neutral-800 hover:bg-neutral-700 text-slate-300 border-neutral-700'
            }`}
            title={isPreviewMode ? 'Exit Full Preview' : 'Full Preview Mode (Expand Canvas)'}
          >
            <Expand03 className="w-4 h-4" />
          </button>

          {/* 5. Feedback Button (message-text-square-01 icon) */}
          <button
            onClick={() => alert('Feedback feature coming soon!')}
            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-slate-300 hover:text-white rounded-lg border border-neutral-700 transition-all"
            title="Feedback (Coming Soon)"
          >
            <MessageTextSquare01 className="w-4 h-4" />
          </button>
        </div>

        {/* Right Section: Special Eye-Catching Export Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-4 py-1.5 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-[#ffafcc]/25 transition-all flex items-center gap-1.5 cursor-pointer hover:brightness-110 active:scale-[0.98]"
            style={{
              backgroundImage: 'linear-gradient(135deg, #cdb4db, #ffafcc, #a2d2ff)',
            }}
          >
            <Download01 className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </header>

      {/* 3-Column Studio Workspace */}
      <div className="flex-1 flex h-[calc(100vh-3.5rem)] min-h-0 overflow-hidden relative">
        {/* Left Sidebar (Hidden in Preview Mode) */}
        {!isPreviewMode && <LeftSidebar onImageUpload={handleImageUpload} />}

        {/* Center Stage: Interactive Canvas Workspace */}
        <div className="flex-1 bg-neutral-950 relative overflow-hidden flex items-center justify-center">
          <CanvasStage canvasRef={canvasRef} onImageUpload={handleImageUpload} />

          {/* Floating Bottom Zoom Slider in Full Preview Mode */}
          {isPreviewMode && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-neutral-900/90 border border-neutral-800 backdrop-blur-md px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
              <span className="text-xs font-semibold text-slate-300">Canvas Zoom</span>
              <input
                type="range"
                min="50"
                max="150"
                value={previewCanvasZoom}
                onChange={(e) => updateState({ previewCanvasZoom: Number(e.target.value) })}
                className="w-36 bg-neutral-800 rounded-lg cursor-pointer"
              />
              <span className="text-xs font-mono text-slate-400 w-9">{previewCanvasZoom}%</span>
            </div>
          )}
        </div>

        {/* Right Sidebar (Hidden in Preview Mode) */}
        {!isPreviewMode && <RightSidebar />}
      </div>

      {/* Fullscreen Drag & Drop Overlay */}
      {isDraggingFile && (
        <div className="fixed inset-0 z-50 p-6 bg-slate-950/80 backdrop-blur-md flex items-center justify-center transition-all animate-in fade-in duration-200">
          <div className="w-full h-full border-4 border-dashed border-brand-500 bg-slate-900/60 rounded-3xl flex flex-col items-center justify-center p-8 shadow-2xl shadow-brand-500/20">
            <div className="w-20 h-20 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center mb-6 shadow-2xl shadow-brand-500/30 animate-bounce">
              <UploadCloud01 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-100 mb-2">Drop your screenshot here</h2>
            <p className="text-sm text-slate-400 font-mono">
              Supported formats: .png, .jpg, .jpeg, .webp, .svg
            </p>
          </div>
        </div>
      )}

      {/* Start Over Confirmation Modal */}
      {isStartOverModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-950 font-bold shrink-0 shadow-md"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #cdb4db, #ffafcc, #a2d2ff)',
                }}
              >
                <RefreshCcw01 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Start Over?</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Reset canvas and clear edit history to initial state.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setIsStartOverModalOpen(false)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmStartOver}
                className="flex-1 py-2 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all hover:brightness-110 active:scale-[0.98] cursor-pointer"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #cdb4db, #ffafcc, #a2d2ff)',
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Options Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        canvasRef={canvasRef}
      />
    </div>
  );
};

export default Studio;
