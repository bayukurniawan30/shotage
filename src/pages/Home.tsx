import React, { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import {
  DownloadCloud01,
  Play,
  Film01,
  Stars01,
  ArrowRight,
  Check,
  Zap,
  Image01,
  Share01,
  LayersThree01,
  Sliders01,
} from '@untitledui/icons';
import * as PhosphorIcons from '@phosphor-icons/react';
import { InstallPwaModal } from '../components/InstallPwaModal';
import { ShadeshifterBackground } from '../components/ShadeshifterBackground';
import { SpectralBackground } from '../components/SpectralBackground';
import { ConfettiBackground } from '../components/ConfettiBackground';
import { LINEAR_SWATCH_PRESETS } from '../utils/linearSwatchPresets';
import { GRADIENT_PRESETS } from '../utils/gradientPresets';
import { PROJECTS } from '../components/ProjectSpotlight';
import { Footer } from '../components/Footer';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const Home: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [heroZoomProgress, setHeroZoomProgress] = useState(0);
  const [effectiveHeroScroll, setEffectiveHeroScroll] = useState(0);
  const [activeFrameTab, setActiveFrameTab] = useState<
    'iphone17' | 'iphone15' | 'iphone14' | 'samsungS21' | 'macbook'
  >('iphone17');
  const [bentoSlideIndex, setBentoSlideIndex] = useState(0);
  const [bento2SlideIndex, setBento2SlideIndex] = useState(0);
  const [selectedMockupStyle, setSelectedMockupStyle] = useState('card');
  const [selectedShadow, setSelectedShadow] = useState('floating');

  // Mouse Parallax for Hero 3D Card
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroCardRef = useRef<HTMLDivElement>(null);

  // Scroll reveal observer for animation cards & sponsored section
  const [isAnimationVisible, setIsAnimationVisible] = useState(false);
  const animationSectionRef = useRef<HTMLElement>(null);
  const [isSponsoredVisible, setIsSponsoredVisible] = useState(false);
  const sponsoredSectionRef = useRef<HTMLElement>(null);

  // Touch swipe refs for carousels
  const bento1TouchStartX = useRef<number | null>(null);
  const bento2TouchStartX = useRef<number | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === animationSectionRef.current) {
              setIsAnimationVisible(true);
            }
            if (entry.target === sponsoredSectionRef.current) {
              setIsSponsoredVisible(true);
            }
          }
        });
      },
      { threshold: 0.15 }
    );

    if (animationSectionRef.current) {
      observer.observe(animationSectionRef.current);
    }
    if (sponsoredSectionRef.current) {
      observer.observe(sponsoredSectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop, { passive: true });

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    let rafId: number | null = null;
    let lastScrolledState = false;

    const handleScroll = () => {
      if (rafId !== null) return;

      rafId = window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const scrolled = currentY > 50;

        if (scrolled !== lastScrolledState) {
          lastScrolledState = scrolled;
          setIsScrolled(scrolled);
        }

        // Only calculate hero parallax and zoom on desktop screens
        if (window.innerWidth >= 768 && currentY < 1100) {
          const heroScrollThreshold = 200;
          const effScroll = Math.max(currentY - heroScrollThreshold, 0);
          const zoomProg = Math.min(effScroll / 450, 1);
          setEffectiveHeroScroll(effScroll);
          setHeroZoomProgress(zoomProg);
        }

        rafId = null;
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', checkDesktop);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroCardRef.current || !isDesktop) return;
    const rect = heroCardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleHeroMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  const handleHeaderAction = async (e: React.MouseEvent) => {
    if (window.innerWidth < 640 && (deferredPrompt || isIOS)) {
      e.preventDefault();
      if (deferredPrompt) {
        await deferredPrompt.prompt();
        setDeferredPrompt(null);
      } else if (isIOS) {
        setShowIosGuide(true);
      }
    }
  };

  // Touch swipe handlers for carousels
  const handleBento1TouchStart = (e: React.TouchEvent) => {
    bento1TouchStartX.current = e.touches[0].clientX;
  };

  const handleBento1TouchEnd = (e: React.TouchEvent) => {
    if (bento1TouchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - bento1TouchStartX.current;
    if (Math.abs(delta) > 50) {
      if (delta > 0) {
        setBentoSlideIndex((prev) => (prev === 0 ? 4 : prev - 1));
      } else {
        setBentoSlideIndex((prev) => (prev === 4 ? 0 : prev + 1));
      }
    }
    bento1TouchStartX.current = null;
  };

  const handleBento2TouchStart = (e: React.TouchEvent) => {
    bento2TouchStartX.current = e.touches[0].clientX;
  };

  const handleBento2TouchEnd = (e: React.TouchEvent) => {
    if (bento2TouchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - bento2TouchStartX.current;
    if (Math.abs(delta) > 50) {
      if (delta > 0) {
        setBento2SlideIndex((prev) => (prev === 0 ? 1 : prev - 1));
      } else {
        setBento2SlideIndex((prev) => (prev === 1 ? 0 : prev + 1));
      }
    }
    bento2TouchStartX.current = null;
  };

  const framePreviews = {
    iphone17: {
      name: 'iPhone 17 Pro Dual side',
      badge: 'Apple Device',
      description: 'Showcase front and side perspective with glass titanium reflection.',
      image: '/frame/frame-iphone-17-dual-side.webp',
      gradient: 'linear-gradient(135deg, #cdb4db 0%, #ffafcc 35%, #a2d2ff 70%, #cdb4db 100%)',
    },
    iphone15: {
      name: 'iPhone 15',
      badge: 'Apple Device',
      description: 'Modern sleek black aluminum frame with dynamic island display.',
      image: '/frame/frame-iphone-15.png',
      gradient: 'linear-gradient(135deg, #3b0764 0%, #7c3aed 35%, #ec4899 70%, #3b0764 100%)',
    },
    iphone14: {
      name: 'iPhone 14 Pro',
      badge: 'Apple Device',
      description: 'Deep purple titanium finish with precision screen ratio and studio shadows.',
      image: '/frame/frame-iphone-14-pro.png',
      gradient: 'linear-gradient(135deg, #654ea3 0%, #4f46e5 35%, #eaafc8 70%, #654ea3 100%)',
    },
    samsungS21: {
      name: 'Samsung Galaxy S21',
      badge: 'Android Device',
      description: 'Edge-to-edge Android infinity display with ultra-thin bezels.',
      image: '/frame/frame-samsung-s21.png',
      gradient: 'linear-gradient(135deg, #059669 0%, #34d399 35%, #00c6ff 70%, #059669 100%)',
    },
    macbook: {
      name: 'MacBook Air M3',
      badge: 'Desktop',
      description: 'Realistic aluminum chassis with precision display notch and studio shadows.',
      image: '/frame/frame-macbook-air-13.png',
      gradient: 'linear-gradient(135deg, #1a2a6c 0%, #2563eb 35%, #38bdf8 70%, #1a2a6c 100%)',
      imgClass:
        'max-h-[290px] sm:max-h-[310px] w-auto h-auto max-w-[95%] object-contain scale-110 sm:scale-120 origin-center',
    },
  };

  return (
    <>
      <Head>
        <title>Shotage Studio — Turn Screenshots into Stunning 3D Mockups & Videos</title>
        <meta
          name="description"
          content="Transform plain app screenshots into presentation-ready 3D mockups, social media graphics, and motion animations directly in your browser."
        />
        <link rel="canonical" href="https://shotage.studio/" />
      </Head>

      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-[#ffafcc] selection:text-slate-950 relative overflow-x-hidden">
        {/* Dynamic Background Ambient Gradient Orbs */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-40 left-1/4 w-[350px] sm:w-[700px] h-[300px] sm:h-[500px] bg-[#cdb4db]/10 sm:bg-[#cdb4db]/15 blur-[60px] sm:blur-[160px] rounded-full sm:animate-pulse duration-3000" />
          <div className="absolute top-1/3 -right-20 sm:-right-40 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-[#ffafcc]/10 sm:bg-[#ffafcc]/12 blur-[60px] sm:blur-[180px] rounded-full" />
          <div className="absolute bottom-10 left-10 w-[350px] sm:w-[800px] h-[300px] sm:h-[500px] bg-[#a2d2ff]/8 sm:bg-[#a2d2ff]/10 blur-[60px] sm:blur-[170px] rounded-full" />
          {/* Subtle noise grain texture overlay - Desktop only for GPU efficiency */}
          <div
            className="hidden md:block absolute inset-0 opacity-[0.035] mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
            }}
          />
        </div>

        {/* Adaptive Fluid Morphing Floating Navbar */}
        <nav
          className={`fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isScrolled
              ? 'top-4 w-[92%] sm:w-auto max-w-md px-3.5 py-2 bg-neutral-950/90 sm:bg-neutral-950/85 backdrop-blur-md sm:backdrop-blur-2xl border border-neutral-800/90 rounded-full shadow-2xl shadow-black/80'
              : 'top-0 w-full max-w-7xl px-6 py-4 bg-transparent border-b border-transparent rounded-none'
          }`}
        >
          <div
            className={`flex items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isScrolled ? 'gap-3 sm:gap-6' : 'w-full'
            }`}
          >
            {/* Logo */}
            <a href="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-8 h-8 rounded-xl p-0.5 shadow-md shadow-[#ffafcc]/20 group-hover:scale-105 transition-transform">
                <img
                  src="/shotage-logo-small.png"
                  alt="Shotage Logo"
                  className="w-full h-full object-contain rounded-[10px]"
                />
              </div>
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white group-hover:text-[#ffafcc] transition-colors">
                Shotage
              </span>
            </a>

            {/* Desktop Navigation Links (Smoothly collapse/expand with fluid morph) */}
            <div
              className={`hidden md:flex items-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${
                isScrolled
                  ? 'max-w-0 opacity-0 pointer-events-none -translate-y-1 scale-95 gap-0'
                  : 'max-w-md opacity-100 translate-y-0 scale-100 gap-8'
              }`}
            >
              <a
                href="#frames"
                className="hover:text-white transition-colors whitespace-nowrap text-xs font-semibold text-slate-300"
              >
                Device Frames
              </a>
              <a
                href="#animation"
                className="hover:text-white transition-colors whitespace-nowrap text-xs font-semibold text-slate-300"
              >
                Animation & Video
              </a>
              <a
                href="#features"
                className="hover:text-white transition-colors whitespace-nowrap text-xs font-semibold text-slate-300"
              >
                Features
              </a>
              <a
                href="/faq"
                className="hover:text-white transition-colors whitespace-nowrap text-xs font-semibold text-slate-300"
              >
                FAQ
              </a>
            </div>

            {/* CTA Button */}
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="/studio"
                onClick={handleHeaderAction}
                className="px-4 py-2 text-slate-950 font-extrabold text-xs rounded-full shadow-lg shadow-[#ffafcc]/25 transition-all flex items-center gap-2 hover:brightness-110 active:scale-95 cursor-pointer whitespace-nowrap"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #cdb4db, #ffafcc, #a2d2ff)',
                }}
              >
                <span>Launch Studio</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </a>
            </div>
          </div>
        </nav>

        {/* MAIN CONTENT SECTIONS (Scrollytelling Flow) */}
        <main className="relative z-10">
          {/* SECTION 1: Hero Stage & 3D Interactive Mockup */}
          <section
            className="min-h-screen flex flex-col justify-center items-center pt-28 pb-16 sm:pb-24 px-6 max-w-7xl mx-auto transition-[padding] duration-75 ease-out"
            style={
              isDesktop
                ? {
                    paddingBottom: `${80 + heroZoomProgress * 220}px`,
                  }
                : undefined
            }
          >
            <div className="text-center max-w-5xl mx-auto mb-10 space-y-6">
              {/* Hero Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
                <span className="block sm:inline">Transform Plain Screenshots into</span>{' '}
                <br className="hidden sm:block" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#cdb4db] via-[#ffafcc] to-[#a2d2ff]">
                  Stunning 3D Mockups
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Create high-converting social graphics, browser mockups, and realistic 3D device
                representations directly in your browser. Zero backend latency, maximum privacy.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
                <a
                  href="/studio"
                  onClick={handleHeaderAction}
                  className="w-full sm:w-auto px-7 py-3.5 text-slate-950 font-extrabold text-sm rounded-2xl shadow-xl shadow-[#ffafcc]/25 transition-all flex items-center justify-center gap-2.5 hover:brightness-110 active:scale-[0.98] cursor-pointer"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #cdb4db, #ffafcc, #a2d2ff)',
                  }}
                >
                  {/* Mobile View: Install Shotage */}
                  <span className="sm:hidden flex items-center gap-2">
                    <DownloadCloud01 className="w-4 h-4 stroke-[2.5]" />
                    <span>Install Shotage</span>
                  </span>

                  {/* Desktop View: Open Studio Editor */}
                  <span className="hidden sm:flex items-center gap-2.5">
                    <span>Open Studio Editor</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </span>
                </a>

                <a
                  href="#animation"
                  className="w-full sm:w-auto px-6 py-3.5 bg-neutral-900/80 hover:bg-neutral-800/90 border border-neutral-800 text-slate-200 font-semibold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 backdrop-blur-md"
                >
                  <Film01 className="w-4 h-4 text-pastel-pink" />
                  <span>See Video Export</span>
                </a>
              </div>
            </div>

            {/* Interactive 3D Mockup Showcase Card with Mouse Parallax Tilt */}
            <div
              ref={heroCardRef}
              onMouseMove={handleHeroMouseMove}
              onMouseLeave={handleHeroMouseLeave}
              className="w-full max-w-3xl relative mt-4 perspective-[1200px]"
            >
              {/* Desktop-only floating side assets (Videos & Hand-drawn arrows) */}
              {isDesktop && (
                <>
                  {/* Floating Decorative Hand-Drawn Arrow (Left: public/element/arrow/3.svg) */}
                  <div
                    className="absolute left-2 sm:-left-6 top-[350px] -translate-y-1/2 hidden md:block pointer-events-none z-40 select-none transition-opacity duration-300"
                    style={{ opacity: Math.max(1 - heroZoomProgress * 2.5, 0) }}
                  >
                    <div
                      className="w-16 h-16 sm:w-20 sm:h-20 bg-[#a2d2ff] drop-shadow-[0_4px_16px_rgba(162,210,255,0.6)] transform rotate-[4deg] scale-x-[-1]"
                      style={{
                        maskImage: 'url(/element/arrow/3.svg)',
                        WebkitMaskImage: 'url(/element/arrow/3.svg)',
                        maskSize: 'contain',
                        WebkitMaskSize: 'contain',
                        maskRepeat: 'no-repeat',
                        WebkitMaskRepeat: 'no-repeat',
                        maskPosition: 'center',
                        WebkitMaskPosition: 'center',
                      }}
                    />
                  </div>

                  {/* Floating Studio Frame Mockups Video Preview */}
                  <div
                    className="absolute -left-18 sm:-left-52 lg:-left-56 top-32 -translate-y-1/2 hidden md:block z-30 select-none transition-all duration-75 ease-out"
                    style={{
                      transform: `translate3d(${-heroZoomProgress * 40}px, ${-effectiveHeroScroll * 0.1}px, 0)`,
                      opacity: Math.max(1 - heroZoomProgress * 2.5, 0),
                      pointerEvents: effectiveHeroScroll > 150 ? 'none' : 'auto',
                    }}
                  >
                    <div className="w-44 sm:w-52 rounded-2xl border border-neutral-700/80 bg-neutral-950/95 p-2 shadow-2xl shadow-black/90 backdrop-blur-xl transition-transform duration-300 hover:scale-105">
                      <div className="relative rounded-xl overflow-hidden border border-white/10 bg-neutral-900 aspect-[10/16]">
                        <video
                          src="/video/frame-mockups-section-video.mp4"
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="px-2 py-1.5 flex items-center justify-between text-xs font-bold text-slate-300">
                        <span>Frame Mockups</span>
                        <span className="text-[10px] text-[#a2d2ff] bg-[#a2d2ff]/15 px-2 py-0.5 rounded font-bold">
                          Vector & 3D
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Floating Decorative Hand-Drawn Arrow (Right: public/element/arrow/9.svg) */}
                  <div
                    className="absolute right-2 sm:-right-6 top-60 -translate-y-1/2 hidden md:block pointer-events-none z-40 select-none transition-opacity duration-300"
                    style={{ opacity: Math.max(1 - heroZoomProgress * 2.5, 0) }}
                  >
                    <div
                      className="w-16 h-16 sm:w-20 sm:h-20 bg-pastel-pink drop-shadow-[0_4px_16px_rgba(255,175,204,0.6)] transform rotate-[30deg]"
                      style={{
                        maskImage: 'url(/element/arrow/9.svg)',
                        WebkitMaskImage: 'url(/element/arrow/9.svg)',
                        maskSize: 'contain',
                        WebkitMaskSize: 'contain',
                        maskRepeat: 'no-repeat',
                        WebkitMaskRepeat: 'no-repeat',
                        maskPosition: 'center',
                        WebkitMaskPosition: 'center',
                      }}
                    />
                  </div>

                  {/* Floating Studio Background Style Video Preview */}
                  <div
                    className="absolute -right-20 sm:-right-48 lg:-right-52 top-32 -translate-y-1/2 hidden md:block z-30 select-none transition-all duration-75 ease-out"
                    style={{
                      transform: `translate3d(${heroZoomProgress * 40}px, ${-effectiveHeroScroll * 0.1}px, 0)`,
                      opacity: Math.max(1 - heroZoomProgress * 2.5, 0),
                      pointerEvents: effectiveHeroScroll > 150 ? 'none' : 'auto',
                    }}
                  >
                    <div className="w-36 sm:w-44 rounded-2xl border border-neutral-700/80 bg-neutral-950/95 p-1.5 shadow-2xl shadow-black/90 backdrop-blur-xl transition-transform duration-300 hover:scale-105">
                      <div className="relative rounded-xl overflow-hidden border border-white/10 bg-neutral-900 aspect-[9/16]">
                        <video
                          src="/video/background-style-section-video.mp4"
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="px-1.5 py-1.5 flex items-center justify-between text-[10px] font-bold text-slate-300">
                        <span>Background Style</span>
                        <span className="text-[9px] text-pastel-pink bg-pastel-pink/15 px-1.5 py-0.5 rounded font-bold">
                          12+ Types
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Centerpiece 3D Mockup Studio Card (Scales up to Full Width on scroll on Desktop) */}
              <div
                style={
                  isDesktop
                    ? {
                        transform: `rotateY(${mousePos.x * Math.max(1 - heroZoomProgress, 0) * 16}deg) rotateX(${-mousePos.y * Math.max(1 - heroZoomProgress, 0) * 16}deg) scale(${1 + heroZoomProgress * 0.65})`,
                        transition: 'transform 0.12s ease-out',
                        transformOrigin: 'center center',
                      }
                    : undefined
                }
                className="relative rounded-3xl border border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md sm:backdrop-blur-xl p-2 sm:p-4 shadow-2xl shadow-black/90 overflow-hidden z-20 will-change-transform"
              >
                {/* Internal Card Mesh Glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#cdb4db]/10 via-transparent to-[#a2d2ff]/10 pointer-events-none" />
                {/* Hero Mockup Frame Centerpiece */}
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-neutral-800 bg-neutral-900 aspect-video flex items-center justify-center">
                  <img
                    src="/main-studio.webp"
                    alt="Shotage Studio Editor Interface"
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: Interactive Device & Frame Gallery */}
          <section
            id="frames"
            className="min-h-screen flex flex-col justify-center py-20 px-6 max-w-7xl mx-auto border-t border-neutral-900"
          >
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-pastel-pink">
                Device Ecosystem
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                Every frame. Pixel perfected.
              </h2>
              <p className="text-sm text-slate-400">
                Choose from ultra-sharp vector frames, modern web browsers, dual-phone mockups, or
                clean frameless canvas layouts.
              </p>
            </div>

            {/* Frame Selector Tabs */}
            <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
              {(Object.keys(framePreviews) as Array<keyof typeof framePreviews>).map((key) => {
                const isSelected = activeFrameTab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveFrameTab(key)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? 'bg-neutral-900 border border-[#ffafcc] text-white shadow-lg shadow-[#ffafcc]/15'
                        : 'bg-neutral-950 border border-neutral-800 text-slate-400 hover:text-white hover:bg-neutral-900'
                    }`}
                  >
                    <span>{framePreviews[key].name}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                        isSelected
                          ? 'bg-pastel-pink text-slate-950'
                          : 'bg-neutral-800 text-slate-400'
                      }`}
                    >
                      {framePreviews[key].badge}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Frame Stage Preview Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-neutral-950/90 sm:bg-neutral-950/80 border border-neutral-800 rounded-3xl p-6 sm:p-10 backdrop-blur-sm sm:backdrop-blur-xl">
              <div className="lg:col-span-7 relative flex items-center justify-center min-h-[360px] rounded-2xl border border-white/10 p-8 overflow-hidden shadow-2xl group">
                {/* Dynamic Animated Gradient Background */}
                <div
                  className="absolute inset-0 transition-all duration-700 ease-out animate-gradient-flow"
                  style={{
                    backgroundImage: framePreviews[activeFrameTab].gradient,
                  }}
                />

                {/* Subtle dark studio vignette & noise overlay */}
                <div className="absolute inset-0 bg-radial from-transparent via-black/10 to-black/30 pointer-events-none" />

                {/* Device Image in Foreground */}
                <img
                  src={framePreviews[activeFrameTab].image}
                  alt={framePreviews[activeFrameTab].name}
                  className={`relative z-10 drop-shadow-[0_25px_50px_rgba(0,0,0,0.6)] transition-all duration-500 group-hover:scale-105 ${
                    (framePreviews[activeFrameTab] as any).imgClass ||
                    'max-h-[300px] object-contain'
                  }`}
                />
              </div>

              <div className="lg:col-span-5 space-y-5">
                <div className="inline-block px-3 py-1 rounded-lg bg-pastel-pink/15 border border-pastel-pink/30 text-pastel-pink text-xs font-bold">
                  {framePreviews[activeFrameTab].badge} Frame
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {framePreviews[activeFrameTab].name}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {framePreviews[activeFrameTab].description}
                </p>

                <div className="space-y-2.5 pt-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-pastel-pink stroke-[2.5]" />
                    <span>Instant high-resolution vector and WebP rendering</span>
                  </div>
                  {activeFrameTab !== 'macbook' && (
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-pastel-pink stroke-[2.5]" />
                      <span>Show/hide system status bar</span>
                    </div>
                  )}
                </div>

                <a
                  href="/studio"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer mt-4"
                >
                  <span>Customize this frame in Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </section>

          {/* SECTION 3: Motion & Video Export Engine */}
          <section
            ref={animationSectionRef}
            id="animation"
            className="min-h-screen flex flex-col justify-center py-20 px-6 max-w-7xl mx-auto border-t border-neutral-900"
          >
            <div
              className={`text-center max-w-3xl mx-auto mb-12 space-y-4 transition-all duration-700 ease-out ${
                isAnimationVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#a2d2ff]/10 border border-[#a2d2ff]/30 text-xs font-bold uppercase tracking-widest text-[#a2d2ff] shadow-sm">
                <PhosphorIcons.Sparkle className="w-4 h-4 text-[#a2d2ff]" />
                <span>Animation Studio & Keyframe Engine</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
                Bring static shots into{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#a2d2ff] via-[#cdb4db] to-[#ffafcc]">
                  cinematic motion.
                </span>
              </h2>
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Craft spatial 3D keyframe camera paths, floating badges, and smooth MP4/WebM video
                animations rendered at silky 60 FPS directly in your browser.
              </p>

              {/* Rich Feature Metric Pills */}
              <div className="flex items-center justify-center gap-2.5 pt-2 flex-wrap text-xs">
                <span className="px-3 py-1 rounded-xl bg-neutral-900/90 border border-neutral-800 text-slate-300 flex items-center gap-1.5 shadow-sm">
                  <PhosphorIcons.CheckCircle className="w-4 h-4 text-pastel-pink" /> 60 FPS Hardware
                  Render
                </span>
                <span className="px-3 py-1 rounded-xl bg-neutral-900/90 border border-neutral-800 text-slate-300 flex items-center gap-1.5 shadow-sm">
                  <PhosphorIcons.CheckCircle className="w-4 h-4 text-[#a2d2ff]" /> Multi-Track
                  Keyframe Seeking
                </span>
                <span className="px-3 py-1 rounded-xl bg-neutral-900/90 border border-neutral-800 text-slate-300 flex items-center gap-1.5 shadow-sm">
                  <PhosphorIcons.CheckCircle className="w-4 h-4 text-emerald-400" /> Bezier Cubic
                  Easing
                </span>
              </div>
            </div>

            {/* Live Interactive Timeline Video Showcase Stage with 3 Floating Animated Feature Cards */}
            <div
              className={`w-full max-w-5xl mx-auto relative transition-all duration-700 ease-out delay-300 ${
                isAnimationVisible
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'opacity-0 translate-y-12 scale-95'
              }`}
            >
              {/* Floating Card 1: Multi-Track Timeline (Top-Left Float) */}
              <div className="hidden lg:block absolute left-72 -top-6 z-20 max-w-[240px] p-4 rounded-2xl bg-neutral-950/90 border border-neutral-800/90 backdrop-blur-xl shadow-2xl shadow-black/80 space-y-2 select-none animate-float-slow hover:scale-105 transition-transform">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#ffafcc]/15 border border-[#ffafcc]/30 flex items-center justify-center shrink-0">
                    <PhosphorIcons.FilmStripIcon className="w-4 h-4 text-pastel-pink" />
                  </div>
                  <h4 className="text-xs font-bold text-white">Video Timeline</h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Scrub horizontally across tracks with 1s grid ticks and live 3D keyframe diamond
                  nodes.
                </p>
              </div>

              {/* Floating Card 2: Element Loops (Bottom-Left Float) */}
              <div className="hidden lg:block absolute left-48 -bottom-24 z-20 max-w-[240px] p-4 rounded-2xl bg-neutral-950/90 border border-neutral-800/90 backdrop-blur-xl shadow-2xl shadow-black/80 space-y-2 select-none animate-float-delay hover:scale-105 transition-transform">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#a2d2ff]/15 border border-[#a2d2ff]/30 flex items-center justify-center shrink-0">
                    <PhosphorIcons.SparkleIcon className="w-4 h-4 text-pastel-blue" />
                  </div>
                  <h4 className="text-xs font-bold text-white">Continuous Loops</h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Animate callouts, stickers, and badges with pulse, spin, bounce, and floating
                  shimmer.
                </p>
              </div>

              {/* Floating Card 3: Hardware GPU Export (Top-Right Float) */}
              <div className="hidden lg:block absolute -right-16 top-4 z-20 max-w-[240px] p-4 rounded-2xl bg-neutral-950/90 border border-neutral-800/90 backdrop-blur-xl shadow-2xl shadow-black/80 space-y-2 select-none animate-float-reverse hover:scale-105 transition-transform">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#cdb4db]/15 border border-[#cdb4db]/30 flex items-center justify-center shrink-0">
                    <PhosphorIcons.CpuIcon className="w-4 h-4 text-pastel-purple" />
                  </div>
                  <h4 className="text-xs font-bold text-white">Hardware GPU Export</h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  WebCodecs & H.264 renders directly on your GPU for instant 60 FPS video downloads.
                </p>
              </div>

              {/* Center Timeline Video Showcase */}
              <div className="w-full max-w-4xl mx-auto mt-12 overflow-hidden">
                <div className="relative rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800/80 shadow-inner">
                  <div className="overflow-hidden rounded-xl">
                    <video
                      src="/video/timeline-video.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-auto object-cover object-center"
                      style={{
                        clipPath: 'inset(10px 10px 10px round 14px)',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Mobile/Tablet Fallback Feature Grid (Visible below lg) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 lg:hidden">
                <div className="p-4 rounded-2xl bg-neutral-950/90 sm:bg-neutral-950/80 border border-neutral-800 backdrop-blur-sm sm:backdrop-blur-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-[#ffafcc]/15 border border-[#ffafcc]/30 flex items-center justify-center">
                      <PhosphorIcons.FilmStrip className="w-4 h-4 text-pastel-pink" />
                    </div>
                    <h4 className="text-xs font-bold text-white">Video Timeline</h4>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Scrub horizontally across tracks with 1s grid ticks and live 3D keyframe nodes.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-neutral-950/90 sm:bg-neutral-950/80 border border-neutral-800 backdrop-blur-sm sm:backdrop-blur-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-[#a2d2ff]/15 border border-[#a2d2ff]/30 flex items-center justify-center">
                      <PhosphorIcons.Sparkle className="w-4 h-4 text-pastel-blue" />
                    </div>
                    <h4 className="text-xs font-bold text-white">Continuous Loops</h4>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Animate text callouts, stickers, and badges with pulse, spin, and bounce
                    effects.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-neutral-950/90 sm:bg-neutral-950/80 border border-neutral-800 backdrop-blur-sm sm:backdrop-blur-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-[#cdb4db]/15 border border-[#cdb4db]/30 flex items-center justify-center">
                      <PhosphorIcons.Cpu className="w-4 h-4 text-pastel-purple" />
                    </div>
                    <h4 className="text-xs font-bold text-white">GPU 60fps Export</h4>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    WebCodecs & H.264 renders on your device GPU for crystal-clear video downloads.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4: Studio Features Bento Grid */}
          <section
            id="features"
            className="min-h-screen flex flex-col justify-center py-24 px-6 max-w-7xl mx-auto border-t border-neutral-900"
          >
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-[#cdb4db]">
                Powerful Toolkit
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                Designed for high-impact creators.
              </h2>
              <p className="text-sm text-slate-400">
                Everything you need to create viral Product Hunt screenshots, Twitter headers, and
                portfolio graphics.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bento 1: Backgrounds Carousel (Curated, Linear Swatch, Shadeshifter, Spectral Prism, Confetti) */}
              <div className="md:col-span-2 p-7 sm:p-8 rounded-3xl bg-neutral-950/90 sm:bg-neutral-950/80 border border-neutral-800 backdrop-blur-sm sm:backdrop-blur-xl relative overflow-hidden flex flex-col justify-between group min-h-[360px]">
                {/* Header & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 z-10">
                  <div className="space-y-2">
                    <span className="px-2.5 py-1 rounded-md bg-pastel-pink/20 text-pastel-pink font-bold text-[10px] uppercase">
                      {bentoSlideIndex === 0 && 'Curated Gradients'}
                      {bentoSlideIndex === 1 && 'Linear Swatch'}
                      {bentoSlideIndex === 2 && 'Shadeshifter'}
                      {bentoSlideIndex === 3 && 'Spectral Prism'}
                      {bentoSlideIndex === 4 && 'Confetti Pattern'}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {bentoSlideIndex === 0 && 'Handcrafted Color Harmonies'}
                      {bentoSlideIndex === 1 && 'Multi-Stop Linear Swatches'}
                      {bentoSlideIndex === 2 && 'Multi-Point Fluid Mesh'}
                      {bentoSlideIndex === 3 && 'Spectral Chromatic Prism'}
                      {bentoSlideIndex === 4 && 'Playful Floating Confetti'}
                    </h3>
                    <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                      {bentoSlideIndex === 0 &&
                        'Handcrafted multi-stop gradients for rich, harmonic mockup backdrops.'}
                      {bentoSlideIndex === 1 &&
                        'Stepped linear swatches featuring modern analog color palettes.'}
                      {bentoSlideIndex === 2 &&
                        'Multi-point dynamic fluid blobs infused with analog film grain.'}
                      {bentoSlideIndex === 3 &&
                        'Continuous chromatic rainbow spectrums with ambient refraction.'}
                      {bentoSlideIndex === 4 &&
                        'Playful geometric particles to bring dynamic energy to static shots.'}
                    </p>
                  </div>

                  {/* Prev / Next Arrows */}
                  <div className="flex items-center gap-1.5 shrink-0 bg-neutral-900/90 border border-neutral-800 p-1 rounded-2xl shadow-lg self-start">
                    <button
                      onClick={() => setBentoSlideIndex((prev) => (prev === 0 ? 4 : prev - 1))}
                      className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                      title="Previous background style"
                    >
                      <PhosphorIcons.CaretLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setBentoSlideIndex((prev) => (prev === 4 ? 0 : prev + 1))}
                      className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                      title="Next background style"
                    >
                      <PhosphorIcons.CaretRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Slide Preview Canvas with Same Exact Dimensions for All 5 Slides */}
                <div
                  className="mt-6 relative h-36 sm:h-40 rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900/90 shadow-inner"
                  onTouchStart={handleBento1TouchStart}
                  onTouchEnd={handleBento1TouchEnd}
                >
                  {/* Slide 0: Curated Gradient (3 gradients) */}
                  {bentoSlideIndex === 0 && (
                    <div className="grid grid-cols-3 gap-3 p-3 w-full h-full animate-in fade-in zoom-in-95 duration-300">
                      <div className="relative h-full rounded-xl bg-gradient-to-tr from-[#cdb4db] via-[#ffafcc] to-[#a2d2ff] shadow-md border border-white/10 flex items-end p-2.5 overflow-hidden">
                        <span className="relative z-10 text-[10px] font-bold text-slate-950 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-md">
                          Pastel Silk
                        </span>
                      </div>
                      <div className="relative h-full rounded-xl bg-gradient-to-tr from-[#ff758c] to-[#ff7eb3] shadow-md border border-white/10 flex items-end p-2.5 overflow-hidden">
                        <span className="relative z-10 text-[10px] font-bold text-white bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md">
                          Neon Rose
                        </span>
                      </div>
                      <div className="relative h-full rounded-xl bg-gradient-to-tr from-[#4158D0] via-[#C850C0] to-[#FFCC70] shadow-md border border-white/10 flex items-end p-2.5 overflow-hidden">
                        <span className="relative z-10 text-[10px] font-bold text-white bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md">
                          Sunset Glow
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Slide 1: Linear Swatch (3 presets from linearSwatchPresets.ts) */}
                  {bentoSlideIndex === 1 && (
                    <div className="grid grid-cols-3 gap-3 p-3 w-full h-full animate-in fade-in zoom-in-95 duration-300">
                      <div
                        className="relative h-full rounded-xl shadow-md border border-white/10 flex items-end p-2.5 overflow-hidden"
                        style={{
                          backgroundImage:
                            LINEAR_SWATCH_PRESETS.find((p) => p.id === 'ls-10')?.css ||
                            'linear-gradient(45deg, #004069, #19e0ff)',
                        }}
                      >
                        <span className="relative z-10 text-[10px] font-bold text-white bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-md">
                          Ocean Teal
                        </span>
                      </div>
                      <div
                        className="relative h-full rounded-xl shadow-md border border-white/10 flex items-end p-2.5 overflow-hidden"
                        style={{
                          backgroundImage:
                            LINEAR_SWATCH_PRESETS.find((p) => p.id === 'ls-11')?.css ||
                            'linear-gradient(45deg, #c2615d, #62c0bd)',
                        }}
                      >
                        <span className="relative z-10 text-[10px] font-bold text-white bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-md">
                          Terracotta Sage
                        </span>
                      </div>
                      <div
                        className="relative h-full rounded-xl shadow-md border border-white/10 flex items-end p-2.5 overflow-hidden"
                        style={{
                          backgroundImage:
                            LINEAR_SWATCH_PRESETS.find((p) => p.id === 'ls-16')?.css ||
                            'linear-gradient(45deg, #88deba, #e194b3)',
                        }}
                      >
                        <span className="relative z-10 text-[10px] font-bold text-white bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-md">
                          Aurora Pink
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Slide 2: Shadeshifter (3 presets) */}
                  {bentoSlideIndex === 2 && (
                    <div className="grid grid-cols-3 gap-3 p-3 w-full h-full animate-in fade-in zoom-in-95 duration-300">
                      <div className="relative h-full rounded-xl shadow-md border border-white/10 flex items-end p-2.5 overflow-hidden">
                        <ShadeshifterBackground
                          presetId="shadeshifter-1"
                          grainOpacity={40}
                          blur={25}
                        />
                        <span className="relative z-10 text-[10px] font-bold text-white bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-md">
                          Cyber Velvet
                        </span>
                      </div>
                      <div className="relative h-full rounded-xl shadow-md border border-white/10 flex items-end p-2.5 overflow-hidden">
                        <ShadeshifterBackground
                          presetId="shadeshifter-2"
                          grainOpacity={40}
                          blur={25}
                        />
                        <span className="relative z-10 text-[10px] font-bold text-white bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-md">
                          Solar Flare
                        </span>
                      </div>
                      <div className="relative h-full rounded-xl shadow-md border border-white/10 flex items-end p-2.5 overflow-hidden">
                        <ShadeshifterBackground
                          presetId="shadeshifter-3"
                          grainOpacity={40}
                          blur={25}
                        />
                        <span className="relative z-10 text-[10px] font-bold text-white bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-md">
                          Aurora Borealis
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Slide 3: Spectral Prism (3 presets) */}
                  {bentoSlideIndex === 3 && (
                    <div className="grid grid-cols-3 gap-3 p-3 w-full h-full animate-in fade-in zoom-in-95 duration-300">
                      <div className="relative h-full rounded-xl shadow-md border border-white/10 flex items-end p-2.5 overflow-hidden">
                        <SpectralBackground presetId="spectral-1" blur={25} />
                        <span className="relative z-10 text-[10px] font-bold text-white bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-md">
                          Obsidian Prism
                        </span>
                      </div>
                      <div className="relative h-full rounded-xl shadow-md border border-white/10 flex items-end p-2.5 overflow-hidden">
                        <SpectralBackground presetId="spectral-2" blur={25} />
                        <span className="relative z-10 text-[10px] font-bold text-white bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-md">
                          Cosmic Refract
                        </span>
                      </div>
                      <div className="relative h-full rounded-xl shadow-md border border-white/10 flex items-end p-2.5 overflow-hidden">
                        <SpectralBackground presetId="spectral-4" blur={25} />
                        <span className="relative z-10 text-[10px] font-bold text-white bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-md">
                          Solaris Flare
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Slide 4: Confetti (3 presets) */}
                  {bentoSlideIndex === 4 && (
                    <div className="grid grid-cols-3 gap-3 p-3 w-full h-full animate-in fade-in zoom-in-95 duration-300">
                      <div className="relative h-full rounded-xl shadow-md border border-white/10 flex items-end p-2.5 overflow-hidden bg-neutral-950">
                        <ConfettiBackground presetId="confetti-1" />
                        <span className="relative z-10 text-[10px] font-bold text-white bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md">
                          Carnival Pop
                        </span>
                      </div>
                      <div className="relative h-full rounded-xl shadow-md border border-white/10 flex items-end p-2.5 overflow-hidden bg-neutral-950">
                        <ConfettiBackground presetId="confetti-2" />
                        <span className="relative z-10 text-[10px] font-bold text-white bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md">
                          Cyber Neon
                        </span>
                      </div>
                      <div className="relative h-full rounded-xl shadow-md border border-white/10 flex items-end p-2.5 overflow-hidden bg-neutral-950">
                        <ConfettiBackground presetId="confetti-3" />
                        <span className="relative z-10 text-[10px] font-bold text-white bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md">
                          Pastel Party
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Carousel Pagination Dots */}
                <div className="flex items-center justify-center gap-1.5 pt-4 z-10">
                  {[0, 1, 2, 3, 4].map((idx) => (
                    <button
                      key={idx}
                      onClick={() => setBentoSlideIndex(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        bentoSlideIndex === idx
                          ? 'w-6 bg-pastel-pink'
                          : 'w-1.5 bg-neutral-800 hover:bg-neutral-700'
                      }`}
                      title={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Bento 2: Mockup Style & Shadow Elevation Carousel */}
              <div className="p-7 sm:p-8 rounded-3xl bg-neutral-950/90 sm:bg-neutral-950/80 border border-neutral-800 backdrop-blur-sm sm:backdrop-blur-xl flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md bg-[#a2d2ff]/20 text-[#a2d2ff] font-bold text-[10px] uppercase">
                      {bento2SlideIndex === 0 && 'Mockup Style'}
                      {bento2SlideIndex === 1 && 'Shadow Elevation'}
                    </span>
                    {/* Prev / Next Arrows */}
                    <div className="flex items-center gap-1 shrink-0 bg-neutral-900/90 border border-neutral-800 p-0.5 rounded-xl shadow-md">
                      <button
                        onClick={() => setBento2SlideIndex((prev) => (prev === 0 ? 1 : prev - 1))}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                        title="Previous slide"
                      >
                        <PhosphorIcons.CaretLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setBento2SlideIndex((prev) => (prev === 1 ? 0 : prev + 1))}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                        title="Next slide"
                      >
                        <PhosphorIcons.CaretRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {bento2SlideIndex === 0 && 'Frameless Styles'}
                    {bento2SlideIndex === 1 && 'Realistic Shadows'}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed min-h-[32px]">
                    {bento2SlideIndex === 0 &&
                      'Custom glassmorphism, inset bevels, multi-card elevation, and smooth borders.'}
                    {bento2SlideIndex === 1 &&
                      'Multi-tier natural blur elevation, ambient lighting, and floating depth layers.'}
                  </p>
                </div>

                {/* Carousel Stage Container */}
                <div
                  className="min-h-[175px] flex items-center justify-center"
                  onTouchStart={handleBento2TouchStart}
                  onTouchEnd={handleBento2TouchEnd}
                >
                  {/* Slide 0: 6 Frameless Mockup Styles */}
                  {bento2SlideIndex === 0 && (
                    <div className="grid grid-cols-3 gap-2.5 w-full pt-1 animate-in fade-in zoom-in-95 duration-300">
                      {[
                        { id: 'default', label: 'Default', grad: GRADIENT_PRESETS[10] },
                        { id: 'glass-light', label: 'Glass Light', grad: GRADIENT_PRESETS[1] },
                        { id: 'glass-dark', label: 'Glass Dark', grad: GRADIENT_PRESETS[12] },
                        { id: 'inset-light', label: 'Inset Light', grad: GRADIENT_PRESETS[4] },
                        { id: 'inset-dark', label: 'Inset Dark', grad: GRADIENT_PRESETS[19] },
                        { id: 'card', label: 'Card Stack', grad: GRADIENT_PRESETS[13] },
                      ].map((st) => {
                        const isSelected = selectedMockupStyle === st.id;
                        const bgStyle = {
                          backgroundImage: `linear-gradient(135deg, ${st.grad.c1}, ${st.grad.c2})`,
                        };
                        return (
                          <button
                            key={st.id}
                            onClick={() => setSelectedMockupStyle(st.id)}
                            className="flex flex-col items-center gap-1.5 cursor-pointer group"
                          >
                            <div
                              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl border p-0 flex items-end justify-start transition-all overflow-hidden relative shadow-sm ${
                                isSelected
                                  ? 'border-[#a2d2ff] ring-2 ring-[#a2d2ff]/80 shadow-md scale-[1.05]'
                                  : 'border-white/10 hover:border-white/25 hover:scale-[1.02]'
                              }`}
                              style={bgStyle}
                            >
                              {/* Style Diagrams - Scaled larger to fill the preview box */}
                              {st.id === 'default' && (
                                <div className="absolute top-4 -left-2.5 w-14 h-14 rounded-xl bg-slate-900 border border-slate-700/80 shadow-md">
                                  <div className="w-full h-full rounded-lg bg-slate-800 border border-slate-700/50" />
                                </div>
                              )}

                              {st.id === 'glass-light' && (
                                <div className="absolute top-4 -left-2.5 w-14 h-14 p-1 rounded-xl bg-white/40 backdrop-blur-xs border border-white/70 shadow-lg">
                                  <div className="w-full h-full rounded-lg bg-slate-900/90 border border-slate-700/60" />
                                </div>
                              )}

                              {st.id === 'glass-dark' && (
                                <div className="absolute top-4 -left-2.5 w-14 h-14 p-1 rounded-xl bg-black/60 backdrop-blur-xs border border-white/25 shadow-xl">
                                  <div className="w-full h-full rounded-lg bg-slate-900 border border-slate-700/60" />
                                </div>
                              )}

                              {st.id === 'inset-light' && (
                                <div className="absolute top-4 -left-2.5 w-14 h-14 p-1 rounded-xl bg-slate-200/95 border border-slate-300 shadow-inner">
                                  <div className="w-full h-full rounded-lg bg-slate-900 border border-slate-800" />
                                </div>
                              )}

                              {st.id === 'inset-dark' && (
                                <div className="absolute top-4 -left-2.5 w-14 h-14 p-1 rounded-xl bg-slate-900/95 border border-slate-800 shadow-inner">
                                  <div className="w-full h-full rounded-lg bg-slate-950 border border-slate-800" />
                                </div>
                              )}

                              {st.id === 'card' && (
                                <div className="absolute top-4 -left-2.5 w-14 h-14">
                                  <div className="absolute inset-0 rounded-xl bg-neutral-900/90 border border-neutral-700 translate-x-1.5 translate-y-1 rotate-6 shadow-md" />
                                  <div className="relative z-10 w-full h-full rounded-xl bg-slate-900 border border-slate-700 shadow-md" />
                                </div>
                              )}
                            </div>
                            <span
                              className={`text-[10px] text-center capitalize transition-colors truncate w-full ${
                                isSelected
                                  ? 'text-[#a2d2ff] font-bold'
                                  : 'text-slate-400 group-hover:text-slate-200'
                              }`}
                            >
                              {st.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Slide 1: 5 Shadow Elevations */}
                  {bento2SlideIndex === 1 && (
                    <div className="grid grid-cols-3 sm:grid-cols-3 gap-2.5 w-full pt-1 animate-in fade-in zoom-in-95 duration-300">
                      {[
                        {
                          id: 'none',
                          label: 'None',
                          previewClass: 'shadow-none',
                          grad: GRADIENT_PRESETS[10],
                        },
                        {
                          id: 'soft',
                          label: 'Soft',
                          previewClass: 'shadow-md shadow-black/60',
                          grad: GRADIENT_PRESETS[1],
                        },
                        {
                          id: 'medium',
                          label: 'Medium',
                          previewClass: 'shadow-lg shadow-black/80',
                          grad: GRADIENT_PRESETS[12],
                        },
                        {
                          id: 'hard',
                          label: 'Hard',
                          previewClass: 'shadow-2xl shadow-black/95',
                          grad: GRADIENT_PRESETS[4],
                        },
                        {
                          id: 'floating',
                          label: 'Floating',
                          previewClass: 'shadow-[0_20px_35px_-5px_rgba(0,0,0,0.95)] -translate-y-1',
                          grad: GRADIENT_PRESETS[19],
                        },
                      ].map((sh) => {
                        const isSelected = selectedShadow === sh.id;
                        const bgStyle = {
                          backgroundImage: `linear-gradient(135deg, ${sh.grad.c1}, ${sh.grad.c2})`,
                        };
                        return (
                          <button
                            key={sh.id}
                            onClick={() => setSelectedShadow(sh.id)}
                            className="flex flex-col items-center gap-1.5 cursor-pointer group"
                          >
                            <div
                              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl border p-0 transition-all overflow-hidden relative shadow-sm ${
                                isSelected
                                  ? 'border-[#a2d2ff] ring-2 ring-[#a2d2ff]/80 shadow-md scale-[1.05]'
                                  : 'border-white/10 hover:border-white/25 hover:scale-[1.02]'
                              }`}
                              style={bgStyle}
                            >
                              {/* Masked Top-Right Corner Screenshot Box with Elevation Shadow */}
                              <div
                                className={`absolute -top-3 -right-3 w-14 h-14 rounded-xl bg-slate-900 transition-all ${sh.previewClass}`}
                              >
                                <div className="w-full h-full rounded-lg bg-white" />
                              </div>
                            </div>
                            <span
                              className={`text-[10px] text-center capitalize transition-colors truncate w-full ${
                                isSelected
                                  ? 'text-[#a2d2ff] font-bold'
                                  : 'text-slate-400 group-hover:text-slate-200'
                              }`}
                            >
                              {sh.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Carousel Pagination Dots */}
                <div className="flex items-center justify-center gap-1.5 pt-4 z-10">
                  {[0, 1].map((idx) => (
                    <button
                      key={idx}
                      onClick={() => setBento2SlideIndex(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        bento2SlideIndex === idx
                          ? 'w-6 bg-[#a2d2ff]'
                          : 'w-1.5 bg-neutral-800 hover:bg-neutral-700'
                      }`}
                      title={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Bento 3: 100% Client-Side Privacy */}
              <div className="p-8 rounded-3xl bg-neutral-950/90 sm:bg-neutral-950/80 border border-neutral-800 backdrop-blur-sm sm:backdrop-blur-xl space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 font-bold text-[10px] uppercase">
                    Zero Server Storage
                  </span>
                  <h3 className="text-xl font-bold text-white">100% Private & Local</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    All canvas rendering, 3D transforms, and video encoding run strictly client-side
                    on your local device. Your original raw images and media are never uploaded or
                    stored on our servers.
                  </p>
                </div>
                <div className="pt-2">
                  <a
                    href="/terms"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-white text-xs font-semibold transition-colors"
                  >
                    <span>Read our Terms</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Bento 4: Elements, Badges, Emojis & Shapes */}
              <div className="relative md:col-span-2 p-8 rounded-3xl bg-neutral-950/90 sm:bg-neutral-950/80 border border-neutral-800 backdrop-blur-sm sm:backdrop-blur-xl space-y-4 overflow-hidden group">
                <span className="px-2.5 py-1 rounded-md bg-amber-400/20 text-amber-300 font-bold text-[10px] uppercase">
                  Studio Elements & Annotations
                </span>
                <h3 className="text-2xl font-bold text-white">
                  Badges, 3D Emojis, Arrows & Vector Shapes
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                  Enrich your mockups with 1,000+ Phosphor icons, tech logos (React, Next.js, Figma,
                  GitHub), expressive 3D emojis, hand-drawn sketch arrows, and custom glassmorphic
                  shapes to highlight product features effortlessly.
                </p>
                <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px] text-slate-300 font-medium max-w-lg">
                  <span className="px-2.5 py-1 rounded-lg bg-neutral-900/90 border border-neutral-800 flex items-center gap-1.5 shadow-sm">
                    ✨ 3D Emojis & Stickers
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-neutral-900/90 border border-neutral-800 flex items-center gap-1.5 shadow-sm">
                    ↗️ Hand-Drawn Arrows
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-neutral-900/90 border border-neutral-800 flex items-center gap-1.5 shadow-sm">
                    🔷 Geometric Shapes
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-neutral-900/90 border border-neutral-800 flex items-center gap-1.5 shadow-sm">
                    🏷️ Tech & Social Badges
                  </span>
                </div>

                {/* Peeking Emoji in Bottom-Right Corner */}
                <div
                  className="absolute -bottom-4 -right-4 pointer-events-none select-none text-7xl sm:text-8xl transform -rotate-[30deg] drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)] transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-[25deg]"
                  aria-hidden="true"
                >
                  😎
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 5: Sponsored Partners */}
          <section
            ref={sponsoredSectionRef}
            className="py-20 px-6 max-w-7xl mx-auto border-t border-neutral-900"
          >
            <div
              className={`text-center max-w-2xl mx-auto mb-12 space-y-3 transition-all duration-700 ease-out ${
                isSponsoredVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <span className="text-xs font-bold uppercase tracking-widest text-[#ffafcc]">
                Sponsored
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Supported by our Partners
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Explore featured developer tools, creative platforms, and partners powering modern
                web creation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto perspective-[1200px]">
              {PROJECTS.map((project, idx) => (
                <div
                  key={project.name || idx}
                  style={{
                    transitionDelay: `${idx * 160 + 100}ms`,
                    transformOrigin: 'bottom center',
                  }}
                  className={`group relative p-6 sm:p-8 rounded-3xl bg-neutral-950/90 sm:bg-neutral-950/80 border border-neutral-800 backdrop-blur-sm sm:backdrop-blur-xl hover:border-neutral-700 shadow-xl space-y-5 flex flex-col justify-between overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isSponsoredVisible
                      ? 'opacity-100 translate-y-0 rotate-x-0 rotate-0 scale-100'
                      : idx === 0
                        ? 'opacity-0 translate-y-24 rotate-x-12 -rotate-2 scale-95'
                        : 'opacity-0 translate-y-24 rotate-x-12 rotate-2 scale-95'
                  }`}
                >
                  {/* Ambient accent glow on hover */}
                  <div
                    className={`absolute -top-20 -right-20 w-44 h-44 bg-gradient-to-br ${project.accent} opacity-0 group-hover:opacity-15 blur-3xl rounded-full transition-opacity duration-500 pointer-events-none`}
                  />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center p-2.5 shadow-md group-hover:scale-105 transition-transform overflow-hidden">
                        <img
                          src={project.favicon}
                          alt={`${project.name} Logo`}
                          className="w-full h-full object-contain rounded-lg"
                          onError={(e) => {
                            // Fallback to stylized initial if favicon fails
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              parent.innerHTML = `<span class="font-extrabold text-base text-white">${project.name.charAt(0)}</span>`;
                            }
                          }}
                        />
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-neutral-900 text-slate-300 border border-neutral-800 shadow-sm">
                        Featured Partner
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-white transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                        {project.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-white text-xs font-bold transition-all group-hover:border-neutral-600 shadow-sm"
                    >
                      <span>Visit {project.name}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 6: Final CTA Launchpad */}
          <section className="py-28 px-6 max-w-5xl mx-auto text-center">
            <div className="rounded-3xl border border-neutral-800 bg-gradient-to-b from-neutral-900/80 via-neutral-950/90 to-neutral-950 p-8 sm:p-14 backdrop-blur-md sm:backdrop-blur-2xl space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-[#ffafcc]/20 blur-[100px] rounded-full pointer-events-none" />

              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight relative z-10">
                Ready to create stunning mockups?
              </h2>
              <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto relative z-10">
                No sign up required. No watermarks. Start designing in seconds directly in your
                browser.
              </p>

              <div className="pt-4 relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="/studio"
                  className="w-full sm:w-auto px-8 py-3.5 text-slate-950 font-extrabold text-sm rounded-2xl shadow-2xl shadow-[#ffafcc]/30 transition-all flex items-center justify-center gap-2.5 hover:brightness-110 active:scale-95 cursor-pointer"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #cdb4db, #ffafcc, #a2d2ff)',
                  }}
                >
                  <span>Launch Studio Free</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </a>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <Footer />

        {/* Mobile Install PWA Prompt */}
        <InstallPwaModal
          showFloatingButton={false}
          isOpen={showIosGuide}
          onClose={() => setShowIosGuide(false)}
        />
      </div>
    </>
  );
};

export default Home;
