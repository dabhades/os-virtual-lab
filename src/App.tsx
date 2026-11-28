import { lazy, Suspense, useEffect, type ComponentType } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { LabErrorBoundary } from './components/common/LabErrorBoundary';
import { useAppStore } from './core/useAppStore';

function lazyWithRetry<T extends ComponentType<unknown>>(
  importer: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      const mod = await importer();
      sessionStorage.removeItem('chunk-reload-attempted');
      return mod;
    } catch (err) {
      const hasReloaded = sessionStorage.getItem('chunk-reload-attempted');
      if (!hasReloaded && typeof window !== 'undefined') {
        sessionStorage.setItem('chunk-reload-attempted', '1');
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
      throw err;
    }
  });
}

const HomePage = lazyWithRetry(() =>
  import('./features/home/HomePage').then((m) => ({
    default: m.HomePage,
  }))
);

const LabsCataloguePage = lazyWithRetry(() =>
  import('./features/labs/LabsCataloguePage').then((m) => ({
    default: m.LabsCataloguePage,
  }))
);
const LabPlaceholderPage = lazyWithRetry(() =>
  import('./features/labs/LabPlaceholderPage').then((m) => ({
    default: m.LabPlaceholderPage,
  }))
);
const CpuSchedulingLabPage = lazyWithRetry(() =>
  import('./features/labs/lab02-cpu/CpuSchedulingLabPage').then((m) => ({
    default: m.CpuSchedulingLabPage,
  }))
);
const MemoryAllocationLabPage = lazyWithRetry(() =>
  import('./features/labs/lab05-memory/MemoryAllocationLabPage').then((m) => ({
    default: m.MemoryAllocationLabPage,
  }))
);
const PageReplacementLabPage = lazyWithRetry(() =>
  import('./features/labs/lab06-paging/PageReplacementLabPage').then((m) => ({
    default: m.PageReplacementLabPage,
  }))
);
const BankersLabPage = lazyWithRetry(() =>
  import('./features/labs/lab04-bankers/BankersLabPage').then((m) => ({
    default: m.BankersLabPage,
  }))
);
const SyncLabPage = lazyWithRetry(() =>
  import('./features/labs/lab03-sync/SyncLabPage').then((m) => ({
    default: m.SyncLabPage,
  }))
);
const DiskSchedulingLabPage = lazyWithRetry(() =>
  import('./features/labs/lab07-disk/DiskSchedulingLabPage').then((m) => ({
    default: m.DiskSchedulingLabPage,
  }))
);
const FileManagementLabPage = lazyWithRetry(() =>
  import('./features/labs/lab08-files/FileManagementLabPage').then((m) => ({
    default: m.FileManagementLabPage,
  }))
);
const LinuxTerminalLabPage = lazyWithRetry(() =>
  import('./features/labs/lab01-linux/LinuxTerminalLabPage').then((m) => ({
    default: m.LinuxTerminalLabPage,
  }))
);
const ExploreHubPage = lazyWithRetry(() =>
  import('./features/explore/ExploreHubPage').then((m) => ({
    default: m.ExploreHubPage,
  }))
);

function RouteLoadingFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 font-mono text-xs text-slate-600">
        Loading module…
      </div>
    </div>
  );
}

export function App() {
  const hydrate = useAppStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <BrowserRouter>
      <AppLayout>
        <LabErrorBoundary>
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/labs" element={<LabsCataloguePage />} />
              <Route path="/labs/cpu-scheduling" element={<CpuSchedulingLabPage />} />
              <Route path="/labs/memory-allocation" element={<MemoryAllocationLabPage />} />
              <Route path="/labs/page-replacement" element={<PageReplacementLabPage />} />
              <Route path="/labs/bankers-algorithm" element={<BankersLabPage />} />
              <Route path="/labs/synchronization" element={<SyncLabPage />} />
              <Route path="/labs/disk-scheduling" element={<DiskSchedulingLabPage />} />
              <Route path="/labs/file-management" element={<FileManagementLabPage />} />
              <Route path="/labs/linux-terminal" element={<LinuxTerminalLabPage />} />
              <Route path="/labs/:labId" element={<LabPlaceholderPage />} />
              <Route path="/explore" element={<ExploreHubPage />} />
              <Route path="/explore/:section" element={<ExploreHubPage />} />
              <Route path="*" element={<Navigate to="/labs" replace />} />
            </Routes>
          </Suspense>
        </LabErrorBoundary>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;
