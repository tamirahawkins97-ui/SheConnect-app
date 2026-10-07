import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function AppearanceControl() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="inline-flex w-fit rounded-full border border-rose-100 bg-rose-50/60 p-1" aria-label="Display mode">
      <button
        type="button"
        onClick={() => setTheme('light')}
        aria-pressed={theme === 'light'}
        className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-all hover:scale-105 active:scale-95 ${
          theme === 'light' ? 'bg-white text-rose-700 shadow-sm' : 'text-zinc-600 hover:text-rose-600'
        }`}
      >
        <Sun size={15} aria-hidden="true" />
        Light
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        aria-pressed={theme === 'dark'}
        className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-all hover:scale-105 active:scale-95 ${
          theme === 'dark' ? 'bg-rose-700 text-white shadow-sm' : 'text-zinc-600 hover:text-rose-600'
        }`}
      >
        <Moon size={15} aria-hidden="true" />
        Dark
      </button>
    </div>
  );
}
