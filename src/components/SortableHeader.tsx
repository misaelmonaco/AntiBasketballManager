import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

export type SortDir = 'asc' | 'desc';

export function nextSortState<K extends string>(
  currentKey: K,
  currentDir: SortDir,
  clickedKey: K,
  defaultDescKeys: readonly K[] = []
): { key: K; dir: SortDir } {
  if (currentKey === clickedKey) {
    return { key: clickedKey, dir: currentDir === 'asc' ? 'desc' : 'asc' };
  }
  return {
    key: clickedKey,
    dir: defaultDescKeys.includes(clickedKey) ? 'desc' : 'asc',
  };
}

interface SortableThProps<K extends string> {
  label: string;
  sortKey: K;
  activeKey: K;
  sortDir: SortDir;
  onSort: (key: K) => void;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export function SortableTh<K extends string>({
  label,
  sortKey,
  activeKey,
  sortDir,
  onSort,
  align = 'left',
  className = '',
}: SortableThProps<K>) {
  const isActive = activeKey === sortKey;
  const justify =
    align === 'center'
      ? 'justify-center'
      : align === 'right'
        ? 'justify-end'
        : 'justify-start';

  return (
    <th className={`select-none ${className}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 w-full ${justify} hover:text-orange-400 transition-colors cursor-pointer ${
          isActive ? 'text-orange-400 font-bold' : ''
        }`}
      >
        <span>{label}</span>
        {isActive ? (
          sortDir === 'asc' ? (
            <ArrowUp className="w-3 h-3 shrink-0" />
          ) : (
            <ArrowDown className="w-3 h-3 shrink-0" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 shrink-0 opacity-40" />
        )}
      </button>
    </th>
  );
}
