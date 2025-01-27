import React, { useEffect, useRef, useState, useCallback } from "react";
import { SlickgridReact, Column, GridOption, GridState } from "slickgrid-react";
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

    // Restore grid state when the grid is created
    const onGridCreated = useCallback((event: CustomEvent<{ slickGrid: SlickGrid }>) => {
        const grid = event.detail.slickGrid;
        if (gridState.columns) {
            grid.setColumns(gridState.columns);
        }
        if (gridState.rowSelection) {
            grid.setSelectedRows(gridState.rowSelection.dataContextIds);
        }
    }, [gridState]);

    // Update grid state when it changes (e.g., column resizing)
    const onGridStateChanged = useCallback((event: CustomEvent<{ gridState: GridState }>) => {
        setGridState(event.detail.gridState); // Update React state with the new grid state
    }, []);

    if (!rows || loading) return <LoadingElement label={loadingLabel} />;

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


=========================

const onGridCreated = useCallback(
    (event: CustomEvent<{ slickGrid: SlickGrid }>) => {
        const grid = event.detail.slickGrid;

        if (gridState.columns) {
            // Map CurrentColumn[] to Column[]
            const columns = mapCurrentColumnsToColumns(gridState.columns, gridTemplateColumns);
            grid.setColumns(columns);
        }

        if (gridState.rowSelection) {
            grid.setSelectedRows(gridState.rowSelection.dataContextIds);
        }
    },
    [gridState, gridTemplateColumns]
);



================

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

    // Function to map CurrentColumn[] to Column[]
    const mapCurrentColumnsToColumns = useCallback(
        (currentColumns: CurrentColumn[], originalColumns: Column[]): Column[] => {
            return currentColumns.map((currentCol) => {
                const originalCol = originalColumns.find((col) => col.id === currentCol.id);
                if (!originalCol) {
                    throw new Error(`Column with id ${currentCol.id} not found in original columns`);
                }
                return {
                    ...originalCol,
                    width: currentCol.width,
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

            if (gridState.rowSelection) {
                grid.setSelectedRows(gridState.rowSelection.dataContextIds);
            }
        },
        [gridState, gridTemplateColumns, mapCurrentColumnsToColumns]
    );

    // Update grid state when it changes (e.g., column resizing)
    const onGridStateChanged = useCallback((event: CustomEvent<{ gridState: GridState }>) => {
        setGridState(event.detail.gridState); // Update React state with the new grid state
    }, []);

    if (!rows || loading) return <LoadingElement label={loadingLabel} />;

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


=========================

/**
 * Map CurrentColumn[] to Column[] by ensuring required properties are present.
 * @param currentColumns - The current columns from the grid state
 * @param originalColumns - The original columns used to create the grid
 * @returns Column[] - Columns compatible with grid.setColumns()
 */
function mapCurrentColumnsToColumns(
    currentColumns: CurrentColumn[],
    originalColumns: Column[]
): Column[] {
    return currentColumns.map((currentCol) => {
        // Find the corresponding original column to get the required properties
        const originalCol = originalColumns.find((col) => col.id === currentCol.id);
        if (!originalCol) {
            throw new Error(`Column with id ${currentCol.id} not found in original columns`);
        }

        // Merge the current column state with the original column definition
        return {
            ...originalCol, // Retain all properties from the original column
            width: currentCol.width, // Apply the current width
            // Add other properties from currentCol if needed
        };
    });
}


======================

const onGridCreated = useCallback((event: CustomEvent<{ slickGrid: SlickGrid }>) => {
  const grid = event.detail.slickGrid;

  // if we have saved columns
  if (gridState.columns) {
    const originalCols = grid.getColumns() as Column[]; 
    // or if you have them in React state, e.g. `gridTemplateColumns`

    const mergedCols = mergeColumnState(originalCols, gridState.columns);
    grid.setColumns(mergedCols);
  }
  // if we have row selections
  if (gridState.rowSelection) {
    grid.setSelectedRows(gridState.rowSelection.dataContextIds);
  }
}, [gridState]);

function mergeColumnState(originalCols: Column[], currentCols: CurrentColumn[]) {
  // Step through currentCols in the new order, match them by `id` or `field`,
  // then copy their width, etc.
  return currentCols.map((curCol) => {
    const orig = originalCols.find(o => o.id === curCol.id) || {};
    return {
      ...orig,
      // Keep original definition but override with current column's width, etc.
      width: curCol.width,
      // Possibly reorder name, headerCssClass, etc. if needed
    } as Column;
  });
}
