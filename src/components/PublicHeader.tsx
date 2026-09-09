import React from 'react';
import { AuthButton } from './auth/AuthButton';

const links = [
  { href: '/', label: 'Home' },
  { href: '/explore', label: 'Explore' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/faq', label: 'FAQ' },
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/refund-policy', label: 'Refunds' },
];

type PublicHeaderProps = {
  activePath?: string;
};

export const PublicHeader: React.FC<PublicHeaderProps> = ({ activePath }) => (
  <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl">
    <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">
      <a href="/" className="group flex shrink-0 items-center gap-2.5">
        <img
          src="/shotage-logo-small.png"
          alt="Shotage"
          className="h-8 w-8 rounded-xl object-contain transition-transform group-hover:scale-105"
        />
        <span className="text-lg font-extrabold tracking-tight text-white transition-colors group-hover:text-[#ffafcc] sm:text-xl">
          Shotage
        </span>
      </a>

      <nav
        aria-label="Primary navigation"
        className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 text-xs font-semibold text-slate-400 lg:flex"
      >
        {links.map((link) => {
          const active = activePath === link.href;
          return (
            <a
              key={link.href}
              href={link.href}
              aria-current={active ? 'page' : undefined}
              className={`whitespace-nowrap transition-colors hover:text-white ${
                active ? 'text-white' : ''
              }`}
            >
              {link.label}
            </a>
          );
        })}
      </nav>

      <div className="flex shrink-0 items-center gap-2">
        <AuthButton />
        <a
          href="/studio"
          className="hidden items-center rounded-xl px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-[#ffafcc]/25 transition hover:brightness-110 active:scale-95 sm:flex"
          style={{ backgroundImage: 'linear-gradient(135deg, #cdb4db, #ffafcc, #a2d2ff)' }}
        >
          Launch Studio
        </a>
      </div>
    </div>
  </header>
);

export default PublicHeader;
