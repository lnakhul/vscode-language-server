useEffect(() => {
    const loadColumnSettings = async () => {
      const savedSettings = await extensionStorage.get(`columnSettings_${label}`, {});
      if (gridRef.current && savedSettings) {
        gridRef.current.slickGrid.setColumns(savedSettings);
      }
    };

    loadColumnSettings();
  }, [label]);

  useEffect(() => {
    const handleColumnResize = async (e: any, args: any) => {
      const columnSettings = gridRef.current?.slickGrid.getColumns();
      await extensionStorage.update(`columnSettings_${label}`, columnSettings);
    };

    if (gridRef.current) {
      gridRef.current.slickGrid.onColumnsResized.subscribe(handleColumnResize);
    }

    return () => {
      if (gridRef.current) {
        gridRef.current.slickGrid.onColumnsResized.unsubscribe(handleColumnResize);
      }
    };
  }, [label]);
