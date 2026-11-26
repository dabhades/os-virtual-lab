export type AllocationMethod = 'CONTIGUOUS' | 'LINKED' | 'INDEXED';

export type DirectoryStructure =
  | 'SINGLE_LEVEL'
  | 'TWO_LEVEL'
  | 'TREE'
  | 'ACYCLIC_GRAPH';

export type FileOpType =
  | 'CREATE'
  | 'OPEN'
  | 'READ'
  | 'WRITE'
  | 'APPEND'
  | 'DELETE'
  | 'RENAME'
  | 'COPY'
  | 'MOVE'
  | 'SHARE_LINK';

export interface FileOperation {
  id: string;
  type: FileOpType;
  path: string;
  targetPath?: string;
  blocks?: number;
  content?: string;
}

export interface FileManagementInput {
  diskBlockCount: number;
  allocationMethod: AllocationMethod;
  directoryStructure: DirectoryStructure;
  operations: FileOperation[];
}

export interface DiskBlockCell {
  index: number;
  status: 'FREE' | 'DATA' | 'INDEX';
  inodeId: number | null;
  fileName: string | null;
  nextBlock: number | null; // For LINKED
}

export interface InodeRecord {
  inodeId: number;
  owner: string;
  permissions: string;
  sizeBlocks: number;
  linkCount: number;
  allocationMethod: AllocationMethod;
  indexBlock: number | null;
  dataBlocks: number[];
  content: string;
}

export interface DirectoryEntry {
  path: string;
  inodeId: number;
  isSharedLink: boolean;
}

export interface OpenFileEntry {
  fd: number;
  path: string;
  inodeId: number;
  mode: string;
}

export interface FileEvent {
  type: 'OP_OK' | 'OP_FAIL';
  op: FileOpType;
  detail: string;
}

export interface FileStepState {
  tick: number;
  allocationMethod: AllocationMethod;
  directoryStructure: DirectoryStructure;
  diskBlocks: DiskBlockCell[];
  freeBitmap: number[]; // 0 = free, 1 = used
  inodes: InodeRecord[];
  directories: DirectoryEntry[];
  openFiles: OpenFileEntry[];
  usedBlocks: number;
  freeBlocks: number;
  indexOverheadBlocks: number;
  lastOpLabel: string;
  lastOutput: string | null;
}

export interface FileManagementMetrics {
  allocationMethod: AllocationMethod;
  directoryStructure: DirectoryStructure;
  diskBlockCount: number;
  usedBlocks: number;
  freeBlocks: number;
  indexOverheadBlocks: number;
  fileCount: number;
  failedOps: number;
  [key: string]: unknown;
}
