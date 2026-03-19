import { create } from 'zustand';

interface Settings {
  accentColor: string;
  bgColor: string;
  surfaceColor: string;
}

interface SettingsState {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  resetDefaults: () => void;
}

const STORAGE_KEY = 'table-tamer-settings';

const DEFAULTS: Settings = {
  accentColor: '#005dff',
  bgColor: '#0c0e14',
  surfaceColor: '#12141c',
};

function loadSettings(): Settings {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? { ...DEFAULTS, ...JSON.parse(data) } : DEFAULTS;
  } catch { return DEFAULTS; }
}

function saveSettings(settings: Settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function applyTheme(settings: Settings) {
  document.documentElement.style.setProperty('--color-accent', settings.accentColor);
  document.documentElement.style.setProperty('--color-surface-0', settings.bgColor);
  document.documentElement.style.setProperty('--color-surface-1', settings.surfaceColor);
}

export const useSettingsStore = create<SettingsState>((set, get) => {
  // Apply theme on load
  const initial = loadSettings();
  setTimeout(() => applyTheme(initial), 0);

  return {
    settings: initial,
    updateSetting: (key, value) => {
      const settings = { ...get().settings, [key]: value };
      saveSettings(settings);
      applyTheme(settings);
      set({ settings });
    },
    resetDefaults: () => {
      saveSettings(DEFAULTS);
      applyTheme(DEFAULTS);
      set({ settings: DEFAULTS });
    },
  };
});
