import React from 'react';

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  return (
    <footer
      className={`relative z-10 border-t border-x border-neutral-800/80 rounded-t-3xl bg-neutral-950/90 backdrop-blur-md py-8 px-6 sm:px-10 max-w-7xl mx-auto text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}
    >
      <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
        <img src="/shotage-logo-small.png" alt="Shotage Logo" className="w-5 h-5 rounded-md" />
        <span className="font-bold text-slate-200">Shotage Studio</span>
        <span className="text-slate-600">•</span>
        <span>© {new Date().getFullYear()} Shotage — High-Resolution Screenshot Studio</span>
      </div>

      <div className="flex items-center gap-6 font-semibold">
        <a href="/faq" className="hover:text-white transition-colors">
          FAQ
        </a>
        <a href="/terms" className="hover:text-white transition-colors">
          Terms
        </a>
        <a href="mailto:bayukurniawan@baycore.dev" className="text-pastel-pink hover:underline">
          Send Feedback
        </a>
      </div>
    </footer>
  );
};

export default Footer;
