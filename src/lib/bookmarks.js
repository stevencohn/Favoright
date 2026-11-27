export const PATH_SEPARATOR = ' › ';

/**
 * Flattens a chrome.bookmarks tree into a list of favorites, in tree order.
 * Each entry carries the folder path that leads to it.
 */
export function flattenFavorites(tree) {
  const favorites = [];

  const walk = (node, path) => {
    if (node.url !== undefined) {
      favorites.push({
        id: node.id,
        name: node.title,
        url: node.url,
        location: path.join(PATH_SEPARATOR),
        dateAdded: node.dateAdded ?? null,
        dateLastUsed: node.dateLastUsed ?? null,
      });
      return;
    }
    // The invisible root node has no parent and is left out of the path.
    const childPath = node.parentId === undefined ? path : [...path, node.title];
    for (const child of node.children ?? []) walk(child, childPath);
  };

  for (const root of tree) walk(root, []);
  return favorites;
}
