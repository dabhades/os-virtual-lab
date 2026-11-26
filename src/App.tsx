import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { LabErrorBoundary } from './components/common/LabErrorBoundary';
import { useAppStore } from './core/useAppStore';

const HomePage = lazy(() =>
  import('./features/home/HomePage').then((m) => ({
    default: m.HomePage,
  }))
);

const LabsCataloguePage = lazy(() =>
  import('./features/labs/LabsCataloguePage').then((m) => ({
    default: m.LabsCataloguePage,
  }))
);
const LabPlaceholderPage = lazy(() =>
  import('./features/labs/LabPlaceholderPage').then((m) => ({
    default: m.LabPlaceholderPage,
  }))
);
const CpuSchedulingLabPage = lazy(() =>
  import('./features/labs/lab02-cpu/CpuSchedulingLabPage').then((m) => ({
    default: m.CpuSchedulingLabPage,
  }))
);
const MemoryAllocationLabPage = lazy(() =>
  import('./features/labs/lab05-memory/MemoryAllocationLabPage').then((m) => ({
    default: m.MemoryAllocationLabPage,
  }))
);
const PageReplacementLabPage = lazy(() =>
  import('./features/labs/lab06-paging/PageReplacementLabPage').then((m) => ({
    default: m.PageReplacementLabPage,
  }))
);
const BankersLabPage = lazy(() =>
  import('./features/labs/lab04-bankers/BankersLabPage').then((m) => ({
    default: m.BankersLabPage,
  }))
);
const SyncLabPage = lazy(() =>
  import('./features/labs/lab03-sync/SyncLabPage').then((m) => ({
    default: m.SyncLabPage,
  }))
);
const DiskSchedulingLabPage = lazy(() =>
  import('./features/labs/lab07-disk/DiskSchedulingLabPage').then((m) => ({
    default: m.DiskSchedulingLabPage,
  }))
);
const FileManagementLabPage = lazy(() =>
  import('./features/labs/lab08-files/FileManagementLabPage').then((m) => ({
    default: m.FileManagementLabPage,
  }))
);
const LinuxTerminalLabPage = lazy(() =>
  import('./features/labs/lab01-linux/LinuxTerminalLabPage').then((m) => ({
    default: m.LinuxTerminalLabPage,
  }))
);
const ExploreHubPage = lazy(() =>
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
