import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FlaskConical } from 'lucide-react';
import { LABS_CATALOGUE } from '../../data/labsCatalogue';
import { useAppStore } from '../../core/useAppStore';

export function LabPlaceholderPage() {
  const { labId } = useParams();
  const recordLastVisited = useAppStore((s) => s.recordLastVisited);
  const lab = LABS_CATALOGUE.find((item) => item.id === labId);

  useEffect(() => {
    if (lab) {
      recordLastVisited(lab.route, `${lab.number}: ${lab.title}`);
    }
  }, [lab, recordLastVisited]);

  if (!lab) {
    return (
      <div className="rounded-2xl border border-subtle bg-surface p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">Laboratory Not Found</h1>
        <Link
          to="/labs"
          className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
        >
          ← Back to Practical Catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            to="/labs"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Back to Labs</span>
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            {lab.number}: {lab.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{lab.description}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-blue-200 bg-surface p-8 text-center">
        <FlaskConical className="mx-auto mb-3 h-10 w-10 text-blue-600" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-slate-900">
          Simulator Scheduled in Roadmap
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
          This simulator module ({lab.title}) is not yet available. Select another topic from the Simulators page.
        </p>
      </div>
    </div>
  );
}
