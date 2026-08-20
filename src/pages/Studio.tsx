import React, { useRef, useEffect, useState } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { CanvasStage } from '../components/CanvasStage';
import { LeftSidebar } from '../components/LeftSidebar';
import { RightSidebar } from '../components/RightSidebar';
import { MobileStudioNavbar } from '../components/MobileStudioNavbar';
import { ExportModal } from '../components/ExportModal';
import { InstallPwaModal } from '../components/InstallPwaModal';
import { VideoBetaModal } from '../components/VideoBetaModal';
import { AnimationTimeline } from '../components/AnimationTimeline';
import { StageManagerToolbar } from '../components/StageManagerToolbar';
import { ProjectSpotlight } from '../components/ProjectSpotlight';
import {
  FlipBackward,
  FlipForward,
  RefreshCcw01,
  Expand03,
  MessageTextSquare01,
  Download01,
  UploadCloud01,
  Play,
  Heart,
  DotsVertical,
} from '@untitledui/icons';

import {
  saveSession,
  loadSavedSession,
  clearSavedSession,
} from '../utils/sessionStore';
import { isVideoFile, isValidMediaFile, validateAndLoadVideo } from '../utils/videoUpload';

const SPOTLIGHT_SESSION_KEY = 'shotage-spotlight-seen';
const PROJECT_SPOTLIGHT_GATED = true;

