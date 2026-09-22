import type { CodeLanguage, CodeTheme } from '../types/studio';

export const CODE_LANGUAGES: Array<{ id: CodeLanguage; label: string; extension: string }> = [
  { id: 'typescript', label: 'TypeScript', extension: 'ts' },
  { id: 'javascript', label: 'JavaScript', extension: 'js' },
  { id: 'tsx', label: 'React TSX', extension: 'tsx' },
  { id: 'jsx', label: 'React JSX', extension: 'jsx' },
  { id: 'html', label: 'HTML', extension: 'html' },
  { id: 'css', label: 'CSS', extension: 'css' },
  { id: 'json', label: 'JSON', extension: 'json' },
  { id: 'bash', label: 'Bash', extension: 'sh' },
  { id: 'python', label: 'Python', extension: 'py' },
  { id: 'sql', label: 'SQL', extension: 'sql' },
  { id: 'go', label: 'Go', extension: 'go' },
  { id: 'rust', label: 'Rust', extension: 'rs' },
  { id: 'php', label: 'PHP', extension: 'php' },
  { id: 'yaml', label: 'YAML', extension: 'yaml' },
  { id: 'markdown', label: 'Markdown', extension: 'md' },
];

const THEME_IDS: Record<CodeTheme, 'github-dark' | 'github-light'> = {
  dark: 'github-dark',
  light: 'github-light',
};

const LANGUAGE_LOADERS = {
  typescript: () => import('@shikijs/langs/typescript'),
  javascript: () => import('@shikijs/langs/javascript'),
  tsx: () => import('@shikijs/langs/tsx'),
  jsx: () => import('@shikijs/langs/jsx'),
  html: () => import('@shikijs/langs/html'),
  css: () => import('@shikijs/langs/css'),
  json: () => import('@shikijs/langs/json'),
  bash: () => import('@shikijs/langs/bash'),
  python: () => import('@shikijs/langs/python'),
  sql: () => import('@shikijs/langs/sql'),
  go: () => import('@shikijs/langs/go'),
  rust: () => import('@shikijs/langs/rust'),
  php: () => import('@shikijs/langs/php'),
  yaml: () => import('@shikijs/langs/yaml'),
  markdown: () => import('@shikijs/langs/markdown'),
} satisfies Record<CodeLanguage, () => Promise<{ default: unknown }>>;

const highlightCache = new Map<string, Promise<string>>();
const languageLoadPromises: Partial<Record<CodeLanguage, Promise<void>>> = {};

async function createCodeHighlighter() {
  const [core, engine, darkTheme, lightTheme] = await Promise.all([
    import('shiki/core'),
    import('@shikijs/engine-javascript'),
    import('@shikijs/themes/github-dark'),
    import('@shikijs/themes/github-light'),
  ]);

  return core.createHighlighterCore({
    engine: engine.createJavaScriptRegexEngine(),
    themes: [darkTheme.default, lightTheme.default],
    langs: [],
  });
}

let highlighterPromise: ReturnType<typeof createCodeHighlighter> | null = null;

async function getCodeHighlighter(language: CodeLanguage) {
  highlighterPromise ||= createCodeHighlighter();
  const highlighter = await highlighterPromise;

  if (!highlighter.getLoadedLanguages().includes(language)) {
    languageLoadPromises[language] ||= LANGUAGE_LOADERS[language]().then(async (module) => {
      await highlighter.loadLanguage(
        module.default as Parameters<typeof highlighter.loadLanguage>[0]
      );
    });
    await languageLoadPromises[language];
  }

  return highlighter;
}

export function highlightSourceCode(
  code: string,
  language: CodeLanguage,
  theme: CodeTheme
): Promise<string> {
  const cacheKey = `${language}:${theme}:${code}`;
  const cached = highlightCache.get(cacheKey);
  if (cached) return cached;

  const highlighted = getCodeHighlighter(language)
    .then((highlighter) =>
      highlighter.codeToHtml(code || ' ', { lang: language, theme: THEME_IDS[theme] })
    )
    .catch(() => `<pre><code>${escapeHtml(code)}</code></pre>`);
  highlightCache.set(cacheKey, highlighted);

  if (highlightCache.size > 50) {
    const oldestKey = highlightCache.keys().next().value;
    if (oldestKey) highlightCache.delete(oldestKey);
  }

  return highlighted;
}

export function clampCodeSource(value: string): string {
  return value.split('\n').slice(0, 500).join('\n').slice(0, 30_000);
}

export async function waitForCodeHighlights(root: ParentNode, timeoutMs = 5000): Promise<void> {
  const startedAt = performance.now();
  while (
    Array.from(root.querySelectorAll<HTMLElement>('[data-code-highlight-ready]')).some(
      (element) => element.dataset.codeHighlightReady !== 'true'
    )
  ) {
    if (performance.now() - startedAt >= timeoutMs) return;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
