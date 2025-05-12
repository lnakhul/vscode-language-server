// ─────────────────────────────────────────────────────────────────────────────
// outside of your component (either at the bottom of vcconsole.tsx or in a
// shared/hooks.ts file), define:

import { useRef, useEffect, MutableRefObject } from 'react';
import type { SlickGrid, Column } from 'slickgrid-react';

export function useSyncedRef<T>(value: T): MutableRefObject<T> {
  const ref = useRef<T>(value);
  useEffect(() => { ref.current = value }, [value]);
  return ref;
}

export function useGridColumnsApplier(
  gridRef: MutableRefObject<SlickGrid | null>,
  allColsRef: MutableRefObject<Column[]>,
  columnWidths: Record<string,number>,
  hiddenColumns: string[]
) {
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    // derive only the visible, resized columns
    const visible = allColsRef.current
      .filter(col => !hiddenColumns.includes(String(col.id)))
      .map(col => ({
        ...col,
        width: columnWidths[col.id] ?? col.width
      }));
    grid.setColumns(visible);
  }, [gridRef, allColsRef, columnWidths, hiddenColumns]);
}
// ─────────────────────────────────────────────────────────────────────────────