export const Studio: React.FC = () => {
  const setImage = useStudioStore((state) => state.setImage);
  const resetAll = useStudioStore((state) => state.resetAll);
  const isPreviewMode = useStudioStore((state) => state.isPreviewMode);
  const togglePreviewMode = useStudioStore((state) => state.togglePreviewMode);
  const previewCanvasZoom = useStudioStore((state) => state.previewCanvasZoom);
  const isAnimationMode = useStudioStore((state) => state.isAnimationMode);
  const updateState = useStudioStore((state) => state.updateState);

  // When the URL carries ?s=<entryId>, this page renders a shared design (view mode)
  const sharedViewKey = new URLSearchParams(window.location.search).get('s') || null;

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isStartOverModalOpen, setIsStartOverModalOpen] = useState(false);
  const [isVideoBetaModalOpen, setIsVideoBetaModalOpen] = useState(false);
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);

  // Session restore refs
  const savedSessionDataRef = useRef<Record<string, any> | null>(null);
  const isRestoredOrDismissedRef = useRef(false);
  const [isRestorePromptOpen, setIsRestorePromptOpen] = useState(false);

  // Listen for video upload event to trigger VideoBetaModal
  useEffect(() => {
    const handleOpenVideoBeta = () => {
      if (localStorage.getItem('shotage_video_beta_dismissed') !== 'true') {
        setIsVideoBetaModalOpen(true);
      }
    };
    window.addEventListener('shotage:open-video-beta-modal', handleOpenVideoBeta);
    return () => window.removeEventListener('shotage:open-video-beta-modal', handleOpenVideoBeta);
  }, []);

  useEffect(() => {
    if (PROJECT_SPOTLIGHT_GATED && sharedViewKey && !sessionStorage.getItem(SPOTLIGHT_SESSION_KEY)) {
      sessionStorage.setItem(SPOTLIGHT_SESSION_KEY, '1');
      setIsSpotlightOpen(true);
    }
  }, [sharedViewKey]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(event.target as Node)) {
        setIsDesktopMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportSettings = () => {
    setIsDesktopMenuOpen(false);
    setIsMobileMenuOpen(false);
    const state = useStudioStore.getState();
    const jsonString = JSON.stringify(state, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shotage-settings-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsDesktopMenuOpen(false);
    setIsMobileMenuOpen(false);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        if (typeof importedData === 'object' && importedData !== null) {
          useStudioStore.getState().updateState(importedData);
        }
      } catch (err) {
        alert('Invalid settings file format.');
      }
    };
    reader.readAsText(file);
    // Reset file input value so re-selecting same file works
    e.target.value = '';
  };

  const confirmStartOver = () => {
    resetAll();
    temporalStore.getState().clear();
    clearSavedSession();
    savedSessionDataRef.current = null;
    isRestoredOrDismissedRef.current = true;
    setIsStartOverModalOpen(false);
    setTimeout(() => fitCanvasToView(), 60);
    setTimeout(() => fitCanvasToView(), 400);
  };

  // Auto-save session to IndexedDB & LocalStorage (debounced, gated by user restore decision)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const save = () => {
      try {
        if (sharedViewKey) return; // don't overwrite session while viewing shared design
        // CRITICAL: Never overwrite saved session while restore modal is waiting for user choice!
        if (!isRestoredOrDismissedRef.current) return;
        const storeState = useStudioStore.getState();
        saveSession(storeState);
      } catch {
        // Silently skip
      }
    };

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(save, 800);
    };

    const flush = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      save();
    };

    const unsubscribe = useStudioStore.subscribe(schedule);
    window.addEventListener('beforeunload', flush);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', flush);
      if (timer) clearTimeout(timer);
    };
  }, [sharedViewKey]);

  // On mount, check for a previous session in IndexedDB / LocalStorage and offer to restore it
  useEffect(() => {
    if (sharedViewKey) {
      isRestoredOrDismissedRef.current = true;
      return;
    }
    loadSavedSession()
      .then((saved) => {
        if (saved && Object.keys(saved).length > 0) {
          savedSessionDataRef.current = saved;
          setIsRestorePromptOpen(true);
        } else {
          isRestoredOrDismissedRef.current = true;
        }
      })
      .catch(() => {
        isRestoredOrDismissedRef.current = true;
      });
  }, [sharedViewKey]);

  // When the URL carries ?s=<entryId>, fetch and apply the shared design
  useEffect(() => {
    if (!sharedViewKey) return;
    let cancelled = false;
    fetch(`/api/share/${encodeURIComponent(sharedViewKey)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (!data?.json_string) {
          console.warn('Shared design not found:', sharedViewKey);
          return;
        }
        try {
          const parsed = JSON.parse(data.json_string);
          useStudioStore.getState().updateState({
            ...parsed,
            shareIdentifier: data.identifier || sharedViewKey,
            sharedDesignName: data.name || null,
            sharedDesignPublisher: data.publisher || null,
          });
          temporalStore.getState().clear();
          setTimeout(() => fitCanvasToView(), 60);
        } catch (err) {
          console.error('Failed to parse shared design:', err);
        }
      })
      .catch((err) => console.error('Failed to load shared design:', err));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedViewKey]);

  const restoreSession = () => {
    const data = savedSessionDataRef.current;
    if (data) {
      useStudioStore.getState().updateState(data);
      temporalStore.getState().clear();
      setTimeout(() => fitCanvasToView(), 60);
    }
    isRestoredOrDismissedRef.current = true;
    setIsRestorePromptOpen(false);
  };

  const discardSession = () => {
    clearSavedSession();
    savedSessionDataRef.current = null;
    isRestoredOrDismissedRef.current = true;
    setIsRestorePromptOpen(false);
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

  // Global keyboard shortcuts:
  // - Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z, Cmd/Ctrl+Y: Undo / Redo
  // - Arrow keys (ArrowLeft, ArrowRight, ArrowUp, ArrowDown): Move selected layer(s) by 1px (or 10px with Shift)
  // - Delete / Backspace: Delete selected layer(s)
  // - Escape: Deselect all layers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable ||
        target.closest('input, textarea, select, [contenteditable="true"]')
      ) {
        return;
      }

      const mod = e.metaKey || e.ctrlKey;
      if (mod) {
        const key = e.key.toLowerCase();
        if (key === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            temporalStore.getState().redo();
          } else {
            temporalStore.getState().undo();
          }
        } else if (key === 'y') {
          e.preventDefault();
          temporalStore.getState().redo();
        }
        return;
      }

      // Handle Arrow keys to nudge selected layers horizontally & vertically
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const state = useStudioStore.getState();
        const textIds = state.selectedTextLayerIds?.length
          ? state.selectedTextLayerIds
          : state.selectedTextLayerId
            ? [state.selectedTextLayerId]
            : [];
        const phosphorIds = state.selectedPhosphorIconLayerIds?.length
          ? state.selectedPhosphorIconLayerIds
          : state.selectedPhosphorIconLayerId
            ? [state.selectedPhosphorIconLayerId]
            : [];
        const elementIds = state.selectedElementIds?.length
          ? state.selectedElementIds
          : state.selectedElementId
            ? [state.selectedElementId]
            : [];
        const shapeIds = state.selectedShapeIds?.length
          ? state.selectedShapeIds
          : state.selectedShapeId
            ? [state.selectedShapeId]
            : [];

        const hasSelectedLayers =
          textIds.length > 0 ||
          phosphorIds.length > 0 ||
          elementIds.length > 0 ||
          shapeIds.length > 0;

        if (hasSelectedLayers) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
          const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;

          textIds.forEach((id) => {
            const l = (state.textLayers || []).find((item) => item.id === id);
            if (l && !l.locked) {
              state.updateTextLayer(id, {
                x: Math.round(l.x + dx),
                y: Math.round(l.y + dy),
              });
            }
          });

          phosphorIds.forEach((id) => {
            const l = (state.phosphorIconLayers || []).find((item) => item.id === id);
            if (l && !l.locked) {
              state.updatePhosphorIconLayer(id, {
                x: Math.round(l.x + dx),
                y: Math.round(l.y + dy),
              });
            }
          });

          elementIds.forEach((id) => {
            const el = (state.canvasElements || []).find((item) => item.id === id);
            if (el && !el.locked) {
              state.updateCanvasElement(id, {
                x: Math.round(el.x + dx),
                y: Math.round(el.y + dy),
              });
            }
          });

          shapeIds.forEach((id) => {
            const s = (state.shapeLayers || []).find((item) => item.id === id);
            if (s && !s.locked) {
              state.updateShapeLayer(id, {
                x: Math.round(s.x + dx),
                y: Math.round(s.y + dy),
              });
            }
          });
        }
        return;
      }

      // Handle Delete / Backspace to remove selected layer(s)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const state = useStudioStore.getState();
        const textIds = state.selectedTextLayerIds?.length
          ? state.selectedTextLayerIds
          : state.selectedTextLayerId
            ? [state.selectedTextLayerId]
            : [];
        const phosphorIds = state.selectedPhosphorIconLayerIds?.length
          ? state.selectedPhosphorIconLayerIds
          : state.selectedPhosphorIconLayerId
            ? [state.selectedPhosphorIconLayerId]
            : [];
        const elementIds = state.selectedElementIds?.length
          ? state.selectedElementIds
          : state.selectedElementId
            ? [state.selectedElementId]
            : [];
        const shapeIds = state.selectedShapeIds?.length
          ? state.selectedShapeIds
          : state.selectedShapeId
            ? [state.selectedShapeId]
            : [];

        if (
          textIds.length > 0 ||
          phosphorIds.length > 0 ||
          elementIds.length > 0 ||
          shapeIds.length > 0
        ) {
          e.preventDefault();
          textIds.forEach((id) => state.removeTextLayer(id));
          phosphorIds.forEach((id) => state.removePhosphorIconLayer(id));
          elementIds.forEach((id) => state.removeCanvasElement(id));
          shapeIds.forEach((id) => state.removeShapeLayer(id));
        }
        return;
      }

      // Handle Escape to deselect all layers
      if (e.key === 'Escape') {
        const state = useStudioStore.getState();
        state.selectTextLayer(null);
        state.selectPhosphorIconLayer(null);
        state.selectCanvasElement(null);
        state.selectShapeLayer(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [temporalStore]);

  const canvasRef = useRef<HTMLDivElement>(null);
  const centerStageRef = useRef<HTMLDivElement>(null);

  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragCounter = useRef(0);

  const handleImageUpload = (file: File) => {
    if (!isValidMediaFile(file)) {
      alert('Please upload a valid image or video file (.png, .jpg, .jpeg, .webp, .svg, .mp4, .webm, .mov)');
      return;
    }

    if (isVideoFile(file)) {
      if (useStudioStore.getState().layoutCount === 2) {
        alert('Video upload is only available in Single Image/Video layout mode.');
        return;
      }
      validateAndLoadVideo(file, ({ src, name, width, height, duration }) => {
        setImage(src, name, width, height, 'video', duration);
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const src = e.target.result as string;
          // Capture natural dimensions so shared designs can render an aspect placeholder
          const img = new Image();
          img.onload = () => {
            setImage(src, file.name, img.naturalWidth, img.naturalHeight, 'image');
          };
          img.onerror = () => setImage(src, file.name, null, null, 'image');
          img.src = src;
        }
      };
      reader.readAsDataURL(file);
    }
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

  // Zoom preset: Fit computes the scale so the canvas fits inside the stage viewport
  const fitCanvasToView = () => {
    const container = centerStageRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const containerRect = container.getBoundingClientRect();
    const canvasWidth = canvas.offsetWidth;
    const canvasHeight = canvas.offsetHeight;
    if (canvasWidth <= 0 || canvasHeight <= 0) return;
    const scale = Math.min(
      (containerRect.width - 24) / canvasWidth,
      (containerRect.height - 24) / canvasHeight
    );
    updateState({ previewCanvasZoom: Math.max(25, Math.min(200, Math.round(scale * 100))) });
  };

  const handleZoomPreset = (preset: 'fit' | '100' | '200') => {
    if (preset === '100') {
      updateState({ previewCanvasZoom: 100 });
      return;
    }
    if (preset === '200') {
      updateState({ previewCanvasZoom: 200 });
      return;
    }
    fitCanvasToView();
  };

  // Fit the canvas to the viewport on initial load (re-run once layout settles)
  useEffect(() => {
    const raf = requestAnimationFrame(() => fitCanvasToView());
    const t = setTimeout(() => fitCanvasToView(), 250);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-screen h-[100dvh] w-screen bg-neutral-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Studio Header Bar */}
      <header className="h-14 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between shrink-0 z-50 relative">
        {/* Left Section: Brand Logo */}
        <div className="flex items-center gap-4">
          <a href="/" onClick={handleNavHome} className="flex items-center gap-2.5 group">
            <img
              src="/shotage-logo-small.png"
              alt="Shotage Logo"
              className="h-8 sm:h-7 w-auto object-contain group-hover:scale-105 transition-transform"
            />
            <span className="hidden sm:inline font-bold text-base tracking-tight text-slate-200 group-hover:text-pastel-pinkLight transition-colors">
              Shotage
            </span>
          </a>
        </div>

        {/* Center Section: Desktop Toolbar */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-1.5 bg-neutral-950/90 p-1 rounded-xl border border-neutral-800 shadow-inner">
          {/* 1. Undo Button */}
          <button
            onClick={() => temporalStore.getState().undo()}
            disabled={!canUndo}
            className={`flex flex-col items-center gap-0.5 p-1.5 min-w-[32px] rounded-lg border transition-all ${
              canUndo
                ? 'bg-neutral-800 hover:bg-neutral-700 text-slate-200 border-neutral-700 cursor-pointer'
                : 'bg-neutral-950/50 text-slate-600 border-neutral-800/50 cursor-not-allowed'
            }`}
            title={canUndo ? 'Undo (Cmd+Z)' : 'Nothing to undo'}
          >
            <FlipBackward className="w-4 h-4" />
            <span className="text-[8px] font-mono font-semibold leading-none opacity-80">⌘Z</span>
          </button>

          {/* 2. Redo Button */}
          <button
            onClick={() => temporalStore.getState().redo()}
            disabled={!canRedo}
            className={`flex flex-col items-center gap-0.5 p-1.5 min-w-[32px] rounded-lg border transition-all ${
              canRedo
                ? 'bg-neutral-800 hover:bg-neutral-700 text-slate-200 border-neutral-700 cursor-pointer'
                : 'bg-neutral-950/50 text-slate-600 border-neutral-800/50 cursor-not-allowed'
            }`}
            title={canRedo ? 'Redo (Cmd+Shift+Z or Cmd+Y)' : 'Nothing to redo'}
          >
            <FlipForward className="w-4 h-4" />
            <span className="text-[8px] font-mono font-semibold leading-none opacity-80">⇧⌘Z</span>
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

          {/* 4. Animate Timeline Toggle Button */}
          <button
            onClick={() => updateState({ isAnimationMode: !isAnimationMode })}
            className={`relative overflow-hidden rounded-lg p-[2px] transition-all cursor-pointer ${
              isAnimationMode ? 'animate-border shadow-lg shadow-pink-300/30' : ''
            }`}
          >
            <span
              className={`relative z-10 flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold ${
                isAnimationMode
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-slate-300'
              }`}
            >
              <Play className="w-3.5 h-3.5" color={isAnimationMode ? '#bde0fe' : '#a2d2ff'} />
              Animate
            </span>
          </button>

          <div className="h-4 w-px bg-neutral-800 my-auto mx-0.5"></div>

          {/* 5. Preview Toggle Button (Expand03 icon) */}
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

          {/* 6. More Options Dropdown Menu (DotsVertical) */}
          <div className="relative" ref={desktopMenuRef}>
            <button
              onClick={() => setIsDesktopMenuOpen(!isDesktopMenuOpen)}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                isDesktopMenuOpen
                  ? 'bg-neutral-700 text-white border-neutral-600'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-slate-300 border-neutral-700'
              }`}
              title="More Options"
            >
              <DotsVertical className="w-4 h-4" />
            </button>

            {isDesktopMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-neutral-900 border border-neutral-800 shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <a
                  href="mailto:bayukurniawan@baycore.dev?subject=Feedback%20for%20Shotage%20Studio"
                  onClick={() => setIsDesktopMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <MessageTextSquare01 className="w-4 h-4 text-slate-400" />
                  <span>Send Feedback</span>
                </a>

                <label className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer">
                  <UploadCloud01 className="w-4 h-4 text-slate-400" />
                  <span>Import Settings</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportSettings}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleExportSettings}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors text-left cursor-pointer"
                >
                  <Download01 className="w-4 h-4 text-slate-400" />
                  <span>Export Settings</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Mobile Controls + Export Button */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Mobile-Only Toolbar Actions */}
          <div className="flex md:hidden items-center gap-1 bg-neutral-950/90 p-1 rounded-xl border border-neutral-800">
            <button
              onClick={() => temporalStore.getState().undo()}
              disabled={!canUndo}
              className={`p-1.5 rounded-lg border transition-all ${
                canUndo
                  ? 'bg-neutral-800 text-slate-200 border-neutral-700'
                  : 'bg-neutral-950/50 text-slate-600 border-neutral-800/50 cursor-not-allowed'
              }`}
              title="Undo (Cmd/Ctrl+Z)"
            >
              <FlipBackward className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => temporalStore.getState().redo()}
              disabled={!canRedo}
              className={`p-1.5 rounded-lg border transition-all ${
                canRedo
                  ? 'bg-neutral-800 text-slate-200 border-neutral-700'
                  : 'bg-neutral-950/50 text-slate-600 border-neutral-800/50 cursor-not-allowed'
              }`}
              title="Redo (Cmd/Ctrl+Shift+Z)"
            >
              <FlipForward className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsStartOverModalOpen(true)}
              className="p-1.5 bg-neutral-800 border border-neutral-700 text-slate-200 rounded-lg"
              title="Start Over"
            >
              <RefreshCcw01 className="w-3.5 h-3.5 text-[#cdb4db]" />
            </button>
            <button
              onClick={() => updateState({ isAnimationMode: !isAnimationMode })}
              className={`relative overflow-hidden rounded-lg p-[2px] transition-all cursor-pointer ${
                isAnimationMode ? 'animate-border shadow-lg shadow-pink-300/30' : ''
              }`}
              title="Toggle Keyframe Timeline Animation Mode"
            >
              <span
                className={`relative z-10 flex items-center justify-center rounded-md p-1.5 transition-all ${
                  isAnimationMode
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-800 text-slate-300 border border-neutral-700'
                }`}
              >
                <Play className="w-3.5 h-3.5" color={isAnimationMode ? '#bde0fe' : '#a2d2ff'} />
              </span>
            </button>
            <button
              onClick={togglePreviewMode}
              className={`p-1.5 rounded-lg border transition-all ${
                isPreviewMode
                  ? 'bg-pastel-pink text-slate-950 border-pastel-pinkLight font-bold shadow-md shadow-pastel-pink/25'
                  : 'bg-neutral-800 text-slate-300 border-neutral-700'
              }`}
              title={isPreviewMode ? 'Exit Full Preview' : 'Full Preview Mode'}
            >
              <Expand03 className="w-3.5 h-3.5" />
            </button>
            <div className="relative" ref={mobileMenuRef}>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(!isMobileMenuOpen);
                }}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  isMobileMenuOpen
                    ? 'bg-neutral-700 text-white border-neutral-600'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-slate-300 border-neutral-700'
                }`}
                title="More Options"
              >
                <DotsVertical className="w-4 h-4" />
              </button>

              {isMobileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-neutral-900 border border-neutral-800 shadow-2xl p-1 z-[100] animate-in fade-in zoom-in-95 duration-100">
                  <a
                    href="mailto:bayukurniawan@baycore.dev?subject=Feedback%20for%20Shotage%20Studio"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                  >
                    <MessageTextSquare01 className="w-4 h-4 text-slate-400" />
                    <span>Send Feedback</span>
                  </a>

                  <label className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer">
                    <UploadCloud01 className="w-4 h-4 text-slate-400" />
                    <span>Import Settings</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportSettings}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleExportSettings}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors text-left cursor-pointer"
                  >
                    <Download01 className="w-4 h-4 text-slate-400" />
                    <span>Export Settings</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <a
            href="https://saweria.co/bayukurniawan30"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 sm:px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-slate-200 font-semibold text-xs rounded-xl border border-neutral-700 transition-all flex items-center gap-1.5 cursor-pointer hover:border-neutral-600"
          >
            <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />
            <span className="hidden sm:inline">Support Me</span>
          </a>
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-3 sm:px-4 py-1.5 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-[#ffafcc]/25 transition-all flex items-center gap-1.5 cursor-pointer hover:brightness-110 active:scale-[0.98]"
            style={{
              backgroundImage: 'linear-gradient(135deg, #cdb4db, #ffafcc, #a2d2ff)',
            }}
          >
            <Download01 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </header>

      {/* Centered Fixed Stage Manager Toolbar */}
      <StageManagerToolbar />

      {/* 3-Column Studio Workspace */}
      <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-3.5rem)] h-[calc(100dvh-3.5rem)] min-h-0 overflow-hidden relative">
        {/* Left Sidebar (Desktop Only, Animated Slide Out to Left in Preview Mode) */}
        <div
          className={`hidden md:block h-full shrink-0 transition-all duration-300 ease-in-out ${
            isPreviewMode
              ? '-translate-x-full opacity-0 pointer-events-none w-0 overflow-hidden'
              : 'translate-x-0 opacity-100 w-80'
          }`}
        >
          <LeftSidebar onImageUpload={handleImageUpload} />
        </div>

        {/* Center Stage: Interactive Canvas Workspace */}
        <div className="flex-1 bg-neutral-950 relative overflow-hidden flex flex-col items-center justify-between min-w-0 transition-all duration-300">
          <div
            ref={centerStageRef}
            className="flex-1 w-full flex items-center justify-center relative"
          >
            {/* Floating Bottom Zoom Slider (Full Preview Mode OR Normal Mode) */}
            <div
              className={`fixed left-1/2 -translate-x-1/2 z-20 bg-neutral-900/95 border border-neutral-800 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-2xl flex items-center gap-2 sm:gap-3 animate-in fade-in duration-200 w-[90%] max-w-md sm:w-auto justify-between ${
                isAnimationMode
                  ? 'bottom-[150px] sm:bottom-24'
                  : isPreviewMode
                    ? 'bottom-4 sm:bottom-6'
                    : 'bottom-24 sm:bottom-6'
              }`}
            >
              <span className="text-[11px] sm:text-xs font-semibold text-slate-300 shrink-0">
                Canvas Zoom
              </span>
              <button
                type="button"
                onClick={() => handleZoomPreset('fit')}
                className={`hidden sm:inline-block px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  previewCanvasZoom <= 30
                    ? 'bg-pastel-pink/20 text-pastel-pink border border-pastel-pink/40'
                    : 'text-slate-300 hover:bg-neutral-800 border border-transparent'
                }`}
                title="Fit canvas to viewport"
              >
                Fit
              </button>
              <button
                type="button"
                onClick={() => handleZoomPreset('100')}
                className={`hidden sm:inline-block px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  previewCanvasZoom === 100
                    ? 'bg-pastel-pink/20 text-pastel-pink border border-pastel-pink/40'
                    : 'text-slate-300 hover:bg-neutral-800 border border-transparent'
                }`}
                title="Zoom to 100%"
              >
                100%
              </button>
              <button
                type="button"
                onClick={() => handleZoomPreset('200')}
                className={`hidden sm:inline-block px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  previewCanvasZoom >= 200
                    ? 'bg-pastel-pink/20 text-pastel-pink border border-pastel-pink/40'
                    : 'text-slate-300 hover:bg-neutral-800 border border-transparent'
                }`}
                title="Zoom to 200%"
              >
                200%
              </button>
              <input
                type="range"
                min="25"
                max="200"
                value={previewCanvasZoom}
                onChange={(e) => updateState({ previewCanvasZoom: Number(e.target.value) })}
                className="flex-1 min-w-[80px] sm:min-w-0 w-auto bg-neutral-800 rounded-lg cursor-pointer accent-pastel-pink"
              />
              <span className="text-[11px] sm:text-xs font-mono text-slate-400 w-8 sm:w-9 text-right shrink-0">
                {previewCanvasZoom}%
              </span>
            </div>

            <CanvasStage canvasRef={canvasRef} onImageUpload={handleImageUpload} />
          </div>

          {/* Animation Keyframe Timeline Dock */}
          {useStudioStore((s) => s.isAnimationMode) && (
            <div className="absolute bottom-[20px] md:bottom-6 left-1/2 -translate-x-1/2 w-[94%] max-w-4xl z-30 pointer-events-auto">
              <AnimationTimeline />
            </div>
          )}
        </div>

        {/* Right Sidebar (Desktop Only, Animated Slide Out to Right in Preview Mode) */}
        <div
          className={`hidden md:block h-full shrink-0 transition-all duration-300 ease-in-out ${
            isPreviewMode
              ? 'translate-x-full opacity-0 pointer-events-none w-0 overflow-hidden'
              : 'translate-x-0 opacity-100 w-80'
          }`}
        >
          <RightSidebar />
        </div>

        {/* Mobile Bottom Scrollable Navbar Drawer (Animated Slide Down in Preview Mode) */}
        <div
          className={`block md:hidden relative z-40 transition-all duration-300 ease-in-out ${
            isPreviewMode
              ? 'translate-y-full opacity-0 pointer-events-none h-0 overflow-hidden'
              : 'translate-y-0 opacity-100'
          }`}
        >
          <MobileStudioNavbar onImageUpload={handleImageUpload} />
        </div>
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

      {/* Restore Previous Session Modal */}
      {isRestorePromptOpen && (
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
                <h3 className="text-sm font-bold text-slate-100">Restore session?</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  We found a previously saved edit. Restore it and pick up where you left off?
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={discardSession}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
              >
                Start Fresh
              </button>
              <button
                onClick={restoreSession}
                className="flex-1 py-2 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all hover:brightness-110 active:scale-[0.98] cursor-pointer"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #cdb4db, #ffafcc, #a2d2ff)',
                }}
              >
                Restore
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

      {/* Video Feature Beta Notice Modal */}
      <VideoBetaModal
        isOpen={isVideoBetaModalOpen}
        onClose={() => setIsVideoBetaModalOpen(false)}
      />

      {/* Mobile Install App Button */}
      <InstallPwaModal showFloatingButton={!isMobileMenuOpen} />

      {/* Cross-project spotlight (random project ad) on shared designs */}
      {isSpotlightOpen && (
        <ProjectSpotlight onClose={() => setIsSpotlightOpen(false)} />
      )}
    </div>
  );
};

export default Studio;
