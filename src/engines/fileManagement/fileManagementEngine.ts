import type {
  SimulationEngine,
  SimulationResult,
  SimulationStep,
  ValidationResult,
} from '../../types/simulation';
import type {
  AllocationMethod,
  DirectoryEntry,
  DirectoryStructure,
  DiskBlockCell,
  FileEvent,
  FileManagementInput,
  FileManagementMetrics,
  FileStepState,
  InodeRecord,
  OpenFileEntry,
} from './types';

function validatePathForStructure(
  path: string,
  structure: DirectoryStructure
): string | null {
  const clean = path.trim();
  if (!clean.startsWith('/')) return 'Path must start with "/".';
  const parts = clean.split('/').filter(Boolean);
  if (parts.length === 0) return 'Path must include a filename.';

  if (structure === 'SINGLE_LEVEL' && parts.length > 1) {
    return 'Single-Level directory only supports files in root (e.g., /notes.txt).';
  }
  if (structure === 'TWO_LEVEL' && parts.length !== 2) {
    return 'Two-Level directory requires /user/filename (e.g., /alice/lab.txt).';
  }
  return null;
}

function allocateBlocks(
  disk: DiskBlockCell[],
  method: AllocationMethod,
  count: number,
  inodeId: number,
  fileName: string
): { ok: boolean; indexBlock: number | null; dataBlocks: number[]; reason: string } {
  const freeIndices = disk
    .filter((b) => b.status === 'FREE')
    .map((b) => b.index);

  if (method === 'CONTIGUOUS') {
    let runStart = -1;
    let runLen = 0;
    for (let i = 0; i < disk.length; i += 1) {
      if (disk[i].status === 'FREE') {
        if (runLen === 0) runStart = i;
        runLen += 1;
        if (runLen === count) {
          const dataBlocks: number[] = [];
          for (let k = runStart; k < runStart + count; k += 1) {
            disk[k] = {
              index: k,
              status: 'DATA',
              inodeId,
              fileName,
              nextBlock: null,
            };
            dataBlocks.push(k);
          }
          return {
            ok: true,
            indexBlock: null,
            dataBlocks,
            reason: `Allocated ${count} contiguous blocks [${runStart}..${runStart + count - 1}].`,
          };
        }
      } else {
        runLen = 0;
        runStart = -1;
      }
    }
    return {
      ok: false,
      indexBlock: null,
      dataBlocks: [],
      reason:
        freeIndices.length >= count
          ? `Contiguous allocation failed: ${freeIndices.length} free blocks exist, but no contiguous run of ${count} blocks is available (External Fragmentation).`
          : `Disk full: need ${count} blocks, only ${freeIndices.length} free.`,
    };
  }

  if (method === 'LINKED') {
    if (freeIndices.length < count) {
      return {
        ok: false,
        indexBlock: null,
        dataBlocks: [],
        reason: `Not enough free blocks (need ${count}, have ${freeIndices.length}).`,
      };
    }
    const chosen = freeIndices.slice(0, count);
    chosen.forEach((blkIdx, i) => {
      disk[blkIdx] = {
        index: blkIdx,
        status: 'DATA',
        inodeId,
        fileName,
        nextBlock: i < chosen.length - 1 ? chosen[i + 1] : -1,
      };
    });
    return {
      ok: true,
      indexBlock: null,
      dataBlocks: chosen,
      reason: `Linked blocks: ${chosen.join(' → ')} → EOF.`,
    };
  }

  // INDEXED: needs 1 index block + `count` data blocks
  if (freeIndices.length < count + 1) {
    return {
      ok: false,
      indexBlock: null,
      dataBlocks: [],
      reason: `Indexed allocation needs ${count + 1} blocks (1 index + ${count} data), only ${freeIndices.length} free.`,
    };
  }
  const indexBlock = freeIndices[0];
  const dataBlocks = freeIndices.slice(1, count + 1);
  disk[indexBlock] = {
    index: indexBlock,
    status: 'INDEX',
    inodeId,
    fileName,
    nextBlock: null,
  };
  dataBlocks.forEach((blkIdx) => {
    disk[blkIdx] = {
      index: blkIdx,
      status: 'DATA',
      inodeId,
      fileName,
      nextBlock: null,
    };
  });
  return {
    ok: true,
    indexBlock,
    dataBlocks,
    reason: `Allocated Index Block #${indexBlock} pointing to data blocks [${dataBlocks.join(', ')}].`,
  };
}

