import { ExtensionStorage } from "./localStorage";

const GRID_SETTINGS_KEY = "slickgrid_settings";

/**
 * Save grid settings to local storage.
 * @param gridId - Unique identifier for the grid.
 * @param settings - The settings to save.
 */
export async function saveGridSettings(gridId: string, settings: any) {
    const storage = ExtensionStorage.getInstance();
    const allSettings = (await storage.get(GRID_SETTINGS_KEY, {})) as Record<string, any>;
    allSettings[gridId] = settings;
    await storage.update(GRID_SETTINGS_KEY, allSettings);
}

/**
 * Load grid settings from local storage.
 * @param gridId - Unique identifier for the grid.
 * @returns The saved settings or null if not found.
 */
export async function loadGridSettings(gridId: string): Promise<any | null> {
    const storage = ExtensionStorage.getInstance();
    const allSettings = (await storage.get(GRID_SETTINGS_KEY, {})) as Record<string, any>;
    return allSettings[gridId] || null;
}


=====================================

useEffect(() => {
        // Load saved settings and apply them to the grid
        const applySavedSettings = async () => {
            const savedSettings = await loadGridSettings(gridId);
            if (savedSettings && gridRef.current) {
                // Apply settings to the grid (e.g., column sizes)
                gridRef.current.applyColumnWidths(savedSettings.columnWidths);
            }
        };
        applySavedSettings();
    }, [gridId]);

    const handleGridStateChange = () => {
        if (gridRef.current) {
            const columnWidths = gridRef.current.getColumns().map((col) => col.width);
            saveGridSettings(gridId, { columnWidths });
        }
    };
