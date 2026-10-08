import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import './index.css';
import { isDesktopApp } from './platform/runtime';
import { registerPwa } from './pwa/register';

const getInitialPage = () => {
  const el = document.getElementById('app');
  if (el && el.dataset.page) {
    try {
      return JSON.parse(el.dataset.page);
    } catch (e) {
      console.error('Failed to parse data-page:', e);
    }
  }
  const currentPath = window.location.pathname;
  let componentName = isDesktopApp() ? 'Studio' : 'Home';
  if (currentPath === '/studio') componentName = 'Studio';
  if (currentPath === '/pricing') componentName = 'Pricing';
  if (currentPath === '/terms') componentName = 'Terms';
  if (currentPath === '/privacy') componentName = 'Privacy';
  if (currentPath === '/refund-policy') componentName = 'RefundPolicy';
  if (currentPath === '/faq') componentName = 'Faq';
  if (currentPath === '/explore') componentName = 'Explore';
  if (currentPath === '/purchases') componentName = 'Purchases';
  if (currentPath === '/designs') componentName = 'Designs';
  if (currentPath === '/oauth/authorize') componentName = 'McpAuthorize';

  return {
    component: componentName,
    props: {},
    url: currentPath + window.location.search,
    version: null,
  };
};

const initialPage = getInitialPage();
const pages = import.meta.glob<any>('./pages/**/*.tsx');

createInertiaApp({
  page: initialPage,
  resolve: async (name) => {
    const loadPage = pages[`./pages/${name}.tsx`];
    if (!loadPage) {
      throw new Error(`Page ${name} not found`);
    }
    const module = await loadPage();
    return module.default || module;
  },
  setup({ el, App, props }) {
    if (el) {
      createRoot(el).render(<App {...props} />);
    }
  },
});

if ('serviceWorker' in navigator && import.meta.env.PROD && !isDesktopApp()) {
  window.addEventListener('load', () => {
    void registerPwa().catch(err => console.error('Service Worker registration failed:', err));
  });
}
