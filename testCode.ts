import ".../css//slickGrid.css";
import React, { useEffect, useRef, useCallback, useMemo } from "react";
import { SlickgridReact, Column, GridOption, GridState, SlickGrid, SlickgridReactInstance, EmitterType } from "slickgrid-react";
import { v4 as uuidv4 } from "uuid";
import { LoadingElement } from "./SharedComponents";
import ReactDOM from "react-dom";
import { SlickGridContainer } from "./SlickGridContainer";
import { usePersistentState, useWebviewState, useVsCodeApi } from "../components/VsCodeExtensionContext";

const CvsDiffTypes = ["Submitted", "APPROVED", "PROD"] as const;
type CvsDiffType = typeof CvsDiffTypes[number];

const CVSTags = ["APPROVED", "PROD"] as const;
type CVSTag = typeof CVSTags[number];

interface PathPatchInfo {
    url: string;
    rev: string;
    modified: boolean;import React, { useEffect, useRef, useCallback, useMemo } from "react";
import { SlickgridReact, Column, GridOption, GridState, SlickgridReactInstance } from "slickgrid-react";
import { v4 as uuidv4 } from "uuid";
import { LoadingElement } from "./SharedComponents";
import { SlickGridContainer } from "./SlickGridContainer";
import { usePersistentState, useWebviewState } from "../components/VsCodeExtensionContext";

const PathsGrid: React.FC<PathsGridProps> = (props: PathsGridProps) => {
    const { columnOrder, label, rows, loading, loadingLabel, tabPanelId, onClickPath, imlFiles } = props;
    const gridRef = useRef<SlickgridReactInstance | null>(null);
    const gridId = `path_grid_${label}`;
    const elementId = tabPanelId || gridId;

    const initialState: GridState = {};
    const [state, updateState] = usePersistentState<GridState>("pathsGridState", initialState);
    const [presets, updatePresets] = useWebviewState<GridState>("pathsGridPresets", initialState);

    // Update dataset when rows change
    useEffect(() => {
        if (gridRef.current?.slickGrid && rows) {
            gridRef.current.slickGrid.setData(rows);
            gridRef.current.slickGrid.invalidate();
        }
    }, [rows]);

    // Handle column resizing
    const handleColumnsResized = useCallback(() => {
        const slickGrid = gridRef.current?.slickGrid;
        if (slickGrid) {
            const columns = slickGrid.getColumns();
            const columnWidths = columns.reduce((acc, col) => {
                acc[col.id] = col.width ?? col.minWidth ?? 100;
                return acc;
            }, {} as { [key: string]: number });
            updateState({ columns });
        } else {
            console.error("Grid instance is not initialized.");
        }
    }, [updateState]);

    // Restore grid state on grid creation
    const onGridCreated = useCallback((event: CustomEvent<SlickgridReactInstance>) => {
        const gridInstance = event.detail;
        gridRef.current = gridInstance;

        const slickGrid = gridInstance.slickGrid;
        if (slickGrid) {
            const columns = columnOrder.map((col) => ({
                ...col,
                width: state.columns?.find((c) => c.id === col.key)?.width || col.width,
            }));
            slickGrid.setColumns(columns);

            if (state.sorters) {
                const { columnId, direction } = state.sorters[0];
                slickGrid.setSortColumn(columnId, direction === "ASC");
            }

            slickGrid.onColumnsResized.subscribe(() => handleColumnsResized());
        }
    }, [columnOrder, state.columns, state.sorters, handleColumnsResized]);

    const onGridStateChanged = useCallback((e: CustomEvent<{ gridState: GridState }>) => {
        updatePresets(e.detail.gridState);
    }, [updatePresets]);

    if (!rows || loading) return <LoadingElement label={loadingLabel} />;

    const gridColumns: Column[] = columnOrder.map((col) => ({
        id: col.key,
        name: col.header,
        field: col.key,
        minWidth: 100,
        width: state.columns?.find((c) => c.id === col.key)?.width || 150,
        formatter: (row, cell, value, columnDef, dataContext) => {
            if (col.key === "path") {
                return `<a href="#" onclick="return false;">${value}</a>`;
            }
            return value;
        },
    }));

    const gridOptions: GridOption = {
        enableCellNavigation: true,
        enableColumnReorder: true,
        enableAutoResize: true,
        enableHeaderMenu: true,
    };

    return (
        <SlickGridContainer id={elementId}>
            <SlickgridReact
                gridId={gridId}
                ref={gridRef}
                columnDefinitions={gridColumns}
                gridOptions={gridOptions}
                dataset={rows}
                onReactGridCreated={onGridCreated}
                onGridStateChanged={onGridStateChanged}
            />
        </SlickGridContainer>
    );
};

export default PathsGrid;

    deleted: boolean;
    tags?: { [key in CvsDiffType]?: string };
}

interface ReviewPatchInfo {
    diff: string[];
    files: PathPatchInfo[];
}

interface PathGridRowData {
    id?: string;
    path: string;
    rev: string | undefined;
    diffTag: string;
    diffRev?: string;
    modified: boolean;
    iml?: boolean;
    [key: string]: string | boolean | undefined;
}

type PathInfo = {
    path: string;
    rev: string | undefined;
    diffRev: string | CVSTag | undefined;
    precommit: boolean;
    deleted: boolean;
    reviewId: number;
    diffType: CvsDiffType;
};

function convertRevToStringValue(rev: string | undefined, modified: boolean): string {
    return `${rev || "New"}${modified ? "*" : ""}`;
}

