// hooks/useGridMenuPersistence.tsx
import { useEffect } from "react";
import type { SlickGrid } from "slickgrid-react";

export function useGridMenuPersistence(
  gridRef: React.MutableRefObject<SlickGrid | null>,
  allColsRef: React.MutableRefObject<Column[]>,
  widthsRef: React.MutableRefObject<Record<string,number>>,
  hiddenColsRef: React.MutableRefObject<string[]>,
  setHiddenColumns: React.Dispatch<React.SetStateAction<string[]>>,
  vsCodeApi: VsCodeApi
) {
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const gridMenu = grid.getPluginByName("gridMenu") as any;
    if (!gridMenu) return;

    const sub = gridMenu.onColumnsChanged.subscribe((_e: any, data: any) => {
      const visible = data.columns.map((c: any) => c.columnId);
      const newHidden = allColsRef.current
        .map(c => String(c.id))
        .filter(id => !visible.includes(id));

      setHiddenColumns(newHidden);
      vsCodeApi.invoke("saveGridSettings", {
        gridId: "vcconsole",
        settings: {
          columnWidths: widthsRef.current,
          hiddenColumns: newHidden
        }
      });

      const visibleDefs = allColsRef.current
        .filter(col => !newHidden.includes(String(col.id)))
        .map(col => ({
          ...col,
          width: widthsRef.current[col.id] ?? col.width
        }));
      grid.setColumns(visibleDefs);
    });

    return () => sub.unsubscribe?.();
  }, [
    gridRef,
    allColsRef,
    widthsRef,
    hiddenColsRef,
    setHiddenColumns,
    vsCodeApi
  ]);
}
