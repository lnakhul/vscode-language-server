const PathsGrid: React.FC<PathGridProps> = ({ headers, label, imlFiles, onClickPath }) => {
    const cvsDiffSummary = useContext(CvsDiffSummaryContext);
    const rows = cvsDiffSummary.pathInfos;

    const columns: Column[] = headers.map((header, index) => ({
        id: `column_${index}`,
        name: header,
        field: header,
        sortable: true,
    }));

    const gridData = rows.map((row, rowIndex) => {
        const rowData: Record<string, any> = {};
        headers.forEach((header) => {
            rowData[header] = row[header];
        });
        return rowData;
    });

    return (
        <SlickgridReact
            gridId={`path_grid_${label}`}
            columnDefinitions={columns}
            dataset={gridData}
            gridOptions={{ enableCellNavigation: true, enableColumnReorder: false }}
        />
    );
}

const ReviewHistoryTable: React.FC<ReviewHistoryProp> = ({ history }) => {
    const columns: Column[] = [
        { id: 'status', name: 'Status', field: 'status', sortable: true },
        { id: 'id', name: 'Id', field: 'id', sortable: true },
        { id: 'description', name: 'Description', field: 'description', sortable: true },
        { id: 'date', name: 'Date', field: 'date', sortable: true },
        { id: 'author', name: 'Author', field: 'author', sortable: true },
        { id: 'files', name: 'Files', field: 'files', sortable: true }
    ];

    const gridData = history.map((entry) => ({
        status: entry.status,
        id: entry.iscurrent ? 'CURRENT' : entry.reviewId,
        description: entry.description,
        date: entry.requestedDate,
        author: entry.requestedBy,
        files: entry.files.map(file => `${file.path} ${file.revision}`).join('\n'),
    }));

    return (
        <SlickgridReact
            gridId="reviewHistoryGrid"
            columnDefinitions={columns}
            dataset={gridData}
            gridOptions={{ enableCellNavigation: true, enableColumnReorder: true }}
        />
    );
}
