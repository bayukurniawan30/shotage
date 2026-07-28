import React from 'react';

interface DeviceFrameProps {
  type: 'macbook' | 'iphone' | 'tablet';
  children: React.ReactNode;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({ type, children }) => {
  if (type === 'macbook') {
    return (
      <div className="w-full flex flex-col items-center select-none">
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
      <div className="relative mx-auto w-[240px] sm:w-[260px] select-none flex items-center justify-center">
        {/* Screen Content Wrapper placed precisely inside bezel bounds */}
        <div className="absolute inset-0 top-[2.8%] bottom-[2.8%] left-[4.2%] right-[4.2%] z-0 overflow-hidden rounded-[48px]">
          <div className="w-full h-full overflow-hidden flex items-center justify-center bg-black">
            {children}
          </div>
        </div>

        {/* Real iPhone 15 Frame Overlay PNG */}
        <img
          src="/mockup/apple-iphone-15-black-portrait.png"
          alt="iPhone 15 Frame Mockup"
          className="w-full h-auto relative z-10 pointer-events-none drop-shadow-2xl"
        />
      </div>
    );
  }

  // Tablet Mockup
  return (
    <div className="mx-auto w-full max-w-[640px] bg-slate-900 border-[14px] border-slate-800 rounded-[32px] shadow-2xl relative p-1 ring-1 ring-slate-700/50">
      {/* Front camera */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-slate-950 rounded-full z-20 border border-slate-700"></div>
      <div className="overflow-hidden rounded-[20px] pt-3">{children}</div>
    </div>
  );
};
