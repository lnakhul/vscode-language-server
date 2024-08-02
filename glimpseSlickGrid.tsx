const pathGridColumns: Column<FileRowData>[] = [
        { id: 'path', name: 'Path', field: 'Path', sortable: true, formatter: clickablePathFormatter },
        { id: 'rev', name: 'Rev', field: 'Rev', sortable: true },
        { id: 'diffType', name: 'Diff Type', field: 'DiffType', sortable: true },
        { id: 'diffAgainst', name: 'Diff Against', field: 'DiffRev', sortable: true },
        { id: 'iml', name: 'IML', field: 'iml', sortable: true, formatter: imlFormatter }
    ];

    const pathGridDataset = convertPathInfoToFileRowData(pathInfos);

    const pathGridOptions: GridOption = {
        enableCellNavigation: true,
        enableColumnReorder: false,
        enableSorting: true,
        enableHeaderMenu: false,
        autoHeight: true,
        autoResize: {
            containerId: 'grid-container',
            rightPadding: 15
        }
    };

    function clickablePathFormatter(row: number, cell: number, value: string, columnDef: Column<FileRowData>, dataContext: FileRowData): string {
        return `<a href="#" data-id="${dataContext.Path}" class="clickable-path">${value}</a>`;
    }

    function imlFormatter(row: number, cell: number, value: boolean): string {
        return `<input type="checkbox" disabled ${value ? 'checked' : ''} />`;
    }

    const onCellClicked = useCallback((e: Event, args: any) => {
        const item = args?.item;
        if (item) {
            onPathClick(item);
        }
    }, []);
