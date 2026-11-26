import { Link } from 'react-router-dom';
import { LABS_CATALOGUE } from '../../data/labsCatalogue';
import { TopicPreview } from './TopicPreview';

export function LabsCataloguePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Operating Systems Simulators
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Choose a topic below to open its interactive simulator, step-by-step explainer, and report exporter.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {LABS_CATALOGUE.map((lab) => (
          <Link
            key={lab.id}
            to={lab.route}
            className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-400 hover:shadow-sm"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-slate-900 group-hover:text-blue-700">
                  {lab.title}
                </h2>
                <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  {lab.has3D ? '2D + 3D' : '2D'}
                </span>
              </div>

              <TopicPreview labId={lab.id} />

              <p className="text-xs leading-relaxed text-slate-600">
                {lab.description}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
              <span className="text-slate-400">~{lab.estimatedMinutes} min</span>
              <span className="font-medium text-blue-600 group-hover:underline">
                Try Simulator →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
