export type TreeLike = {
  id: string;
  parentId?: null | string;
  sortOrder?: number;
};

export type TreeNode<T extends TreeLike> = T & {
  children: Array<TreeNode<T>>;
  depth: number;
};

export type TreeFlatNode<T extends TreeLike> = {
  item: T;
  depth: number;
  hasChildren: boolean;
  isExpanded?: boolean;
};

export function buildTree<T extends TreeLike>(items: T[]): Array<TreeNode<T>> {
  const nodeById = new Map<string, TreeNode<T>>();
  const roots: Array<TreeNode<T>> = [];

  items.forEach((item) => {
    nodeById.set(item.id, { ...item, children: [], depth: 0 });
  });

  nodeById.forEach((node) => {
    const parentId = node.parentId ?? '';
    const parent = parentId ? nodeById.get(parentId) : undefined;

    if (parent) {
      node.depth = parent.depth + 1;
      parent.children.push(node);
      return;
    }

    roots.push(node);
  });

  sortNodes(roots);
  updateDepth(roots, 0);

  return roots;
}

export function flattenTree<T extends TreeLike>(
  items: T[],
): Array<TreeFlatNode<T>> {
  const result: Array<TreeFlatNode<T>> = [];

  function visit(nodes: Array<TreeNode<T>>) {
    nodes.forEach((node) => {
      result.push({
        depth: node.depth,
        hasChildren: node.children.length > 0,
        isExpanded: node.children.length > 0,
        item: node,
      });
      visit(node.children);
    });
  }

  visit(buildTree(items));

  return result;
}

export function flattenVisibleTree<T extends TreeLike>(
  items: T[],
  expandedNodeIds: ReadonlySet<string>,
): Array<TreeFlatNode<T>> {
  const result: Array<TreeFlatNode<T>> = [];

  function visit(nodes: Array<TreeNode<T>>) {
    nodes.forEach((node) => {
      const hasChildren = node.children.length > 0;
      const isExpanded = expandedNodeIds.has(node.id);

      result.push({
        depth: node.depth,
        hasChildren,
        isExpanded,
        item: node,
      });

      if (hasChildren && isExpanded) {
        visit(node.children);
      }
    });
  }

  visit(buildTree(items));

  return result;
}

function sortNodes<T extends TreeLike>(nodes: Array<TreeNode<T>>) {
  nodes.sort((a, b) => {
    const orderDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);

    if (orderDiff !== 0) {
      return orderDiff;
    }

    return a.id.localeCompare(b.id);
  });

  nodes.forEach((node) => sortNodes(node.children));
}

function updateDepth<T extends TreeLike>(
  nodes: Array<TreeNode<T>>,
  depth: number,
) {
  nodes.forEach((node) => {
    node.depth = depth;
    updateDepth(node.children, depth + 1);
  });
}

export function indentedTreeLabel(
  name: string,
  depth: number,
  hasChildren = false,
): string {
  const prefix = depth === 0 ? '' : `${'  '.repeat(depth)}└ `;
  const marker = hasChildren ? '▾ ' : depth === 0 ? '• ' : '';

  return `${prefix}${marker}${name}`;
}
