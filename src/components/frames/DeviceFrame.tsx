import React from 'react';
import { Menu01, Square, ChevronLeft, Wifi, BarChart05, BatteryMid } from '@untitledui/icons';
import { useStudioStore } from '../../store/useStudioStore';

interface DeviceFrameProps {
  type:
    | 'macbook'
    | 'macbookair13'
    | 'iphone'
    | 'iphone14pro'
    | 'iphone16'
    | 'iphone17-dual-side'
    | 'samsung-s21'
    | 'tablet';
  children: React.ReactNode;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({ type, children }) => {
  if (type === 'macbookair13') {
    return (
      <div className="relative mx-auto w-[440px] sm:w-[480px] select-none flex items-center justify-center">
        {/* Screen Content Wrapper for MacBook Air 13" */}
        <div className="absolute inset-0 top-[10.2%] bottom-[10.2%] left-[10%] right-[10%] z-0 overflow-hidden rounded-[4px]">
          <div className="w-full h-full overflow-hidden flex items-center justify-center bg-transparent">
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
    const iphoneStatusBar = useStudioStore((state) => state.iphoneStatusBar || 'none');
    const isStatusBarActive = iphoneStatusBar !== 'none';
    const isLightBar = iphoneStatusBar === 'light';

    return (
      <div className="relative mx-auto w-[240px] sm:w-[260px] select-none flex items-center justify-center">
        {/* Screen Content Wrapper for iPhone 14 Pro */}
        <div className="absolute inset-0 top-[2.6%] bottom-[2.6%] left-[4.4%] right-[4.4%] z-0 overflow-hidden rounded-[36px]">
          <div className="w-full h-full overflow-hidden flex items-center justify-center bg-transparent relative">
            {/* Top Status Bar (Transparent Overlay) */}
            {isStatusBarActive && (
              <div
                className={`absolute top-0 left-0 right-0 z-20 px-5 pt-3 flex items-center justify-between pointer-events-none ${
                  isLightBar ? 'text-white' : 'text-slate-900'
                }`}
              >
                {/* Time (Left) */}
                <span className="text-[9px] font-semibold tracking-tight font-sans ml-1">9:41</span>

                {/* Right Status Icons */}
                <div className="flex items-center gap-1 mr-1">
                  <BarChart05 className="w-2.5 h-2.5" />
                  <Wifi className="w-2.5 h-2.5" />
                  <BatteryMid className="w-3 h-3" />
                </div>
              </div>
            )}

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
    const iphoneStatusBar = useStudioStore((state) => state.iphoneStatusBar || 'none');
    const isStatusBarActive = iphoneStatusBar !== 'none';
    const isLightBar = iphoneStatusBar === 'light';

    return (
      <div className="relative mx-auto w-[240px] sm:w-[260px] select-none flex items-center justify-center">
        {/* Screen Content Wrapper placed precisely inside bezel bounds */}
        <div className="absolute inset-0 top-[2.8%] bottom-[2.8%] left-[4.2%] right-[4.2%] z-0 overflow-hidden rounded-[48px]">
          <div className="w-full h-full overflow-hidden flex items-center justify-center bg-transparent relative">
            {/* Top Status Bar (Transparent Overlay) */}
            {isStatusBarActive && (
              <div
                className={`absolute top-0 left-0 right-0 z-20 px-6 pt-3 flex items-center justify-between pointer-events-none ${
                  isLightBar ? 'text-white' : 'text-slate-900'
                }`}
              >
                {/* Time (Left) */}
                <span className="text-[9px] font-semibold tracking-tight font-sans ml-1">9:41</span>

                {/* Right Status Icons */}
                <div className="flex items-center gap-1 mr-1">
                  <BarChart05 className="w-2.5 h-2.5" />
                  <Wifi className="w-2.5 h-2.5" />
                  <BatteryMid className="w-3 h-3" />
                </div>
              </div>
            )}

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

  if (type === 'iphone16') {
    const iphoneStatusBar = useStudioStore((state) => state.iphoneStatusBar || 'none');
    const isStatusBarActive = iphoneStatusBar !== 'none';
    const isLightBar = iphoneStatusBar === 'light';

    return (
      <div className="relative mx-auto w-[240px] sm:w-[260px] select-none flex items-center justify-center [perspective:1000px]">
        {/* Screen Content Wrapper placed precisely inside 3D Yaw & Skew tilted bezel bounds */}
        <div
          className="absolute z-0 overflow-hidden"
          style={{
            top: '4.3%',
            bottom: '7%',
            left: '16.5%',
            right: '4.8%',
            borderRadius: '38px',
            transform: 'perspective(1000px) rotateY(5deg) skewY(350deg)',
            transformOrigin: 'center center',
          }}
        >
          <div className="w-full h-full overflow-hidden flex items-center justify-center bg-transparent relative">
            {/* Top Status Bar (Transparent Overlay) */}
            {isStatusBarActive && (
              <div
                className={`absolute top-1 left-0 right-0 z-20 px-6 pt-3 flex items-center justify-between pointer-events-none ${
                  isLightBar ? 'text-white' : 'text-slate-900'
                }`}
              >
                {/* Time (Left) */}
                <span className="text-[9px] font-semibold tracking-tight font-sans">9:41</span>

                {/* Right Status Icons */}
                <div className="flex items-center gap-1">
                  <BarChart05 className="w-2.5 h-2.5" />
                  <Wifi className="w-2.5 h-2.5" />
                  <BatteryMid className="w-3 h-3" />
                </div>
              </div>
            )}

            {children}
          </div>
        </div>

        {/* Real iPhone 16 Frame Overlay WebP */}
        <img
          src="/mockup/apple-iphone-16-portrait.webp"
          alt="iPhone 16 Frame Mockup"
          className="w-full h-auto relative z-10 pointer-events-none drop-shadow-2xl"
        />
      </div>
    );
  }

  if (type === 'iphone17-dual-side') {
    const iphoneStatusBar = useStudioStore((state) => state.iphoneStatusBar || 'none');
    const isStatusBarActive = iphoneStatusBar !== 'none';
    const isLightBar = iphoneStatusBar === 'light';

    return (
      <div className="relative mx-auto w-[270px] sm:w-[320px] select-none flex items-center justify-center">
        {/* Screen Content Wrapper for iPhone 17 Dual Side */}
        <div
          className="absolute z-0 overflow-hidden"
          style={{
            top: '3.5%',
            bottom: '3.8%',
            left: '37.2%',
            right: '12.5%',
            borderRadius: '20px',
          }}
        >
          <div className="w-full h-full overflow-hidden flex items-center justify-center bg-transparent relative">
            {/* Top Status Bar (Transparent Overlay) */}
            {isStatusBarActive && (
              <div
                className={`absolute -top-1 left-0 right-0 z-20 px-3 pt-2.5 flex items-center justify-between pointer-events-none ${
                  isLightBar ? 'text-white' : 'text-slate-900'
                }`}
              >
                {/* Time (Left) */}
                <span className="text-[8px] font-semibold tracking-tight font-sans">9:41</span>

                {/* Right Status Icons */}
                <div className="flex items-center gap-1">
                  <BarChart05 className="w-2 h-2" />
                  <Wifi className="w-2 h-2" />
                  <BatteryMid className="w-2.5 h-2.5" />
                </div>
              </div>
            )}

            {children}
          </div>
        </div>

        {/* Real iPhone 17 Dual Side Overlay WebP */}
        <img
          src="/mockup/apple-iphone-17-dual-side.webp"
          alt="iPhone 17 Dual Side Frame Mockup"
          className="w-full h-auto relative z-10 pointer-events-none drop-shadow-2xl"
        />
      </div>
    );
  }

  if (type === 'samsung-s21') {
    const samsungStatusBar = useStudioStore((state) => state.samsungStatusBar || 'none');
    const isStatusBarActive = samsungStatusBar !== 'none';
    const isDarkBar = samsungStatusBar === 'dark';

    return (
      <div className="relative mx-auto w-[240px] sm:w-[260px] select-none flex items-center justify-center">
        {/* Screen Content Wrapper for Samsung Galaxy S21 */}
        <div className="absolute inset-0 top-[6%] bottom-[6%] left-[11%] right-[11%] z-0 overflow-hidden rounded-[22px]">
          <div className="w-full h-full overflow-hidden flex flex-col bg-transparent">
            {/* Top Status Bar */}
            {isStatusBarActive && (
              <div
                className={`w-full px-3.5 pt-2.5 pb-1 flex items-center justify-between shrink-0 ${
                  isDarkBar ? 'bg-black text-white' : 'bg-white text-slate-900'
                }`}
              >
                {/* Time (Left) */}
                <span className="text-[8px] tracking-tight font-sans opacity-70">12:45</span>

                {/* Right Status Icons */}
                <div className="flex items-center gap-1">
                  <BarChart05 className="w-2 h-2 opacity-70" />
                  <BarChart05 className="w-2 h-2 opacity-70" />
                  <Wifi className="w-2 h-2 opacity-70" />
                  <BatteryMid className="w-3 h-3 opacity-70" />
                </div>
              </div>
            )}

            {/* Screen Content */}
            <div className="w-full flex-1 overflow-hidden flex items-center justify-center min-h-0 [&_img]:object-contain">
              {children}
            </div>

            {/* Bottom Navigation Bar */}
            {isStatusBarActive && (
              <div
                className={`w-full px-8 pt-1.5 pb-2.5 flex items-center justify-between shrink-0 ${
                  isDarkBar ? 'bg-black text-white' : 'bg-white text-slate-900'
                }`}
              >
                {/* 3 Navigation Icons */}
                <Menu01 className="w-3 h-3 rotate-90 ml-3 opacity-70" />
                <Square className="w-2.5 h-2.5 rounded-[2px] opacity-70" />
                <ChevronLeft className="w-3 h-3 mr-3 opacity-70" />
              </div>
            )}
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