function freeInodeBlocks(disk: DiskBlockCell[], inode: InodeRecord): void {
  if (inode.indexBlock !== null) {
    disk[inode.indexBlock] = {
      index: inode.indexBlock,
      status: 'FREE',
      inodeId: null,
      fileName: null,
      nextBlock: null,
    };
  }
  for (const b of inode.dataBlocks) {
    disk[b] = {
      index: b,
      status: 'FREE',
      inodeId: null,
      fileName: null,
      nextBlock: null,
    };
  }
}

export const fileManagementEngine: SimulationEngine<
  FileManagementInput,
  FileStepState,
  FileEvent,
  FileManagementMetrics
> = {
  validate(input: FileManagementInput): ValidationResult {
    const errors: string[] = [];
    if (input.diskBlockCount < 8 || input.diskBlockCount > 64) {
      errors.push('Disk block count must be between 8 and 64.');
    }
    if (!input.operations || input.operations.length === 0) {
      errors.push('Add at least one file operation.');
    }
    return { valid: errors.length === 0, errors };
  },

  run(
    input: FileManagementInput
  ): SimulationResult<FileStepState, FileEvent, FileManagementMetrics> {
    const disk: DiskBlockCell[] = Array.from(
      { length: input.diskBlockCount },
      (_, index) => ({
        index,
        status: 'FREE',
        inodeId: null,
        fileName: null,
        nextBlock: null,
      })
    );

    const inodes = new Map<number, InodeRecord>();
    let directories: DirectoryEntry[] = [];
    let openFiles: OpenFileEntry[] = [];
    let nextInodeId = 100;
    let nextFd = 3;
    let failedOps = 0;

    const steps: SimulationStep<FileStepState, FileEvent>[] = [];

    const pushStep = (
      tick: number,
      label: string,
      lastOutput: string | null,
      events: FileEvent[],
      whatHappened: string,
      whyItHappened: string,
      whichRule: string,
      whatNext: string,
      remember: string
    ) => {
      const freeBitmap = disk.map((b) => (b.status === 'FREE' ? 0 : 1));
      const usedBlocks = freeBitmap.reduce<number>((a, b) => a + b, 0);
      const indexOverheadBlocks = disk.filter((b) => b.status === 'INDEX').length;

      steps.push({
        stepIndex: steps.length,
        tick,
        state: {
          tick,
          allocationMethod: input.allocationMethod,
          directoryStructure: input.directoryStructure,
          diskBlocks: disk.map((b) => ({ ...b })),
          freeBitmap,
          inodes: Array.from(inodes.values()).map((i) => ({
            ...i,
            dataBlocks: [...i.dataBlocks],
          })),
          directories: directories.map((d) => ({ ...d })),
          openFiles: openFiles.map((o) => ({ ...o })),
          usedBlocks,
          freeBlocks: input.diskBlockCount - usedBlocks,
          indexOverheadBlocks,
          lastOpLabel: label,
          lastOutput,
        },
        events,
        explanation: {
          whatHappened,
          whyItHappened,
          whichRule,
          whatNext,
          remember,
        },
      });
    };

    pushStep(
      0,
      'Format Disk',
      null,
      [],
      `Formatted ${input.diskBlockCount}-block disk with ${input.allocationMethod} allocation and ${input.directoryStructure} directory.`,
      'Disk starts empty with all free-space bitmap bits set to 0.',
      `${input.allocationMethod} + ${input.directoryStructure}.`,
      'Execute the first file operation.',
      'Inodes store file metadata and block pointers separately from directory names.'
    );

    input.operations.forEach((op, idx) => {
      const tick = idx + 1;
      const pathErr = validatePathForStructure(op.path, input.directoryStructure);
      if (pathErr) {
        failedOps += 1;
        pushStep(
          tick,
          `${op.type} ${op.path} — ERROR`,
          pathErr,
          [{ type: 'OP_FAIL', op: op.type, detail: pathErr }],
          `Operation ${op.type} on "${op.path}" rejected.`,
          pathErr,
          `${input.directoryStructure} path rules.`,
          'Use a path matching the active directory structure.',
          'Directory structures control how filenames map to hierarchy.'
        );
        return;
      }

      const findEntry = (p: string) =>
        directories.find((d) => d.path === p);

      switch (op.type) {
        case 'CREATE': {
          if (findEntry(op.path)) {
            failedOps += 1;
            const msg = `File "${op.path}" already exists (name collision).`;
            pushStep(
              tick,
              `CREATE ${op.path} — FAIL`,
              msg,
              [{ type: 'OP_FAIL', op: 'CREATE', detail: msg }],
              msg,
              'Duplicate filenames are disallowed in the same directory.',
              'Unique path per directory entry.',
              'Choose another name or switch to Two-Level/Tree directory.',
              'Single-level directories suffer from global name collisions.'
            );
            return;
          }

          const sizeBlocks = Math.max(1, op.blocks ?? 2);
          const inodeId = nextInodeId++;
          const fileName = op.path.split('/').pop() ?? op.path;
          const alloc = allocateBlocks(
            disk,
            input.allocationMethod,
            sizeBlocks,
            inodeId,
            fileName
          );
          if (!alloc.ok) {
            failedOps += 1;
            pushStep(
              tick,
              `CREATE ${op.path} — FAIL`,
              alloc.reason,
              [{ type: 'OP_FAIL', op: 'CREATE', detail: alloc.reason }],
              `Failed to create "${op.path}" (${sizeBlocks} blocks).`,
              alloc.reason,
              `${input.allocationMethod} allocation rule.`,
              'Delete files or use Linked/Indexed allocation.',
              'Contiguous allocation can fail due to external fragmentation even when enough total free blocks exist.'
            );
            return;
          }

          const owner =
            input.directoryStructure === 'TWO_LEVEL'
              ? op.path.split('/').filter(Boolean)[0]
              : 'student';

          inodes.set(inodeId, {
            inodeId,
            owner,
            permissions: 'rw-r--r--',
            sizeBlocks,
            linkCount: 1,
            allocationMethod: input.allocationMethod,
            indexBlock: alloc.indexBlock,
            dataBlocks: alloc.dataBlocks,
            content: op.content ?? `Data of ${fileName}`,
          });
          directories.push({ path: op.path, inodeId, isSharedLink: false });

          pushStep(
            tick,
            `CREATE ${op.path} (${sizeBlocks}B)`,
            alloc.reason,
            [{ type: 'OP_OK', op: 'CREATE', detail: alloc.reason }],
            `Created "${op.path}" (Inode #${inodeId}). ${alloc.reason}`,
            'Free Space Bitmap updated and directory entry linked to new Inode.',
            `${input.allocationMethod} allocation.`,
            'File is ready to be opened, read, or appended.',
            'Every file gets an Inode/FCB storing its block pointers.'
          );
          break;
        }

        case 'OPEN': {
          const entry = findEntry(op.path);
          if (!entry) {
            failedOps += 1;
            pushStep(
              tick,
              `OPEN ${op.path} — FAIL`,
              'File not found.',
              [{ type: 'OP_FAIL', op: 'OPEN', detail: 'File not found.' }],
              `Cannot open "${op.path}": not found.`,
              'No directory entry matches this path.',
              'open() requires an existing file.',
              'Create the file first.',
              'The Open File Table caches active FCBs in kernel memory.'
            );
            return;
          }
          const fd = nextFd++;
          openFiles.push({ fd, path: op.path, inodeId: entry.inodeId, mode: 'r/w' });
          pushStep(
            tick,
            `OPEN ${op.path} (fd=${fd})`,
            `Opened fd=${fd} -> Inode #${entry.inodeId}`,
            [{ type: 'OP_OK', op: 'OPEN', detail: `Opened fd=${fd}` }],
            `Opened "${op.path}" with file descriptor fd=${fd}.`,
            'Kernel added entry to Open File Table.',
            'open() returns a per-process file descriptor.',
            'Read or write using the open file.',
            'Open File Tables avoid repeated directory lookups.'
          );
          break;
        }

        case 'READ': {
          const entry = findEntry(op.path);
          if (!entry) {
            failedOps += 1;
            pushStep(
              tick,
              `READ ${op.path} — FAIL`,
              'File not found.',
              [{ type: 'OP_FAIL', op: 'READ', detail: 'File not found.' }],
              `Read failed: "${op.path}" does not exist.`,
              'Missing directory entry.',
              'read() follows block pointers in Inode.',
              'Create the file first.',
              'Linked allocation requires sequential pointer traversal for random reads.'
            );
            return;
          }
          const inode = inodes.get(entry.inodeId)!;
          pushStep(
            tick,
            `READ ${op.path}`,
            inode.content,
            [{ type: 'OP_OK', op: 'READ', detail: `Read ${inode.dataBlocks.length} blocks.` }],
            `Read "${op.path}" across blocks [${inode.dataBlocks.join(', ')}]: "${inode.content}".`,
            'Followed Inode block pointers to read data blocks.',
            `${input.allocationMethod} block traversal.`,
            'Proceed to next operation.',
            'Contiguous and Indexed allocation support fast direct/random access.'
          );
          break;
        }

        case 'WRITE':
        case 'APPEND': {
          const entry = findEntry(op.path);
          if (!entry) {
            failedOps += 1;
            pushStep(
              tick,
              `${op.type} ${op.path} — FAIL`,
              'File not found.',
              [{ type: 'OP_FAIL', op: op.type, detail: 'File not found.' }],
              `${op.type} failed: "${op.path}" does not exist.`,
              'Target file missing.',
              'File must exist before writing/appending.',
              'Create the file first.',
              'Appending in Contiguous allocation may fail if adjacent blocks are occupied.'
            );
            return;
          }
          const inode = inodes.get(entry.inodeId)!;
          const extraBlocks = Math.max(0, op.blocks ?? 1);
          if (extraBlocks > 0) {
            if (input.allocationMethod === 'CONTIGUOUS') {
              const lastBlk = inode.dataBlocks[inode.dataBlocks.length - 1];
              const canExtend = Array.from(
                { length: extraBlocks },
                (_, k) => lastBlk + 1 + k
              ).every((idx) => idx < disk.length && disk[idx].status === 'FREE');

              if (!canExtend) {
                failedOps += 1;
                const msg = `Cannot append ${extraBlocks} block(s) contiguously after block ${lastBlk}.`;
                pushStep(
                  tick,
                  `${op.type} ${op.path} — FAIL`,
                  msg,
                  [{ type: 'OP_FAIL', op: op.type, detail: msg }],
                  msg,
                  'Contiguous files cannot grow if the immediately following block is occupied.',
                  'Contiguous growth constraint.',
                  'Linked or Indexed allocation allows easy file growth.',
                  'Difficulty growing files is a major drawback of Contiguous allocation.'
                );
                return;
              }
              const fileName = op.path.split('/').pop() ?? op.path;
              for (let k = 1; k <= extraBlocks; k += 1) {
                const idx = lastBlk + k;
                disk[idx] = {
                  index: idx,
                  status: 'DATA',
                  inodeId: inode.inodeId,
                  fileName,
                  nextBlock: null,
                };
                inode.dataBlocks.push(idx);
              }
            } else {
              const freeIndices = disk
                .filter((b) => b.status === 'FREE')
                .map((b) => b.index);
              if (freeIndices.length < extraBlocks) {
                failedOps += 1;
                pushStep(
                  tick,
                  `${op.type} ${op.path} — FAIL`,
                  'Not enough free blocks.',
                  [{ type: 'OP_FAIL', op: op.type, detail: 'Disk full.' }],
                  `Failed to append ${extraBlocks} block(s) to "${op.path}".`,
                  'Insufficient free blocks.',
                  'Free space check.',
                  'Delete unused files.',
                  'Linked and Indexed files can grow into any free block.'
                );
                return;
              }
              const added = freeIndices.slice(0, extraBlocks);
              const fileName = op.path.split('/').pop() ?? op.path;
              if (input.allocationMethod === 'LINKED') {
                const prevLast = inode.dataBlocks[inode.dataBlocks.length - 1];
                disk[prevLast].nextBlock = added[0];
                added.forEach((blkIdx, i) => {
                  disk[blkIdx] = {
                    index: blkIdx,
                    status: 'DATA',
                    inodeId: inode.inodeId,
                    fileName,
                    nextBlock: i < added.length - 1 ? added[i + 1] : -1,
                  };
                  inode.dataBlocks.push(blkIdx);
                });
              } else {
                added.forEach((blkIdx) => {
                  disk[blkIdx] = {
                    index: blkIdx,
                    status: 'DATA',
                    inodeId: inode.inodeId,
                    fileName,
                    nextBlock: null,
                  };
                  inode.dataBlocks.push(blkIdx);
                });
              }
            }
            inode.sizeBlocks += extraBlocks;
          }
          if (op.content) {
            inode.content =
              op.type === 'APPEND'
                ? `${inode.content} ${op.content}`
                : op.content;
          }

          pushStep(
            tick,
            `${op.type} ${op.path}`,
            `Size=${inode.sizeBlocks} blocks`,
            [{ type: 'OP_OK', op: op.type, detail: `Updated ${op.path}` }],
            `${op.type} succeeded on "${op.path}" (now ${inode.sizeBlocks} blocks).`,
            'Allocated extra data blocks and updated Inode metadata.',
            `${input.allocationMethod} growth.`,
            'Proceed to next operation.',
            'Linked & Indexed allocation grow files dynamically without relocation.'
          );
          break;
        }

        case 'DELETE': {
          const entry = findEntry(op.path);
          if (!entry) {
            failedOps += 1;
            pushStep(
              tick,
              `DELETE ${op.path} — FAIL`,
              'File not found.',
              [{ type: 'OP_FAIL', op: 'DELETE', detail: 'Not found.' }],
              `Delete failed: "${op.path}" not found.`,
              'No matching directory entry.',
              'unlink() requires existing path.',
              'Check file path.',
              'Deleting removes the directory link first.'
            );
            return;
          }
          directories = directories.filter((d) => d.path !== op.path);
          openFiles = openFiles.filter((o) => o.path !== op.path);
          const inode = inodes.get(entry.inodeId)!;
          inode.linkCount -= 1;

          if (inode.linkCount <= 0) {
            freeInodeBlocks(disk, inode);
            inodes.delete(entry.inodeId);
          }

          pushStep(
            tick,
            `DELETE ${op.path}`,
            inode.linkCount > 0
              ? `Link removed; ${inode.linkCount} link(s) remain.`
              : `Freed ${inode.dataBlocks.length} data blocks.`,
            [{ type: 'OP_OK', op: 'DELETE', detail: `Deleted ${op.path}` }],
            inode.linkCount > 0
              ? `Removed link "${op.path}" (Inode #${inode.inodeId} still has ${inode.linkCount} link(s), blocks kept).`
              : `Deleted "${op.path}" and freed Inode #${inode.inodeId} blocks.`,
            inode.linkCount > 0
              ? 'Acyclic Graph shared files only free disk blocks when linkCount reaches 0.'
              : 'linkCount reached 0, so bitmap bits were cleared.',
            'Reference-counted deletion.',
            'Free blocks are now available for new files.',
            'In Acyclic Graph directories, deleting one shared link leaves the file intact for other links.'
          );
          break;
        }

        case 'RENAME':
        case 'MOVE': {
          const target = op.targetPath?.trim();
          const entry = findEntry(op.path);
          if (!entry || !target) {
            failedOps += 1;
            pushStep(
              tick,
              `${op.type} ${op.path} — FAIL`,
              'Invalid source or target.',
              [{ type: 'OP_FAIL', op: op.type, detail: 'Invalid path.' }],
              `${op.type} failed.`,
              'Source missing or target path empty.',
              'Directory entry update.',
              'Provide valid source and target.',
              'Rename/Move updates directory entries without moving data blocks on disk!'
            );
            return;
          }
          entry.path = target;
          const newName = target.split('/').pop() ?? target;
          const inode = inodes.get(entry.inodeId)!;
          inode.dataBlocks.forEach((b) => {
            disk[b].fileName = newName;
          });
          if (inode.indexBlock !== null) {
            disk[inode.indexBlock].fileName = newName;
          }
          pushStep(
            tick,
            `${op.type} → ${target}`,
            `Inode #${entry.inodeId} kept same disk blocks.`,
            [{ type: 'OP_OK', op: op.type, detail: `Moved to ${target}` }],
            `${op.type} "${op.path}" → "${target}" (Inode #${entry.inodeId} unchanged).`,
            'Only the directory entry string changed; data blocks stayed in place.',
            'Metadata-only directory update.',
            'Proceed to next operation.',
            'Renaming or moving a file on the same filesystem is O(1) because data blocks are not copied.'
          );
          break;
        }

        case 'COPY': {
          const target = op.targetPath?.trim();
          const entry = findEntry(op.path);
          if (!entry || !target || findEntry(target)) {
            failedOps += 1;
            pushStep(
              tick,
              `COPY ${op.path} — FAIL`,
              'Invalid source or target already exists.',
              [{ type: 'OP_FAIL', op: 'COPY', detail: 'Copy failed.' }],
              `Copy failed for "${op.path}".`,
              'Source missing or destination exists.',
              'copy() creates an independent Inode and data blocks.',
              'Check paths.',
              'Unlike links, Copy duplicates disk blocks.'
            );
            return;
          }
          const srcInode = inodes.get(entry.inodeId)!;
          const newInodeId = nextInodeId++;
          const newName = target.split('/').pop() ?? target;
          const alloc = allocateBlocks(
            disk,
            input.allocationMethod,
            srcInode.sizeBlocks,
            newInodeId,
            newName
          );
          if (!alloc.ok) {
            failedOps += 1;
            pushStep(
              tick,
              `COPY ${op.path} — FAIL`,
              alloc.reason,
              [{ type: 'OP_FAIL', op: 'COPY', detail: alloc.reason }],
              `Copy failed: ${alloc.reason}`,
              'Not enough disk space for duplicate blocks.',
              `${input.allocationMethod} allocation.`,
              'Free space first.',
              'Copying allocates new blocks, unlike hard links.'
            );
            return;
          }
          inodes.set(newInodeId, {
            ...srcInode,
            inodeId: newInodeId,
            linkCount: 1,
            indexBlock: alloc.indexBlock,
            dataBlocks: alloc.dataBlocks,
          });
          directories.push({ path: target, inodeId: newInodeId, isSharedLink: false });
          pushStep(
            tick,
            `COPY → ${target}`,
            alloc.reason,
            [{ type: 'OP_OK', op: 'COPY', detail: `Copied to ${target}` }],
            `Copied "${op.path}" to "${target}" (new Inode #${newInodeId}).`,
            'Allocated new data blocks and copied file content.',
            'Independent file duplication.',
            'Proceed to next operation.',
            'Copy doubles disk usage; Share Link shares the same Inode.'
          );
          break;
        }

        case 'SHARE_LINK': {
          const target = op.targetPath?.trim();
          const entry = findEntry(op.path);
          if (input.directoryStructure !== 'ACYCLIC_GRAPH') {
            failedOps += 1;
            pushStep(
              tick,
              `LINK ${op.path} — FAIL`,
              'Requires Acyclic Graph directory.',
              [{ type: 'OP_FAIL', op: 'SHARE_LINK', detail: 'Needs Acyclic Graph.' }],
              'Shared links are only supported in Acyclic Graph directory mode.',
              'Trees do not allow shared files across branches.',
              'Acyclic Graph sharing.',
              'Switch directory structure to ACYCLIC_GRAPH.',
              'Acyclic graphs allow multiple directory paths to point to one Inode.'
            );
            return;
          }
          if (!entry || !target || findEntry(target)) {
            failedOps += 1;
            pushStep(
              tick,
              `LINK ${op.path} — FAIL`,
              'Invalid source or target exists.',
              [{ type: 'OP_FAIL', op: 'SHARE_LINK', detail: 'Link failed.' }],
              'Shared link creation failed.',
              'Source missing or target already exists.',
              'Hard link rule.',
              'Check paths.',
              'Hard links increment Inode linkCount.'
            );
            return;
          }
          const inode = inodes.get(entry.inodeId)!;
          inode.linkCount += 1;
          directories.push({ path: target, inodeId: entry.inodeId, isSharedLink: true });
          pushStep(
            tick,
            `LINK → ${target}`,
            `Inode #${entry.inodeId} linkCount=${inode.linkCount}`,
            [{ type: 'OP_OK', op: 'SHARE_LINK', detail: `Linked ${target}` }],
            `Created shared link "${target}" → Inode #${entry.inodeId} (linkCount=${inode.linkCount}).`,
            'Both paths now share the exact same Inode and disk blocks.',
            'Acyclic Graph hard link.',
            'Deleting one path will leave the other intact.',
            'Sharing avoids duplicating disk blocks.'
          );
          break;
        }
      }
    });

    const usedBlocks = disk.filter((b) => b.status !== 'FREE').length;
    const indexOverheadBlocks = disk.filter((b) => b.status === 'INDEX').length;

    return {
      steps,
      finalMetrics: {
        allocationMethod: input.allocationMethod,
        directoryStructure: input.directoryStructure,
        diskBlockCount: input.diskBlockCount,
        usedBlocks,
        freeBlocks: input.diskBlockCount - usedBlocks,
        indexOverheadBlocks,
        fileCount: inodes.size,
        failedOps,
      },
    };
  },
};
