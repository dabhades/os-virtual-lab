import type { ReactNode } from 'react';
import { TopNav } from './TopNav';
import { GlobalSearchModal } from './GlobalSearchModal';
import { SettingsDrawer } from './SettingsDrawer';
import { AboutModal } from './AboutModal';
import { useAppStore } from '../../core/useAppStore';

export function AppLayout({ children }: { children: ReactNode }) {
  const setAboutOpen = useAppStore((s) => s.setAboutOpen);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <TopNav />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-24 sm:px-6 md:py-8 lg:px-8">
        {children}
      </main>
      <footer className="mb-14 border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 md:mb-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          Presented by <strong className="font-medium text-slate-700">Sopan Dabhade</strong> &amp;{' '}
          <strong className="font-medium text-slate-700">Ritik Bhavle</strong> · Presented to{' '}
          <strong className="font-medium text-slate-700">Prof. S.D. Gavande</strong> ·{' '}
          <button
            type="button"
            onClick={() => setAboutOpen(true)}
            className="font-medium text-blue-600 hover:underline"
          >
            About
          </button>
        </div>
      </footer>
      <GlobalSearchModal />
      <SettingsDrawer />
      <AboutModal />
    </div>
  );
}
