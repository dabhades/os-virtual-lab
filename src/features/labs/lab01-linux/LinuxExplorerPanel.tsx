import { FileText, Folder, FolderOpen } from 'lucide-react';
import type { VfsNode } from '../../../engines/linux/types';

function TreeNode({
  node,
  path,
  cwd,
  depth,
  onSelectFile,
}: {
  node: VfsNode;
  path: string;
  cwd: string;
  depth: number;
  onSelectFile: (path: string, node: VfsNode) => void;
}) {
  const isCurrent = path === cwd;
  const children = node.children
    ? Object.values(node.children).sort((a, b) =>
        a.type === b.type
          ? a.name.localeCompare(b.name)
          : a.type === 'dir'
            ? -1
            : 1
      )
    : [];
  const defaultExpanded = depth <= 1 || cwd.startsWith(path === '/' ? '/' : `${path}/`);

  return (
    <div>
      <button
        type="button"
        onClick={() => onSelectFile(path, node)}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        className={`flex w-full items-center justify-between rounded-lg py-1 pr-2 text-left font-mono text-xs transition hover:bg-elevated ${
          isCurrent ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
        }`}
      >
        <span className="flex items-center gap-1.5 truncate">
          {node.type === 'dir' ? (
            isCurrent ? (
              <FolderOpen className="h-3.5 w-3.5 shrink-0 text-blue-600" aria-hidden="true" />
            ) : (
              <Folder className="h-3.5 w-3.5 shrink-0 text-amber-700" aria-hidden="true" />
            )
          ) : (
            <FileText className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
          )}
          <span className="truncate">{node.name}</span>
        </span>
        <span className="ml-2 shrink-0 text-[10px] text-slate-500">
          {node.permissions}
        </span>
      </button>

      {node.type === 'dir' &&
        defaultExpanded &&
        children.map((child) => {
          const childPath =
            path === '/' ? `/${child.name}` : `${path}/${child.name}`;
          return (
            <TreeNode
              key={childPath}
              node={child}
              path={childPath}
              cwd={cwd}
              depth={depth + 1}
              onSelectFile={onSelectFile}
            />
          );
        })}
    </div>
  );
}

export function LinuxExplorerPanel({
  root,
  cwd,
  selectedFile,
  onSelectFile,
}: {
  root: VfsNode;
  cwd: string;
  selectedFile: { path: string; node: VfsNode } | null;
  onSelectFile: (path: string, node: VfsNode) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-600">
          Live Virtual Filesystem
        </h2>
        <span className="font-mono text-[11px] text-slate-500">
          cwd: {cwd}
        </span>
      </div>

      <div className="max-h-64 overflow-y-auto rounded-xl border border-subtle bg-canvas/80 p-2">
        <TreeNode
          node={root}
          path="/"
          cwd={cwd}
          depth={0}
          onSelectFile={onSelectFile}
        />
      </div>

      {selectedFile && (
        <div className="rounded-xl border border-subtle bg-canvas/70 p-3 font-mono text-xs">
          <div className="mb-1 flex items-center justify-between text-blue-700">
            <span className="truncate font-semibold">{selectedFile.path}</span>
            <span className="text-[10px] text-slate-500">
              {selectedFile.node.owner} · {selectedFile.node.permissions}
            </span>
          </div>
          {selectedFile.node.type === 'file' ? (
            <pre className="max-h-24 overflow-y-auto whitespace-pre-wrap text-[11px] text-slate-700">
              {selectedFile.node.content || '(empty file)'}
            </pre>
          ) : (
            <p className="text-[11px] text-slate-500">
              Directory ({Object.keys(selectedFile.node.children ?? {}).length}{' '}
              entries)
            </p>
          )}
        </div>
      )}
    </div>
  );
}
