export interface StudioFont {
  name: string;
  family: string;
  googleFamily: string;
  preloaded?: boolean;
}

export const GOOGLE_FONTS: StudioFont[] = [
  {
    name: 'Inter',
    family: 'Inter, sans-serif',
    googleFamily: 'Inter:wght@300;400;500;600;700;800',
    preloaded: true,
  },
  { name: 'Roboto', family: 'Roboto, sans-serif', googleFamily: 'Roboto:wght@400;500;700;900' },
  { name: 'Poppins', family: 'Poppins, sans-serif', googleFamily: 'Poppins:wght@400;600;700;800' },
  {
    name: 'Montserrat',
    family: 'Montserrat, sans-serif',
    googleFamily: 'Montserrat:wght@400;600;700;800;900',
  },
  {
    name: 'Playfair Display',
    family: "'Playfair Display', serif",
    googleFamily: 'Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400;1,700',
  },
  {
    name: 'Lora',
    family: 'Lora, serif',
    googleFamily: 'Lora:ital,wght@0,400;0,600;0,700;1,400;1,700',
  },
  { name: 'Oswald', family: 'Oswald, sans-serif', googleFamily: 'Oswald:wght@400;600;700' },
  { name: 'Outfit', family: 'Outfit, sans-serif', googleFamily: 'Outfit:wght@400;600;700;800' },
  {
    name: 'Raleway',
    family: "'Raleway', sans-serif",
    googleFamily: 'Raleway:ital,wght@0,100..900;1,100..900',
  },
  { name: 'Quicksand', family: "'Quicksand', sans-serif", googleFamily: 'Quicksand:wght@300..700' },
  {
    name: 'Exo 2',
    family: "'Exo 2', sans-serif",
    googleFamily: 'Exo+2:ital,wght@0,100..900;1,100..900',
    preloaded: true,
  },
  { name: 'Monoton', family: "'Monoton', cursive", googleFamily: 'Monoton' },
  { name: 'Unica One', family: "'Unica One', cursive", googleFamily: 'Unica+One' },
  { name: 'Pacifico', family: 'Pacifico, cursive', googleFamily: 'Pacifico' },
  {
    name: 'Fira Code',
    family: "'Fira Code', monospace",
    googleFamily: 'Fira+Code:wght@400;600;700',
  },
  { name: 'Croissant One', family: "'Croissant One', cursive", googleFamily: 'Croissant+One' },
  { name: 'Dosis', family: 'Dosis, sans-serif', googleFamily: 'Dosis:wght@200..800' },
  { name: 'Emilys Candy', family: "'Emilys Candy', cursive", googleFamily: 'Emilys+Candy' },
  {
    name: 'Epilogue',
    family: 'Epilogue, sans-serif',
    googleFamily: 'Epilogue:ital,wght@0,100..900;1,100..900',
  },
  {
    name: 'Google Sans Code',
    family: "'Google Sans Code', monospace",
    googleFamily: 'Google+Sans+Code:ital,wght,MONO@0,300..800,1;1,300..800,1',
  },
  { name: 'Italianno', family: 'Italianno, cursive', googleFamily: 'Italianno' },
  {
    name: 'Titillium Web',
    family: "'Titillium Web', sans-serif",
    googleFamily:
      'Titillium+Web:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,200;1,300;1,400;1,600;1,700',
  },
  {
    name: 'Ubuntu',
    family: 'Ubuntu, sans-serif',
    googleFamily: 'Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700',
  },
];

const loadedFonts = new Set(GOOGLE_FONTS.filter((font) => font.preloaded).map((font) => font.name));
const pendingFonts = new Map<string, Promise<void>>();

export const getStudioFont = (name: string) => GOOGLE_FONTS.find((font) => font.name === name);

export const isStudioFontLoaded = (name: string) => loadedFonts.has(name);

export const loadStudioFont = (name: string): Promise<void> => {
  const font = getStudioFont(name);
  if (!font || typeof document === 'undefined' || loadedFonts.has(name)) return Promise.resolve();
  const pending = pendingFonts.get(name);
  if (pending) return pending;

  const promise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLLinkElement>(
      `link[data-shotage-font="${CSS.escape(name)}"]`
    );
    const link = existing || document.createElement('link');
    const finish = async () => {
      try {
        await document.fonts.load(`400 16px "${name.replace(/"/g, '\\"')}"`);
        loadedFonts.add(name);
        document.dispatchEvent(new CustomEvent('shotage:font-loaded', { detail: { name } }));
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        pendingFonts.delete(name);
      }
    };

    if (existing?.sheet) {
      void finish();
      return;
    }
    link.rel = 'stylesheet';
    link.crossOrigin = 'anonymous';
    link.dataset.shotageFont = name;
    link.href = `https://fonts.googleapis.com/css2?family=${font.googleFamily}&display=swap`;
    link.onload = () => void finish();
    link.onerror = () => {
      pendingFonts.delete(name);
      reject(new Error(`Could not load ${name}.`));
    };
    if (!existing) document.head.appendChild(link);
  });
  pendingFonts.set(name, promise);
  return promise;
};

export const ensureStudioFontsLoaded = async (names: Iterable<string>) => {
  const uniqueNames = Array.from(new Set(names)).filter(Boolean);
  const results = await Promise.allSettled(uniqueNames.map((name) => loadStudioFont(name)));
  const failed = results.filter((result) => result.status === 'rejected');
  if (failed.length > 0) console.warn(`${failed.length} design font(s) could not be loaded.`);
  if (typeof document !== 'undefined' && 'fonts' in document) await document.fonts.ready;
};
