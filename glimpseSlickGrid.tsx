import React, { useEffect, useRef, useState, useCallback } from "react";
import { SlickgridReact, Column, GridOption, GridState, CurrentColumn } from "slickgrid-react";
import { v4 as uuidv4 } from "uuid";
import { LoadingElement } from "./SharedComponents";
import ReactDOM from "react-dom";
import { SlickGridContainer } from "./SlickGridContainer";
import debounce from "lodash.debounce"; // Import debounce for state updates

export const PathsGrid: React.FC<PathsGridProps> = (props: PathsGridProps) => {
    const { columnOrder, label, imlFiles, rows, diffCvsTag, onClickPath, loading, loadingLabel, tabPanelId } = props;
    const gridRef = useRef<SlickgridReact | null>(null);
    const gridId = `path_grid_${label}`;
    const elementId = tabPanelId || gridId;

    const [initialGridState, setInitialGridState] = useState<GridState>({}); // State for initial grid state
    const [isGridInitialized, setIsGridInitialized] = useState(false); // Track if the grid has been initialized

    useResizeSlickGridOnShown(elementId);

    useEffect(() => {
        if (gridRef.current && rows) {
            gridRef.current.dataset = rows;
        }
    }, [rows]);

    const gridTemplateColumns: Column[] = columnOrder.map((col) => ({
        id: col.key as string,
        name: col.header === "IML" ? IMHeader() : col.header,
        field: col.key as string,
        minWidth: col.key === "path" ? 250 : 100,
        formatter: (row, cell, value, columnDef, dataContext) => {
            // Define column formatter logic...
        },
        cssClass: col.key === "path" && imlFiles?.includes(col.key as string) ? "iml-cell" : "",
    }));

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

    const onGridCreated = useCallback(
        (event: CustomEvent<{ slickGrid: SlickGrid }>) => {
            const grid = event.detail.slickGrid;

            if (!isGridInitialized && initialGridState.columns) {
                const columns = mapCurrentColumnsToColumns(initialGridState.columns, gridTemplateColumns);
                grid.setColumns(columns);
                setIsGridInitialized(true); // Mark the grid as initialized
            }
        },
        [initialGridState, gridTemplateColumns, mapCurrentColumnsToColumns, isGridInitialized]
    );

    const handleGridStateUpdate = useCallback(
        debounce((newGridState: GridState) => {
            setInitialGridState(newGridState); // Update the initial state
        }, 300),
        [] // Ensure debounce is applied once
    );

    const onGridStateChanged = useCallback((event: CustomEvent<{ gridState: GridState }>) => {
        handleGridStateUpdate(event.detail.gridState); // Debounce updates to grid state
    }, [handleGridStateUpdate]);

    if (!rows || loading) return <LoadingElement label={loadingLabel} />;

    const gridOptions: GridOption = {
        enableCellNavigation: true,
        enableColumnReorder: true, // Enable reordering for better UX
        syncColumnCellResize: true,
        enableAutoTooltip: true,
        enableHeaderMenu: false,
        enableRowSelection: true,
    };

    return (
        <SlickGridContainer>
            <SlickgridReact
                gridId={gridId}
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



=====================

import React, { useEffect, useRef, useState, useCallback } from "react";
import { SlickgridReact, Column, GridOption, GridState, CurrentColumn } from "slickgrid-react";
import { v4 as uuidv4 } from "uuid";
import { LoadingElement } from "./SharedComponents";
import ReactDOM from "react-dom";
import { SlickGridContainer } from "./SlickGridContainer";
import debounce from "lodash.debounce";

export const PathsGrid: React.FC<PathsGridProps> = (props: PathsGridProps) => {
    const { columnOrder, label, imlFiles, rows, diffCvsTag, onClickPath, loading, loadingLabel, tabPanelId } = props;
    const gridRef = useRef<SlickgridReact | null>(null);
    const gridId = `path_grid_${label}`;
    const elementId = tabPanelId || gridId;

    const [savedGridState, setSavedGridState] = useState<GridState | null>(null);
    const [isStateApplied, setIsStateApplied] = useState(false);

    useEffect(() => {
        if (gridRef.current && rows) {
            gridRef.current.dataset = rows;
        }
    }, [rows]);

    const gridTemplateColumns: Column[] = columnOrder.map((col) => ({
        id: col.key as string,
        name: col.header === "IML" ? IMHeader() : col.header,
        field: col.key as string,
        minWidth: col.key === "path" ? 250 : 100,
        formatter: (row, cell, value, columnDef, dataContext) => {
            // Define column formatter logic here...
        },
        cssClass: col.key === "path" && imlFiles?.includes(col.key as string) ? "iml-cell" : "",
    }));

    const applySavedState = useCallback(
        (grid: SlickGrid) => {
            if (savedGridState && !isStateApplied) {
                // Apply saved column widths
                const columns = savedGridState.columns?.map((savedCol) => {
                    const originalCol = gridTemplateColumns.find((col) => col.id === savedCol.id);
                    return originalCol ? { ...originalCol, width: savedCol.width } : null;
                }).filter(Boolean) as Column[];

                if (columns) {
                    grid.setColumns(columns);
                }

                // Apply row selection if applicable
                const selectedRows = savedGridState.rowSelection?.dataContextIds || [];
                grid.setSelectedRows(selectedRows);

                setIsStateApplied(true); // Ensure state is applied only once
            }
        },
        [savedGridState, gridTemplateColumns, isStateApplied]
    );

    const onGridCreated = useCallback(
        (event: CustomEvent<{ slickGrid: SlickGrid }>) => {
            const grid = event.detail.slickGrid;
            applySavedState(grid); // Apply saved state on initialization
        },
        [applySavedState]
    );

    const saveGridState = useCallback(
        debounce((newGridState: GridState) => {
            setSavedGridState(newGridState); // Save state in React state
            console.log("Grid state updated:", newGridState);
        }, 300),
        []
    );

    const onGridStateChanged = useCallback(
        (event: CustomEvent<{ gridState: GridState }>) => {
            saveGridState(event.detail.gridState); // Save grid state with debounce
        },
        [saveGridState]
    );

    if (!rows || loading) return <LoadingElement label={loadingLabel} />;

    const gridOptions: GridOption = {
        enableCellNavigation: true,
        enableColumnReorder: true,
        syncColumnCellResize: true,
        enableAutoTooltip: true,
        enableHeaderMenu: true,
        enableRowSelection: true,
    };

    return (
        <SlickGridContainer>
            <SlickgridReact
                gridId={gridId}
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