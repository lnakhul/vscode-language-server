if (gridMenu) {
      const sub = gridMenu.onColumnsChanged.subscribe((_e, data) => {
        const visibleIds = data.columns.map(c => c.columnId);
        const hiddenIds  = allColumnsRef.current
          .map(c => String(c.id))
          .filter(id => !visibleIds.includes(id));

        setHiddenColumns(hiddenIds);
        vsCodeApi.invoke('saveGridSettings', {
          gridId: 'vcconsole',
          settings: {
            columnWidths: widthsRef.current,
            hiddenColumns: hiddenIds
          }
        });

        // immediately re-apply so menu greys out correctly
        grid.setColumns(
          allColumnsRef.current
            .filter(col => !hiddenIds.includes(String(col.id)))
            .map(col => ({ …col, width: widthsRef.current[col.id] ?? col.width }))
        );
      });
      // clean up on unmount
      grid.onBeforeDestroy.subscribe(() => sub.unsubscribe?.());
    }
  };

  // … other handlers …

  // ➌ After your `displayColumns = useMemo(...)`, force any change back into the grid
  useEffect(() => {
    const grid = slickGridRef.current;
    if (!grid) return;
    const visible = allColumnsRef.current
      .filter(col => !hiddenColumns.includes(String(col.id)))
      .map(col => ({ …col, width: columnWidths[col.id] ?? col.width }));
    grid.setColumns(visible);
  }, [columnWidths, hiddenColumns]);
