/**
 * fileTree.ts
 * Converts a flat list of relative file paths into a nested tree structure
 * suitable for rendering in the file explorer sidebar.
 */

export interface FileTreeNode {
  /** Display name of this entry (the last segment of its path). */
  name: string;
  /** Full relative path from the project root (forward slashes). */
  path: string;
  /** 'file' or 'directory'. */
  type: 'file' | 'directory';
  /** File extension (only meaningful when type === 'file'). */
  extension?: string;
  /** Child nodes (only present when type === 'directory'). */
  children?: FileTreeNode[];
}

/**
 * Builds a nested tree from a sorted flat list of relative paths.
 *
 * @param relativePaths  e.g. ['app.js', 'models/User.js', 'utils/crypto.js']
 * @returns              Root-level nodes (children of the project root).
 */
export function buildFileTree(relativePaths: string[]): FileTreeNode[] {
  // Using a map from dirPath → children array for O(1) insertion.
  const dirMap = new Map<string, FileTreeNode[]>();

  // Root-level entries.
  const root: FileTreeNode[] = [];
  dirMap.set('', root);

  const getOrCreateDir = (dirPath: string): FileTreeNode[] => {
    if (dirMap.has(dirPath)) return dirMap.get(dirPath)!;

    // Ensure parent exists first.
    const parentPath = dirPath.includes('/')
      ? dirPath.slice(0, dirPath.lastIndexOf('/'))
      : '';
    const parentChildren = getOrCreateDir(parentPath);

    const dirName = dirPath.includes('/')
      ? dirPath.slice(dirPath.lastIndexOf('/') + 1)
      : dirPath;

    const dirNode: FileTreeNode = {
      name: dirName,
      path: dirPath,
      type: 'directory',
      children: [],
    };

    parentChildren.push(dirNode);
    dirMap.set(dirPath, dirNode.children!);
    return dirNode.children!;
  };

  for (const relPath of relativePaths) {
    const lastSlash = relPath.lastIndexOf('/');
    const dirPath = lastSlash >= 0 ? relPath.slice(0, lastSlash) : '';
    const fileName = lastSlash >= 0 ? relPath.slice(lastSlash + 1) : relPath;
    const ext = fileName.includes('.') ? '.' + fileName.split('.').pop()! : '';

    const parentChildren = getOrCreateDir(dirPath);
    parentChildren.push({
      name: fileName,
      path: relPath,
      type: 'file',
      extension: ext,
    });
  }

  // Sort each level: directories first, then files, both alphabetically.
  function sortNodes(nodes: FileTreeNode[]): void {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const node of nodes) {
      if (node.children) sortNodes(node.children);
    }
  }

  sortNodes(root);
  return root;
}
