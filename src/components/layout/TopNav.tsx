import { useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  BookOpen,
  FlaskConical,
  Home,
  Info,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useAppStore } from '../../core/useAppStore';

const DESKTOP_NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/labs', label: 'Simulators', icon: FlaskConical, end: false },
  { to: '/explore', label: 'Reference', icon: BookOpen, end: false },
] as const;

const MOBILE_NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/labs', label: 'Labs', icon: FlaskConical, end: false },
  { to: '/explore', label: 'Reference', icon: BookOpen, end: false },
] as const;

export function TopNav() {
  const setSearchOpen = useAppStore((s) => s.setSearchOpen);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const setAboutOpen = useAppStore((s) => s.setAboutOpen);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setSearchOpen]);

  return (
    <>
      {/* Desktop Top Navigation */}
      <header className="sticky top-0 z-40 hidden border-b border-slate-200 bg-white/95 backdrop-blur-xs md:block">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-6 lg:px-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-bold tracking-tight text-slate-900 hover:text-blue-600"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
              OS
            </span>
            <span>OS Virtual Lab</span>
          </Link>

          <nav
            aria-label="Primary navigation"
            className="flex items-center justify-center gap-1.5"
          >
            {DESKTOP_NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            ))}
            <button
              type="button"
              onClick={() => setAboutOpen(true)}
              className="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <Info className="h-4 w-4" aria-hidden="true" />
              <span>About</span>
            </button>
          </nav>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search simulators and reference (Ctrl+K)"
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              <Search className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              <span>Search</span>
              <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                Ctrl+K
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="Open display and accessibility settings"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-xs md:hidden"
      >
        <div className="grid grid-cols-5 items-center py-1.5">
          {MOBILE_NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium ${
                  isActive ? 'text-blue-600' : 'text-slate-500'
                }`
              }
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium text-slate-500"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span>Search</span>
          </button>

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium text-slate-500"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            <span>Display</span>
          </button>
        </div>
      </nav>
    </>
  );
}
