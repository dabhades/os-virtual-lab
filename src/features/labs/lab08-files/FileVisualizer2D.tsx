import type { FileStepState } from '../../../engines/fileManagement/types';

export function FileVisualizer2D({ state }: { state: FileStepState | null }) {
  if (!state) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-subtle bg-canvas/50 text-sm text-slate-500">
        Configure disk allocation and file operations to visualize blocks and inodes.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-subtle bg-canvas/70 px-3 py-2 font-mono text-xs">
        <span>
          Last Op: <strong className="text-blue-600">{state.lastOpLabel}</strong>
        </span>
        {state.lastOutput && (
          <span className="truncate text-slate-700">{state.lastOutput}</span>
        )}
      </div>

      {/* Disk Block Map */}
      <div className="rounded-xl border border-subtle bg-canvas/80 p-3">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">
            Disk Blocks ({state.usedBlocks}/{state.diskBlocks.length} used)
          </span>
          <span className="font-mono text-[11px] text-slate-500">
            Bitmap: {state.freeBitmap.join('')}
          </span>
        </div>

        <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
          {state.diskBlocks.map((blk) => (
            <div
              key={blk.index}
              title={`Block #${blk.index}: ${blk.status}${blk.fileName ? ` (${blk.fileName})` : ''}`}
              className={`rounded-lg border p-1.5 text-center font-mono text-[10px] ${
                blk.status === 'FREE'
                  ? 'border-slate-200 bg-surface/40 text-slate-500'
                  : blk.status === 'INDEX'
                    ? 'border-amber-400 bg-amber-500/20 text-amber-800'
                    : 'border-blue-500/60 bg-blue-50 text-blue-800'
              }`}
            >
              <div className="text-[9px] opacity-70">#{blk.index}</div>
              <div className="truncate font-bold">
                {blk.status === 'FREE'
                  ? 'FREE'
                  : blk.status === 'INDEX'
                    ? `IDX:${blk.fileName}`
                    : blk.fileName}
              </div>
              {blk.nextBlock !== null && (
                <div className="text-[9px] text-emerald-700">
                  {blk.nextBlock === -1 ? '→EOF' : `→${blk.nextBlock}`}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Directory Entries & Inodes */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-subtle bg-canvas/70 p-3">
          <div className="mb-2 text-xs font-semibold text-slate-700">
            Directory ({state.directoryStructure})
          </div>
          {state.directories.length === 0 ? (
            <p className="text-xs text-slate-500">Empty directory.</p>
          ) : (
            <ul className="space-y-1 font-mono text-xs">
              {state.directories.map((d) => (
                <li
                  key={d.path}
                  className="flex items-center justify-between rounded bg-surface px-2 py-1"
                >
                  <span className="truncate text-blue-700">{d.path}</span>
                  <span className="text-[11px] text-slate-500">
                    Inode #{d.inodeId}
                    {d.isSharedLink ? ' (link)' : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-subtle bg-canvas/70 p-3">
          <div className="mb-2 text-xs font-semibold text-slate-700">
            Inodes / FCBs ({state.inodes.length}) & Open Files ({state.openFiles.length})
          </div>
          {state.inodes.length === 0 ? (
            <p className="text-xs text-slate-500">No active inodes.</p>
          ) : (
            <ul className="space-y-1 font-mono text-[11px]">
              {state.inodes.map((ino) => (
                <li
                  key={ino.inodeId}
                  className="rounded bg-surface px-2 py-1 text-slate-700"
                >
                  <span className="font-bold text-amber-700">#{ino.inodeId}</span>{' '}
                  ({ino.permissions}) links={ino.linkCount} blks=[
                  {ino.dataBlocks.join(',')}]
                  {ino.indexBlock !== null ? ` idx=${ino.indexBlock}` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
