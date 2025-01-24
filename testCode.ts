// reactFunctions.ts
import { ExtensionStorage } from "../path/to/localStorage";
import { SlickgridReactInstance, GridStateChange } from "slickgrid-react";

/**
 * Save the given grid state to extension storage, under some unique key
 */
export async function saveGridSettings(gridKey: string, gridState: any): Promise<void> {
  // the extensionStorage is typically a singleton
  const extensionStorage = ExtensionStorage.getInstance();
  await extensionStorage.update(gridKey, gridState);
}

/**
 * Load the grid state from extension storage, if it exists
 */
export function loadGridSettings(gridKey: string): any | undefined {
  const extensionStorage = ExtensionStorage.getInstance();
  return extensionStorage.get(gridKey);
}

/**
 * A convenience function to attach event handlers that automatically
 * save any grid changes. Also attempts to restore any previously-saved settings.
 */
export function setupGridPersistence(
  grid: SlickgridReactInstance,
  gridKey: string
) {
  // 1) Restore previously saved settings, if any
  const savedState = loadGridSettings(gridKey);
  if (savedState && savedState.columns) {
    // For example, you can reapply column sizes/order
    // Or use `grid.gridService.applyGridState(savedState)` if you rely on GridStateService
    grid.slickGrid.setColumns(savedState.columns);
    // If you also store/filter sorting, filtering, pinned columns, etc., reapply them as well
  }

  // 2) Subscribe to onGridStateChanged to auto-save on every change
  //    (This is a slickgrid-react feature. If not using `onGridStateChanged`,
  //     you can directly subscribe to SlickGrid's native events or use the GridStateService.)
  if (grid?.eventHandler) {
    grid.eventHandler.subscribe(grid.onGridStateChanged, async (_e: Event, args: GridStateChange) => {
      // The `args.gridState` will include columns, filters, sorters, etc. if used
      await saveGridSettings(gridKey, args.gridState);
    });
  }
}





useEffect(() => {
    // When the grid is fully created/mounted, attach the persistence logic
    if (gridRef.current && gridRef.current.initialized) {
      const slickgridReactInstance = gridRef.current.slickgridInstance;
      if (slickgridReactInstance) {
        setupGridPersistence(slickgridReactInstance, GRID_STORAGE_KEY);
      }
    }
