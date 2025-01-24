useEffect(() => {
        // Load grid state from the central Map
        const savedState = loadGridStateFromMap(griId);
        if (gridRef.current && savedState) {
            gridRef.current.columnDefinitions = savedState.columns;
            gridRef.current.gridOptions = { ...gridRef.current.gridOptions, ...savedState.options };
        }

        const grid = gridRef.current?.slickGridInstance;

        // Subscribe to grid state changes
        const handleGridStateChanged = (e: CustomEvent<{ gridState: GridState; change: { type: string; newValues: any } }>) => {
            const { gridState, change } = e.detail;
            if (change.type === "columns") {
                const state = {
                    columns: gridState.columns,
                    options: gridRef.current?.gridOptions,
                };
                saveGridStateToMap(griId, state);
            }
        };

        grid?.onColumnsResized.subscribe(handleGridStateChanged);

        return () => {
            grid?.onColumnsResized.unsubscribe(handleGridStateChanged);
        };
    }, [rows]);
