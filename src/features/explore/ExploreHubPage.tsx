import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookMarked, Calculator, Compass, Search } from 'lucide-react';
import { OS_FORMULAS, OS_GLOSSARY } from '../../data/glossary';
import { LABS_CATALOGUE } from '../../data/labsCatalogue';

type Tab = 'concepts' | 'glossary' | 'formulas';

export function ExploreHubPage() {
  const [tab, setTab] = useState<Tab>('glossary');
  const [query, setQuery] = useState('');

  const filteredGlossary = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return OS_GLOSSARY;
    return OS_GLOSSARY.filter(
      (g) =>
        g.term.toLowerCase().includes(q) ||
        g.definition.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-blue-600">
            Reference Hub
          </span>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Concepts, Glossary & Formulas
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Quick reference for OS terminology, exam formulas, and subsystem maps.
          </p>
        </div>

        <div className="inline-flex rounded-xl border border-subtle bg-surface p-1">
          <button
            type="button"
            onClick={() => setTab('glossary')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
              tab === 'glossary'
                ? 'bg-blue-600 text-slate-900'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <BookMarked className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Glossary</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('formulas')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
              tab === 'formulas'
                ? 'bg-blue-600 text-slate-900'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <Calculator className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Formulas</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('concepts')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
              tab === 'concepts'
                ? 'bg-blue-600 text-slate-900'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <Compass className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Concept Map</span>
          </button>
        </div>
      </div>

      {tab === 'glossary' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl border border-subtle bg-surface px-3 py-2">
            <Search className="h-4 w-4 text-blue-600" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter glossary terms (e.g., Semaphore, Belady, Inode)..."
              className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredGlossary.map((entry) => (
              <div
                key={entry.term}
                className="rounded-2xl border border-subtle bg-surface p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-semibold text-slate-900">{entry.term}</h2>
                  <span className="rounded bg-canvas px-2 py-0.5 font-mono text-[10px] text-blue-600">
                    {entry.category}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-700">
                  {entry.definition}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'formulas' && (
        <div className="grid gap-4 sm:grid-cols-2">
          {OS_FORMULAS.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-subtle bg-surface p-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">{f.title}</h2>
                <span className="font-mono text-[11px] text-blue-600">
                  {f.lab}
                </span>
              </div>
              <div className="mt-3 rounded-xl border border-subtle bg-canvas px-3 py-2.5 font-mono text-xs font-semibold text-emerald-700">
                {f.formula}
              </div>
              <p className="mt-2 text-xs text-slate-500">{f.note}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'concepts' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LABS_CATALOGUE.map((lab) => (
            <Link
              key={lab.id}
              to={lab.route}
              className="rounded-2xl border border-subtle bg-surface p-5 transition hover:border-blue-300"
            >
              <h2 className="text-base font-semibold text-slate-900">
                {lab.title}
              </h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {lab.topics.map((t) => (
                  <span
                    key={t}
                    className="rounded bg-canvas px-2 py-0.5 font-mono text-[11px] text-slate-700"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
