import React, { useEffect, useRef, useState, useCallback } from "react";
import { SlickgridReact, Column, GridOption, GridState, CurrentColumn } from "slickgrid-react";
import { v4 as uuidv4 } from "uuid";
import { LoadingElement } from "./SharedComponents";
import ReactDOM from "react-dom";
import { SlickGridContainer } from "./SlickGridContainer";

// ... (other imports and interfaces)

export const PathsGrid: React.FC<PathsGridProps> = (props: PathsGridProps) => {
    const { columnOrder, label, imlFiles, rows, diffCvsTag, onClickPath, loading, loadingLabel, tabPanelId } = props;
    const gridRef = useRef<SlickgridReact | null>(null);
    const griId = `path_grid_${label}`;
    const elementId = tabPanelId || griId;

    // State to manage grid state (column sizes, etc.)
    const [gridState, setGridState] = useState<GridState>({});

    useResizeSlickGridOnShown(elementId);

    useEffect(() => {
        if (gridRef.current && rows) {
            gridRef.current.dataset = rows;
        }
    }, [rows]);

    // Define gridTemplateColumns before it is used in onGridCreated
    const gridTemplateColumns: Column[] = columnOrder.map((col) => ({
        id: col.key as string,
        name: col.header === "IML" ? IMHeader() : col.header,
        field: col.key as string,
        minWidth: col.key === "path" ? 250 : 100,
        params: { rows },
        formatter: (row, cell, value, columnDef, dataContext) => {
            let cellContent;
            if (col.key === 'modified') {
                cellContent = checkboxFormatter(row, cell, col.header.toLowerCase() === 'modified' ? !!value : !value, columnDef, dataContext);
            } else if (col.key === "iml") {
                cellContent = checkboxFormatter(row, cell, imlFiles?.includes(dataContext.path), columnDef, dataContext);
            } else if (col.key === "path") {
                cellContent = PathNavigationElement({ path: value as string, tag: dataContext.diffTag, row: dataContext, onClick: onClickPath });
            } else if (col.key === "rev") {
                cellContent = document.createTextNode(convertRevToStringValue(value as string, dataContext.modified));
            } else {
                cellContent = document.createTextNode(value as string);
            }

            const cellElement = document.createElement("div");
            cellElement.className = col.key === "path" && imlFiles?.includes(dataContext.path) ? "iml-cell" : "";
            cellElement.appendChild(typeof cellContent === "string" ? document.createTextNode(cellContent) : cellContent);
            return cellElement;
        },
        cssClass: col.key === "path" && imlFiles?.includes(col.key as string) ? "iml-cell" : ""
    }));

    // Function to map CurrentColumn[] to Column[]
    const mapCurrentColumnsToColumns = useCallback(
        (currentColumns: CurrentColumn[], originalColumns: Column[]): Column[] => {
            return currentColumns.map((currentCol) => {
                const originalCol = originalColumns.find((col) => col.id === currentCol.id);
                if (!originalCol) {
                    throw new Error(`Column with id ${currentCol.id} not found in original columns`);
                }
                return {
                    ...originalCol, // Retain all properties from the original column
                    width: currentCol.width, // Apply the current width from gridState
                };
            });
        },
        []
    );

    // Restore grid state when the grid is created
    const onGridCreated = useCallback(
        (event: CustomEvent<{ slickGrid: SlickGrid }>) => {
            const grid = event.detail.slickGrid;

            if (gridState.columns) {
                // Map CurrentColumn[] to Column[]
                const columns = mapCurrentColumnsToColumns(gridState.columns, gridTemplateColumns);
                grid.setColumns(columns);
            }

            if (gridState.rowSelection?.dataContextIds) {
                // Convert dataContextIds to number[]
                const rowIds = gridState.rowSelection.dataContextIds.map((id) => Number(id));
                grid.setSelectedRows(rowIds);
            } else {
                // If dataContextIds is undefined, pass an empty array
                grid.setSelectedRows([]);
            }
        },
        [gridState, gridTemplateColumns, mapCurrentColumnsToColumns]
    );

    // Update grid state when it changes (e.g., column resizing)
    const onGridStateChanged = useCallback((event: CustomEvent<{ gridState: GridState }>) => {
        console.log("Grid state changed:", event.detail.gridState);
        setGridState(event.detail.gridState); // Update React state with the new grid state
    }, []);

    if (!rows || loading) return <LoadingElement label={loadingLabel} />;

    const gridOptions: GridOption = {
        enableCellNavigation: true,
        enableColumnReorder: false,
        syncColumnCellResize: true,
        enableAutoTooltip: true,
        enableHeaderMenu: false,
        enableRowSelection: true,
        showCellSelection: false,
        enableContextMenu: false,
        enableColumnPicker: false,
        enableGridMenu: false,
    };

    return (
        <SlickGridContainer>
            <SlickgridReact
                gridId={griId}
                ref={gridRef}
                columnDefinitions={gridTemplateColumns}
                gridOptions={gridOptions}
                dataset={rows}
                onReactGridCreated={onGridCreated}
                onGridStateChanged={onGridStateChanged}
            />
        </SlickGridContainer>
    );
};

export default PathsGrid;