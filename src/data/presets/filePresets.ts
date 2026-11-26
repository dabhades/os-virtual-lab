import type {
  AllocationMethod,
  DirectoryStructure,
  FileOperation,
} from '../../engines/fileManagement/types';

export interface FilePreset {
  id: string;
  name: string;
  allocationMethod: AllocationMethod;
  directoryStructure: DirectoryStructure;
  operations: FileOperation[];
}

export const FILE_PRESETS: FilePreset[] = [
  {
    id: 'contiguous-frag',
    name: 'Contiguous Allocation & External Fragmentation',
    allocationMethod: 'CONTIGUOUS',
    directoryStructure: 'TREE',
    operations: [
      { id: '1', type: 'CREATE', path: '/docs/a.txt', blocks: 6 },
      { id: '2', type: 'CREATE', path: '/docs/b.txt', blocks: 6 },
      { id: '3', type: 'CREATE', path: '/docs/c.txt', blocks: 6 },
      { id: '4', type: 'DELETE', path: '/docs/b.txt' },
      { id: '5', type: 'CREATE', path: '/docs/big.bin', blocks: 10 },
    ],
  },
  {
    id: 'indexed-tree',
    name: 'Indexed Allocation & File Operations',
    allocationMethod: 'INDEXED',
    directoryStructure: 'TREE',
    operations: [
      { id: '1', type: 'CREATE', path: '/os/kernel.c', blocks: 4, content: 'int main() {}' },
      { id: '2', type: 'OPEN', path: '/os/kernel.c' },
      { id: '3', type: 'APPEND', path: '/os/kernel.c', blocks: 2, content: '// v2' },
      { id: '4', type: 'READ', path: '/os/kernel.c' },
      { id: '5', type: 'COPY', path: '/os/kernel.c', targetPath: '/os/backup.c' },
    ],
  },
  {
    id: 'acyclic-sharing',
    name: 'Acyclic Graph Shared Links + Linked Allocation',
    allocationMethod: 'LINKED',
    directoryStructure: 'ACYCLIC_GRAPH',
    operations: [
      { id: '1', type: 'CREATE', path: '/alice/notes.md', blocks: 3 },
      { id: '2', type: 'SHARE_LINK', path: '/alice/notes.md', targetPath: '/bob/notes.md' },
      { id: '3', type: 'DELETE', path: '/alice/notes.md' },
      { id: '4', type: 'READ', path: '/bob/notes.md' },
    ],
  },
];