function renderElement(jsx: React.ReactElement, elementContainer?: HTMLElement): HTMLElement {
    const container = elementContainer ?? document.createElement("div");
    const root = ReactDOM.createRoot(container);
    root.render(jsx);
    return root.childElementCount === 1 ? root.childElements[0] : container;
}

function useResizeSlickGridOnShown(elementId: string) {
    const resizeDispatched = useRef(false);
    useEffect(() => {
        const targetNode = document.getElementById(elementId);
        const observer = new MutationObserver(() => {
            if (!targetNode?.hidden && !resizeDispatched.current) {
                window.dispatchEvent(new Event("resize"));
                resizeDispatched.current = true;
            } else if (targetNode?.hidden) {
                resizeDispatched.current = false;
            }
        });
        observer.observe(document.body, {
            attributes: true,
            childList: true,
            subtree: true,
        });
        return () => observer.disconnect();
    }, []);
    return resizeDispatched.current;
}

export function convertPathInfoToFileRowData(pathInfos: PathInfo[]): PathGridRowData[] {
    return pathInfos.map((pathInfo) => (
        {
            id: uuidv4(),
            path: pathInfo.path,
            rev: pathInfo.rev,
            diffRev: pathInfo.diffRev ?? "None",
            diffTag: pathInfo.diffType,
            modified: pathInfo.precommit,
        }
    ));
}

export function convertReviewPatchInfoToFileRowData(data: ReviewPatchInfo, diffTag: string): PathGridRowData[] {
    return data.files.map((pathInfo) => (
        {
            id: uuidv4(),
            path: pathInfo.url.slice(3),
            rev: pathInfo.rev,
            diffTag: diffTag,
            modified: pathInfo.modified,
        }
    ));
}

const checkboxFormatter = (_row: number, _cell: number, value: any, _columnDef: any, _dataContext: any) => {
    const checkbox = (<input type="checkbox" checked={value} disabled={true} className="disabled-checkbox" />);
    return renderElement(checkbox);
};

type PathNavigationElementProps = {
    path: string;
    tag: string;
    row: PathGridRowData;
    style?: any;
    onClick: (val: PathGridRowData) => Promise<void>;
};

const PathNavigationElement = ({ path, tag, onClick, row }: PathNavigationElementProps): HTMLElement => {
    const pathNavElement = document.createElement("a");
    pathNavElement.href = "#";
    pathNavElement.textContent = path;
    pathNavElement.title = `Navigate to diff page for ${path} against ${tag}`;
    pathNavElement.onclick = (e) => {
        e.preventDefault();
        onClick(row);
    };
    return pathNavElement;
}

export type PathGridColumn = {
    header: string;
    key: keyof PathGridRowData;
};

type PathsGridProps = {
    columnOrder: PathGridColumn[];
    tabPanelId?: string;
    label: string;
    imlFiles?: string[];
    onClickPath: (rowData: PathGridRowData) => Promise<void>;
    rows?: PathGridRowData[];
    diffCvsTag: string;
    loading: boolean;
    loadingLabel: string;
};

export const IMHeader = (): string => {
    return `<span><a href={IML_DOC_LINK} title='If this is checked, files are running with "ImportMode: Latest" mode, click on the link to navigate to documentation'>IML</a></span>`;
};

export const PathsGrid: React.FC<PathsGridProps> = (props: PathsGridProps) => {
    const { columnOrder, label, imlFiles, rows, diffCvsTag, onClickPath, loading, loadingLabel, tabPanelId } = props;
    const gridRef = useRef<SlickgridReact | null>(null);
    const griId = `path_grid_${label}`;
    const elementId = tabPanelId || griId;
    useResizeSlickGridOnShown(elementId);

    const initialState = { columnOrder, rows };
    const [state, updateState, resetState] = usePersistentState("pathsGrid", initialState);
    const [presets, updatePresets] = useWebviewState<GridState>("pathsGridPresets", {});

    useEffect(() => {
        if (gridRef.current && rows) {
            gridRef.current.dataset = rows;
        }
    }, [rows]);

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

    const onGridCreated = (event: CustomEvent<SlickgridReactInstance>) => {
        const grid = event.detail.slickGrid;
        gridRef.current = grid;
        const sorters = presets.sorters;

        if (sorters?.length) {
            const sorter = sorters[0];
            const { columnId, direction } = sorter;
            const sortDirection = direction.toLowerCase();
            grid.setSortColumn(columnId, sortDirection === 'asc');
        }

        const { activeSelection } = state;
        if (activeSelection) {
            const dataView = grid.getData();
            const row = dataView.getRowById(activeSelection);
            if (row !== undefined) {
                grid.setSelectedRows([row]);
                grid.setActiveCell(row, 0);
                grid.scrollRowIntoView(row);
            }
        }
    };

    const onGridStateChanged = (e: CustomEvent<{ gridState: GridState, change: { type: string, newValues: any } }>) => {
        updatePresets(e.detail.gridState);
    };

    const vsCodeApi = useVsCodeApi({
        resetState: resetState,
        update: (newStateUpdate: Partial<typeof initialState>) => {
            updateState(newStateUpdate);
        },
    });

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

========================

const handleColumnsResized = useCallback(() => {
        if (gridRef.current) {
            const columns = gridRef.current.slickGrid.getColumns();
            const columnWidths = columns.reduce((acc, col) => {
                acc[col.id] = col.width ?? col.minWidth ?? 100; // Provide a default value if width is undefined
                return acc;
            }, {} as { [key: string]: number });
            updateState({ columnWidths });
        }
    }, [updateState]);
