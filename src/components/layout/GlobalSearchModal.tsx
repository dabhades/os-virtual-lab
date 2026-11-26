import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookMarked, FlaskConical, Search, X } from 'lucide-react';
import { useAppStore } from '../../core/useAppStore';
import { LABS_CATALOGUE } from '../../data/labsCatalogue';
import { OS_GLOSSARY } from '../../data/glossary';

interface SearchItem {
  id: string;
  kind: 'Lab' | 'Glossary';
  title: string;
  subtitle: string;
  route: string;
  keywords: string;
}

export function GlobalSearchModal() {
  const isOpen = useAppStore((s) => s.isSearchOpen);
  const setSearchOpen = useAppStore((s) => s.setSearchOpen);
  const [query, setQuery] = useState('');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const items = useMemo<SearchItem[]>(() => {
    const labs: SearchItem[] = LABS_CATALOGUE.map((lab) => ({
      id: `lab-${lab.id}`,
      kind: 'Lab',
      title: lab.title,
      subtitle: lab.description,
      route: lab.route,
      keywords: `${lab.title} ${lab.topics.join(' ')} ${lab.description}`.toLowerCase(),
    }));
    const glossary: SearchItem[] = OS_GLOSSARY.map((g) => ({
      id: `gloss-${g.term}`,
      kind: 'Glossary',
      title: g.term,
      subtitle: g.definition,
      route: '/explore',
      keywords: `${g.term} ${g.definition} ${g.category}`.toLowerCase(),
    }));
    return [...labs, ...glossary];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 8);
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.keywords.includes(q)
    );
  }, [items, query]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      if (!dialog.open) dialog.showModal();
      setQuery('');
      requestAnimationFrame(() => inputRef.current?.focus());
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleSelect = (route: string) => {
    setSearchOpen(false);
    navigate(route);
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={() => setSearchOpen(false)}
      onClick={(e) => {
        if (e.target === dialogRef.current) setSearchOpen(false);
      }}
      aria-label="Search labs and reference"
      className="m-auto w-[min(92vw,40rem)] rounded-xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/35"
    >
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
        <Search className="h-4 w-4 text-slate-500" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search labs, algorithms, commands, or glossary terms..."
          className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setSearchOpen(false)}
          aria-label="Close search"
          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            No matching labs or terms found for &ldquo;{query}&rdquo;.
          </p>
        ) : (
          <ul className="space-y-1">
            {filtered.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(item.route)}
                  className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none"
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                    {item.kind === 'Lab' ? (
                      <FlaskConical className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <BookMarked className="h-4 w-4" aria-hidden="true" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-slate-900">
                        {item.title}
                      </span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                        {item.kind}
                      </span>
                    </div>
                    <p className="truncate text-xs text-slate-500">
                      {item.subtitle}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </dialog>
  );
}
