function DisplayDataGrid({ data, showRowNumber, startIndex }: DataGridProps): React.ReactElement {
    const columns = data.columnNames.map((name, index) => ({
        id: name,
        name: `${name} [${data.columnTypes[index]}]`,
        field: index.toString(),
        sortable: true
    }));

    if (showRowNumber) {
        columns.unshift({ id: 'rowIndex', name: 'Row Index', field: 'rowIndex', sortable: true });
    }

    const items = data.rows.map((row, rowIndex) => {
        const item = { rowIndex: startIndex + rowIndex };
        row.forEach((cell, cellIndex) => {
            item[cellIndex] = cell;
        });
        return item;
    });

    return <Grid columns={columns} data={items} enableCellNavigation={true} enableColumnReorder={false} />;
}


export function DisplayDataGrid({ data, showRowNumber, startIndex }: DataGridProps): React.ReactElement {
  const columns = showRowNumber
    ? [{ id: 'rowIndex', name: 'Row Index', field: 'rowIndex' }, ...data.columnNames.map((name, idx) => ({ id: name, name: `${name} [${data.columnTypes[idx]}]`, field: name }))]
    : data.columnNames.map((name, idx) => ({ id: name, name: `${name} [${data.columnTypes[idx]}]`, field: name }));

  const gridData = data.rows.map((row, rowIndex) => {
    const rowData: Record<string, any> = showRowNumber ? { rowIndex: startIndex + rowIndex } : {};
    row.forEach((cell, cellIndex) => {
      rowData[data.columnNames[cellIndex]] = cell;
    });
    return rowData;
  });

  return (
    <SlickGrid
      gridId="quartz-slickgrid"
      columnDefinitions={columns}
      dataset={gridData}
      options={{ enableCellNavigation: true, enableColumnReorder: false }}
    />
  );
}
