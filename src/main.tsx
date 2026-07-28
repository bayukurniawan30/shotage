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
  const componentName = currentPath === '/studio' ? 'Studio' : 'Home';
  return {
    component: componentName,
    props: {},
    url: currentPath,
    version: null,
  };
};

const initialPage = getInitialPage();

createInertiaApp({
  page: initialPage,
  resolve: (name) => {
    const pages = import.meta.glob<any>('./pages/**/*.tsx', { eager: true });
    const module = pages[`./pages/${name}.tsx`];
    if (!module) {
      throw new Error(`Page ${name} not found`);
    }
    return module.default || module;
  },
  setup({ el, App, props }) {
    if (el) {
      createRoot(el).render(<App {...props} />);
    }
  },
});
