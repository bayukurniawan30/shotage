import React from 'react';

interface DeviceFrameProps {
  type: 'macbook' | 'iphone' | 'tablet';
  children: React.ReactNode;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({ type, children }) => {
  if (type === 'macbook') {
    return (
      <div className="w-full flex flex-col items-center">
        {/* MacBook Display Lid */}
        <div className="w-full bg-slate-900 border-[10px] border-slate-800 rounded-t-2xl shadow-2xl relative">
          {/* Camera notch/dot */}
          <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-950 rounded-full flex items-center justify-center border border-slate-700/40 z-20">
            <div className="w-1 h-1 bg-blue-900 rounded-full"></div>
          </div>
          <div className="overflow-hidden rounded-lg">{children}</div>
        </div>
        {/* MacBook Base */}
        <div className="w-[106%] h-4 bg-gradient-to-b from-slate-700 to-slate-800 rounded-b-xl border-t border-slate-600/50 shadow-xl relative flex justify-center">
          <div className="w-20 h-1 bg-slate-900 rounded-b-md"></div>
        </div>
      </div>
    );
  }

  if (type === 'iphone') {
    return (
      <div className="mx-auto max-w-[340px] bg-slate-950 border-[12px] border-slate-900 rounded-[48px] shadow-2xl relative p-1 ring-1 ring-slate-800">
        {/* Dynamic Island Notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-20 flex items-center justify-between px-3">
          <div className="w-2.5 h-2.5 bg-slate-900 rounded-full"></div>
          <div className="w-2 h-2 bg-blue-950 rounded-full"></div>
        </div>
        {/* Screen container */}
        <div className="overflow-hidden rounded-[36px] pt-4">{children}</div>
      </div>
    );
  }

  // Tablet
  return (
    <div className="mx-auto w-full max-w-[640px] bg-slate-900 border-[14px] border-slate-800 rounded-[32px] shadow-2xl relative p-1 ring-1 ring-slate-700/50">
      {/* Front camera */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-slate-950 rounded-full z-20 border border-slate-700"></div>
      <div className="overflow-hidden rounded-[20px] pt-3">{children}</div>
    </div>
  );
};
