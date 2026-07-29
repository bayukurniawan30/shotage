import React from 'react';

interface DeviceFrameProps {
  type: 'macbook' | 'macbookair13' | 'iphone' | 'iphone14pro' | 'samsung-s21' | 'tablet';
  children: React.ReactNode;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({ type, children }) => {
  if (type === 'macbookair13') {
    return (
      <div className="relative mx-auto w-[440px] sm:w-[480px] select-none flex items-center justify-center">
        {/* Screen Content Wrapper for MacBook Air 13" */}
        <div className="absolute inset-0 top-[10.2%] bottom-[10.2%] left-[9%] right-[9%] z-0 overflow-hidden rounded-[8px]">
          <div className="w-full h-full overflow-hidden flex items-center justify-center bg-black">
            {children}
          </div>
        </div>

        {/* Real MacBook Air 13" PNG Overlay */}
        <img
          src="/mockup/apple-macbookair13-front.png"
          alt="MacBook Air 13 Frame Mockup"
          className="w-full h-auto relative z-10 pointer-events-none drop-shadow-2xl"
        />
      </div>
    );
  }

  if (type === 'iphone14pro') {
    return (
      <div className="relative mx-auto w-[240px] sm:w-[260px] select-none flex items-center justify-center">
        {/* Screen Content Wrapper for iPhone 14 Pro */}
        <div className="absolute inset-0 top-[2.6%] bottom-[2.6%] left-[4.4%] right-[4.4%] z-0 overflow-hidden rounded-[36px]">
          <div className="w-full h-full overflow-hidden flex items-center justify-center bg-black">
            {children}
          </div>
        </div>

        {/* Real iPhone 14 Pro Frame Overlay PNG */}
        <img
          src="/mockup/apple-iphone14pro-deeppurple-portrait.png"
          alt="iPhone 14 Pro Frame Mockup"
          className="w-full h-auto relative z-10 pointer-events-none drop-shadow-2xl"
        />
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

  if (type === 'samsung-s21') {
    return (
      <div className="relative mx-auto w-[240px] sm:w-[260px] select-none flex items-center justify-center">
        {/* Screen Content Wrapper for Samsung Galaxy S21 */}
        <div className="absolute inset-0 top-[6%] bottom-[6%] left-[11%] right-[11%] z-0 overflow-hidden rounded-[22px]">
          <div className="w-full h-full overflow-hidden flex items-center justify-center bg-black">
            {children}
          </div>
        </div>

        {/* Real Samsung Galaxy S21 Frame Overlay PNG */}
        <img
          src="/mockup/samsung-galaxys21-black-portrait.png"
          alt="Samsung Galaxy S21 Frame Mockup"
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
