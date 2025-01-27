import React, { useEffect, useRef, useCallback } from "react";
import { SlickgridReact, Column, GridOption, GridState } from "slickgrid-react";
import { v4 as uuidv4 } from "uuid";
import { LoadingElement } from "./SharedComponents";
import ReactDOM from "react-dom";
import { SlickGridContainer } from "./SlickGridContainer";
import { ExtensionStorage } from "../storage/localStorage"; // Adjust the import path as needed

// ... (other imports and interfaces)

export const PathsGrid: React.FC<PathsGridProps> = (props: PathsGridProps) => {
    const { columnOrder, label, imlFiles, rows, diffCvsTag, onClickPath, loading, loadingLabel, tabPanelId } = props;
    const gridRef = useRef<SlickgridReact | null>(null);
    const griId = `path_grid_${label}`;
    const elementId = tabPanelId || griId;
    const extensionStorage = ExtensionStorage.getInstance(); // Get the instance of ExtensionStorage

    useResizeSlickGridOnShown(elementId);

    useEffect(() => {
        if (gridRef.current && rows) {
            gridRef.current.dataset = rows;
        }
    }, [rows]);

    const saveGridState = useCallback((gridState: GridState) => {
        extensionStorage.update(`gridState_${griId}`, gridState);
    }, [extensionStorage, griId]);

    const loadGridState = useCallback(() => {
        return extensionStorage.get<GridState>(`gridState_${griId}`, {});
    }, [extensionStorage, griId]);

    const onGridCreated = useCallback((event: CustomEvent<{ slickGrid: SlickGrid }>) => {
        const grid = event.detail.slickGrid;
        const savedState = loadGridState();
        if (savedState.columns) {
            grid.setColumns(savedState.columns);
        }
        if (savedState.rowSelection) {
            grid.setSelectedRows(savedState.rowSelection.dataContextIds);
        }
    }, [loadGridState]);

    const onGridStateChanged = useCallback((event: CustomEvent<{ gridState: GridState }>) => {
        saveGridState(event.detail.gridState);
    }, [saveGridState]);

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
