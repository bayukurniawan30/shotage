import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { MessageQuestionCircle, ArrowRight } from '@untitledui/icons';
import * as PhosphorIcons from '@phosphor-icons/react';

const FaqItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`w-full rounded-xl bg-slate-950/50 border overflow-hidden transition-colors ${
        open ? 'border-pastel-pink/40' : 'border-slate-800/80'
      }`}
      style={{ width: '100%' }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-xs md:text-sm font-semibold text-slate-200 cursor-pointer select-none hover:bg-slate-900/60 transition-colors text-left"
      >
        <span className="flex-1 min-w-0">{question}</span>
        <span
          className={`text-pastel-pink shrink-0 transition-transform duration-200 ${
            open ? 'rotate-90' : ''
          }`}
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </button>
      <p
        className="px-4 text-xs md:text-sm leading-relaxed text-slate-400 transition-all duration-300 ease-in-out overflow-hidden min-w-0"
        style={{
          maxHeight: open ? '400px' : '0px',
          paddingBottom: open ? '16px' : '0px',
          opacity: open ? 1 : 0,
          width: '100%',
        }}
      >
        {answer}
      </p>
    </div>
  );
};

const faqSections: { heading: string; items: { q: string; a: string }[] }[] = [
  {
    heading: 'Basics',
    items: [
      {
        q: 'What is Shotage?',
        a: 'Shotage is a browser-based mockup editor that turns a plain screenshot or design into a presentation-ready mockup. Add backgrounds, frame mockups, text, icons, logos, and animation, then export the result as an image or video.',
      },
      {
        q: 'Do I need an account?',
        a: 'No. Everything runs in your browser — there is no sign-up, and your work never leaves your device.',
      },
      {
        q: 'Which browsers and devices are supported?',
        a: 'Any modern desktop browser works. The studio also has a mobile layout so basic editing is possible on phones and tablets.',
      },
    ],
  },
  {
    heading: 'Uploads & Assets',
    items: [
      {
        q: 'Which image formats are supported?',
        a: 'Images are uploaded directly from your device (PNG, JPG, SVG, WebP). Icons, logos, and social or tech-stack badges are built into the editor.',
      },
      {
        q: 'Are my images stored on a server?',
        a: 'No. Images are processed locally in your browser and are never uploaded to an external server.',
      },
      {
        q: 'Can I use my own fonts or icons?',
        a: 'Fonts and icons are already included in the editor. You can also add custom text, emoji, and SVG elements to your mockups.',
      },
    ],
  },
  {
    heading: 'Editing',
    items: [
      {
        q: 'How do frames, aspect ratio, and 3D work?',
        a: 'Choose a device or browser frame mockup (or go frameless), pick an aspect ratio, then use the 3D & Canvas panel to tilt and add perspective to your scene.',
      },
      {
        q: 'How do Layers work?',
        a: 'The Layers panel lets you rename, show or hide, lock, duplicate, or delete any text, icon, or element, and toggle whether it sits above or below the mockup. You can also multi-select and drag multiple items together.',
      },
      {
        q: 'Can I undo mistakes?',
        a: 'Yes. Use ⌘Z / Ctrl+Z to undo and ⇧⌘Z (or ⌘Y) to redo, or use the toolbar buttons.',
      },
      {
        q: 'Is my work autosaved?',
        a: 'Yes — into your browser\u2019s local session storage, so a refresh is safe within the same session. If you close and reopen Shotage, you\u2019ll be asked whether you want to restore the session. Uploaded images are kept in memory, so a restored session may require re-uploading your image.',
      },
    ],
  },
  {
    heading: 'Export',
    items: [
      {
        q: 'What formats can I export?',
        a: 'Image and video export are available from the toolbar. You can also copy your result to the clipboard in one click.',
      },
      {
        q: 'Are animations preserved in export?',
        a: 'Yes. Animate layers with keyframes and the exported video reflects the animation.',
      },
      {
        q: 'Why might my export look rough?',
        a: 'Export uses the current canvas resolution and animation settings. Set your canvas and aspect ratio to the target output before exporting for the best result.',
      },
    ],
  },
  {
    heading: 'Pricing & Support',
    items: [
      {
        q: 'Is Shotage free?',
        a: 'Yes. There are no pricing tiers — Shotage is completely free to use for personal and commercial projects.',
      },
      {
        q: 'How do I get help?',
        a: 'Start with this FAQ. If something seems broken, report the issue through the project repository.',
      },
    ],
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqSections.flatMap((section) =>
    section.items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    }))
  ),
};

const Faq: React.FC = () => {
  return (
    <>
      <Head>
        <title>Frequently Asked Questions — Shotage Studio</title>
        <meta
          name="description"
          content="Find answers to common questions about creating 3D screenshot mockups, device frames, image/video exports, privacy, and browser features in Shotage Studio."
        />
        <link rel="canonical" href="https://shotage.studio/faq" />
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Head>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white relative overflow-hidden">
      {/* Dynamic Background Glow Orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-pastel-pink/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-[#a2d2ff]/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 group">
            <img
              src="/shotage-logo-small.png"
              alt="Shotage Logo"
              className="h-8 w-auto object-contain group-hover:scale-105 transition-transform"
            />
            <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-pastel-pinkLight transition-colors">
              Shotage
            </span>
          </a>

          <a
            href="/studio"
            className="px-3.5 sm:px-4 py-2 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-[#ffafcc]/25 transition-all flex items-center gap-2 hover:brightness-110 active:scale-95 cursor-pointer"
            style={{
              backgroundImage: 'linear-gradient(135deg, #cdb4db, #ffafcc, #a2d2ff)',
            }}
          >
            <span>Launch Studio</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-16 space-y-12">
        {/* Title Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            Frequently Asked Questions
          </h1>

          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Quick answers to the most common questions about editing, exporting, and privacy with
            Shotage.
          </p>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-8">
          {faqSections.map((section, i) => (
            <div
              key={section.heading}
              className="space-y-4 p-6 md:p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md overflow-hidden"
            >
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-pastel-blue/15 text-pastel-blue flex items-center justify-center text-xs font-extrabold shrink-0">
                  {i + 1}
                </span>
                {section.heading}
              </h2>

              <div className="space-y-4">
                {section.items.map((item) => (
                  <FaqItem key={item.q} question={item.q} answer={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action Bar */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 text-center space-y-4 shadow-xl">
          <h2 className="text-xl font-bold text-white">Still have questions?</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Send us an email and we&#39;ll get back to you as soon as possible.
          </p>
          <div className="pt-2">
            <a
              href="mailto:bayukurniawan@baycore.dev"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pastel-pink to-[#a2d2ff] hover:brightness-110 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-lg"
            >
              <PhosphorIcons.EnvelopeSimple className="w-4 h-4 text-slate-950" weight="fill" />
              <span>Contact Us</span>
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md py-6 px-6 md:px-12 text-xs font-medium text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <a
            href="/faq"
            className="hover:text-slate-100 transition-colors cursor-pointer text-slate-300 font-semibold"
          >
            FAQ
          </a>
          <a
            href="/terms"
            className="hover:text-slate-100 transition-colors cursor-pointer text-slate-300 font-semibold"
          >
            Terms of Service
          </a>
        </div>

        <div className="text-center sm:text-right">
          © {new Date().getFullYear()} Shotage — High-Resolution Screenshot Studio. All rights
          reserved.
        </div>
      </footer>
    </div>
    </>
  );
};

export default Faq;
