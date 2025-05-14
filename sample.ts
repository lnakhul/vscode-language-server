// src/hooks/useVcConsoleGridHooks.ts

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { SlickGrid, Column } from 'slickgrid-react';
import type { VsCodeApi } from '../components/VsCodeExtensionContext';

/**
 * Manages column widths and visibility state for VC Console.
 */
export function useVcConsoleColumns(
  vsCodeApi: VsCodeApi,
  gridId: string
) {
  // State for widths and hidden columns
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  // Refs to hold latest values for callbacks
  const allColumnsRef = useRef<Column[]>([]);
  const widthsRef = useRef<Record<string, number>>(columnWidths);
  const hiddenColsRef = useRef<string[]>(hiddenColumns);

  // Sync state into refs
  useEffect(() => { widthsRef.current = columnWidths; }, [columnWidths]);
  useEffect(() => { hiddenColsRef.current = hiddenColumns; }, [hiddenColumns]);

  // Load initial settings on mount
  useEffect(() => {
    let mounted = true;
    vsCodeApi.invoke('loadGridSettings', { gridId })
      .then((resp: any) => {
        if (!mounted) return;
        const { columnWidths: cw, hiddenColumns: hc } = resp.settings || {};
        if (cw) setColumnWidths(cw);
        if (hc) setHiddenColumns(hc);
      })
      .catch(console.error);
    return () => { mounted = false; };
  }, [vsCodeApi, gridId]);

  /**
   * Initialize grid with full definitions, applying saved widths & visibility.
   */
  const initializeColumns = useCallback(
    (grid: SlickGrid, initialDefs: Column[]) => {
      allColumnsRef.current = initialDefs;
      const visible = allColumnsRef.current
        .filter(col => !hiddenColsRef.current.includes(String(col.id)))
        .map(col => ({ ...col, width: columnWidths[col.id] ?? col.width }));
      grid.setColumns(visible);
    },
    [columnWidths]
  );

  /**
   * Handle column resize: persist widths + current hidden list, then reapply.
   */
  const handleResize = useCallback(
    (grid: SlickGrid) => {
      const cols = grid.getColumns();
      const updated: Record<string, number> = {};
      let changed = false;
      cols.forEach(col => {
        const w = col.width ?? col.minWidth ?? 0;
        updated[col.id] = w;
        if (Math.abs(w - (widthsRef.current[col.id] ?? 0)) > 1) {
          changed = true;
        }
      });
      if (!changed) return;

      setColumnWidths(updated);
      vsCodeApi.invoke('saveGridSettings', {
        gridId,
        settings: {
          columnWidths: updated,
          hiddenColumns: hiddenColsRef.current
        }
      });

      const visible = allColumnsRef.current
        .filter(col => !hiddenColsRef.current.includes(String(col.id)))
        .map(col => ({ ...col, width: updated[col.id] ?? col.width }));
      grid.setColumns(visible);
    },
    [vsCodeApi, gridId]
  );

  /**
   * Columns to render: filter out hidden, apply saved widths.
   */
  const visibleColumns = useMemo(
    () => allColumnsRef.current
      .filter(col => !hiddenColumns.includes(String(col.id)))
      .map(col => ({ ...col, width: columnWidths[col.id] ?? col.width })),
    [columnWidths, hiddenColumns]
  );

  /**
   * Preset columns format for SlickGrid options (columnId + width).
   */
  const presetColumns = useMemo(
    () => allColumnsRef.current
      .filter(col => !hiddenColumns.includes(String(col.id)))
      .map(col => ({ columnId: String(col.id), width: columnWidths[col.id] ?? col.width })),
    [columnWidths, hiddenColumns]
  );

  return {
    visibleColumns,
    presetColumns,
    initializeColumns,
    handleResize,
    setHiddenColumns,
    allColumnsRef,
    widthsRef,
    hiddenColsRef
  };
}

/**
 * Subscribes to GridMenu toggle events and persists visibility state.
 */
export function useVcConsoleGridMenu(
  gridRef: React.RefObject<SlickGrid>,
  allColumnsRef: React.MutableRefObject<Column[]>,
  widthsRef: React.MutableRefObject<Record<string, number>>,
  hiddenColsRef: React.MutableRefObject<string[]>,
  setHiddenColumns: React.Dispatch<React.SetStateAction<string[]>>,
  vsCodeApi: VsCodeApi,
  gridId: string
) {
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const gridMenu = grid.getPluginByName('gridMenu') as any;
    if (!gridMenu) return;

    const sub = gridMenu.onColumnsChanged.subscribe((_e: any, data: any) => {
      const visibleIds = data.columns.map((c: any) => c.columnId);
      const newHidden = allColumnsRef.current
        .map(col => String(col.id))
        .filter(id => !visibleIds.includes(id));

      setHiddenColumns(newHidden);
      vsCodeApi.invoke('saveGridSettings', {
        gridId,
        settings: {
          columnWidths: widthsRef.current,
          hiddenColumns: newHidden
        }
      });

      const visible = allColumnsRef.current
        .filter(col => !newHidden.includes(String(col.id)))
        .map(col => ({ ...col, width: widthsRef.current[col.id] ?? col.width }));
      grid.setColumns(visible);
    });

    return () => sub.unsubscribe?.();
  }, [gridRef, allColumnsRef, widthsRef, hiddenColsRef, setHiddenColumns, vsCodeApi, gridId]);
}
