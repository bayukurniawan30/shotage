import React, { useState } from 'react';
import { XClose, Film01, Check, AlertCircle } from '@untitledui/icons';
import * as PhosphorIcons from '@phosphor-icons/react';

interface VideoBetaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VideoBetaModal: React.FC<VideoBetaModalProps> = ({ isOpen, onClose }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('shotage_video_beta_dismissed', 'true');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-white relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-neutral-900 transition-colors cursor-pointer"
          title="Close modal"
        >
          <XClose className="w-5 h-5" />
        </button>

        {/* Header with Glowing Icon & Beta Badge */}
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#ffafcc]/20 via-[#cdb4db]/20 to-[#a2d2ff]/20 border border-[#ffafcc]/40 flex items-center justify-center shrink-0 shadow-lg shadow-[#ffafcc]/10">
            <Film01 className="w-6 h-6 text-pastel-pink" />
          </div>
          <div className="min-w-0 pr-6">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-bold text-slate-100 text-base tracking-tight">
                Video Feature (Beta)
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-pastel-pink/20 text-pastel-pink border border-pastel-pink/30">
                Beta
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Video mockups & MP4/WebM animation export are currently in public beta.
            </p>
          </div>
        </div>

        {/* Informative Notice Cards */}
        <div className="space-y-2.5 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-3.5 text-xs text-slate-300">
          <div className="flex items-start gap-2.5">
            <PhosphorIcons.Cpu className="w-4 h-4 text-[#a2d2ff] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">Hardware Encoding:</span>{' '}
              Export speed and performance depend on your device's browser & GPU encoder.
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <PhosphorIcons.Ruler className="w-4 h-4 text-pastel-pink shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">Recommended Limits:</span>{' '}
              Videos up to <strong className="text-white">Full HD (1080p)</strong> and{' '}
              <strong className="text-white">20 seconds</strong> provide the best quality and stability.
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <PhosphorIcons.SpeakerSlash className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">Visual Only:</span> Audio tracks
              from source videos are not included in the exported animation.
            </div>
          </div>
        </div>

        {/* Don't show again checkbox */}
        <label className="flex items-center gap-2.5 text-xs text-slate-400 cursor-pointer select-none hover:text-slate-200 transition-colors">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-pastel-pink focus:ring-pastel-pink accent-pastel-pink cursor-pointer"
          />
          <span>Don't show this notice again</span>
        </label>

        {/* Action Button */}
        <button
          onClick={handleClose}
          className="w-full py-2.5 px-4 rounded-xl text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 active:scale-[0.98]"
          style={{
            backgroundImage: 'linear-gradient(135deg, #cdb4db, #ffafcc, #a2d2ff)',
          }}
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span>Got it, Let's Create</span>
        </button>
      </div>
    </div>
  );
};
