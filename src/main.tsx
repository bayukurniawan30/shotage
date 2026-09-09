import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import './index.css';

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
  let componentName = 'Home';
  if (currentPath === '/studio') componentName = 'Studio';
  if (currentPath === '/pricing') componentName = 'Pricing';
  if (currentPath === '/terms') componentName = 'Terms';
  if (currentPath === '/privacy') componentName = 'Privacy';
  if (currentPath === '/refund-policy') componentName = 'RefundPolicy';
  if (currentPath === '/faq') componentName = 'Faq';
  if (currentPath === '/explore') componentName = 'Explore';
  if (currentPath === '/purchases') componentName = 'Purchases';
  if (currentPath === '/designs') componentName = 'Designs';

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

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        // Check for updates on page launch
        reg.update();

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Auto reload to apply fresh deployment
                window.location.reload();
              }
            });
          }
        });
      })
      .catch((err) => console.error('Service Worker registration failed:', err));

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}
