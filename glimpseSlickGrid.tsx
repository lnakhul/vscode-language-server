// Save column settings in local storage
const saveGridSettings = async (grid: any, label: string) => {
  const columns = grid.getColumns();
  const columnSettings = columns.map((col: any) => ({
    id: col.id,
    width: col.width,
  }));
  await extensionStorage.update(`gridSettings_${label}`, columnSettings); // Persist to local storage
};

// Load column settings from local storage
const loadGridSettings = async (label: string) => {
  const savedSettings = await extensionStorage.get(`gridSettings_${label}`, []);
  return savedSettings;
};

// Load grid settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      const settings = await loadGridSettings(label);
      setColumnSettings(settings);
    };
    loadSettings();
  }, [label]);

  // Save settings whenever columns are resized
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.grid.onColumnsResized.subscribe(() => {
        saveGridSettings(gridRef.current!.grid, label); // Capture and save settings on column resize
      });
    }
  }, [label]);

  // Apply loaded column widths or default widths
  const getColumnWithSavedWidths = (columns: Column[]) => {
    return columns.map((col) => {
      const savedColumn = columnSettings.find((s) => s.id === col.id);
      return {
        ...col,
        width: savedColumn ? savedColumn.width : col.width, // Apply saved width if available
      };
    });
  };
