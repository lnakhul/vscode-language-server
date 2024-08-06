import React, { useEffect, useRef } from "react";
import { SlickgridReact, Column, GridOption } from "slickgrid-react";
import { v4 as uuidv4 } from 'uuid';
import { PathGridRowData, IML_DOC_LINK, PathInfo, ReviewPatchInfo } from "../interfaces/interfaces";
import { ClickableCellElement, LoadingElement } from "./SharedComponents";

interface FileRowData {
    Path: string;
    Rev: string;
    DiffRev: string;
    Lineno?: number;
    [key: string]: string | number | undefined;
}

interface PathGridRowData {
    id: string; // Unique identifier for each row
    path: string;
    rev: string | undefined;
    diffTag: string;
    diffRev?: string;
    modified: boolean;
    iml?: boolean;
    [key: string]: string | boolean | undefined;
}

export type PathGridColumn = {
    header: string;
    key: keyof PathGridRowData;
};

function convertRevToStringValue(rev: string | undefined, modified: boolean): string {
    return `${rev || "New"}${modified ? '*' : ''}`;
}

function generateCellStyle(isIML: boolean): undefined | any {
    return isIML ? { color: "var(--vscode-editorWarning-foreground)" } : undefined;
}

export function convertPathInfoToFileRowData(pathInfos: PathInfo[]): PathGridRowData[] {
    return pathInfos.map(pathInfo => ({
        id: uuidv4(), // Assign a unique ID to each row
        path: pathInfo.path,
        rev: pathInfo.rev,
        diffRev: pathInfo.diffRev ?? 'None',
        diffTag: pathInfo.diffType,
        modified: pathInfo.precommit,
        iml: pathInfo.iml // Ensure iml property is correctly set if it exists
    }));
}

export function convertReviewPatchInfoToFileRowData(data: ReviewPatchInfo, diffTag: string): PathGridRowData[] {
    return data.files.map(pathInfo => ({
        id: uuidv4(), // Assign a unique ID to each row
        path: pathInfo.url.slice(3),
        rev: pathInfo.rev,
        diffTag: diffTag,
        modified: pathInfo.modified,
        iml: pathInfo.iml // Ensure iml property is correctly set if it exists
    }));
}

// Check Value
const CheckedValue = ({ checked }: { checked: boolean }): React.ReactElement => (
    <input type="checkbox" checked={checked} readOnly />
);

type PathNavigationElementProps = {
    path: string;
    tag: string;
    row: PathGridRowData;
    style?: any;
    onClick: (val: PathGridRowData) => Promise<void>;
};

const ClickableRowCellElement = ClickableCellElement<PathGridRowData>;

const PathNavigationElement = ({ path, tag, onClick, row }: PathNavigationElementProps): React.ReactElement => (
    <ClickableRowCellElement
        tooltip={`Navigate to diff page for ${path} against ${tag}`}
        value={path}
        rowValues={row}
        onClick={onClick}
    />
);

type PathsGridProps = {
    columnOrder: PathGridColumn[];
    label: string;
    imlFiles?: string[];
    onClickPath: (rowData: PathGridRowData) => Promise<void>;
    rows?: PathGridRowData[];
    diffCvsTag: string;
    loading: boolean;
    loadingLabel: string;
};

export const IMHeader = (): React.ReactElement => {
    return <span><a href={IML_DOC_LINK} title='If this is checked, files are running with "ImportMode: Latest" mode, click on the link to navigate to documentation'>IML</a></span>
};

export const PathsGrid: React.FC<PathsGridProps> = (props: PathsGridProps) => {
    const { columnOrder, label, imlFiles, rows, diffCvsTag, onClickPath, loading, loadingLabel } = props;
    const gridRef = useRef<SlickgridReact | null>(null);

    useEffect(() => {
        if (gridRef.current && rows) {
            gridRef.current.dataset = rows;
        }
    }, [rows]);

    if (!rows || loading) return <LoadingElement label={loadingLabel} />;

    const columns: Column<any>[] = columnOrder.map((col) => ({
        id: col.key as string,
        name: col.header === 'IML' ? IMHeader() : col.header,
        field: col.key as string,
        formatter: (row, cell, value, columnDef, dataContext) => {
            let cellContent;
            if (col.key === 'iml') {
                cellContent = <CheckedValue checked={!!value} />;
            } else if (col.key === 'path') {
                cellContent = (
                    <PathNavigationElement
                        path={value as string}
                        tag={dataContext.diffTag}
                        row={dataContext}
                        onClick={onClickPath}
                    />
                );
            } else if (col.key === 'rev') {
                cellContent = convertRevToStringValue(value as string, dataContext.modified);
            } else {
                cellContent = value;
            }

            // Create a div to return as HTML element
            const div = document.createElement('div');
            div.className = col.key === 'path' && imlFiles?.includes(dataContext.path) ? 'iml-cell' : '';
            div.appendChild(typeof cellContent === 'string' ? document.createTextNode(cellContent) : cellContent);

            return div;
        },
        cssClass: col.key === 'path' && imlFiles?.includes(col.key as string) ? 'iml-cell' : ''
    }));

    const options: GridOption = {
        enableCellNavigation: true,
        enableColumnReorder: false,
        forceFitColumns: true
    };

    return (
        <SlickgridReact
            ref={gridRef}
            columnDefinitions={columns}
            gridOptions={options}
            dataset={rows}
            gridId={`path_grid_${label}`}
        />
    );
};

export default PathsGrid;

===========================================

    import React, { useEffect, useRef } from "react";
import { SlickgridReact, Column, GridOption } from "slickgrid-react";
import { v4 as uuidv4 } from 'uuid';
import { PathGridRowData, IML_DOC_LINK, PathInfo, ReviewPatchInfo } from "../interfaces/interfaces";
import { ClickableCellElement, LoadingElement } from "./SharedComponents";

interface FileRowData {
    Path: string;
    Rev: string;
    DiffRev: string;
    Lineno?: number;
    [key: string]: string | number | undefined;
}

interface PathGridRowData {
    id: string; // Unique identifier for each row
    path: string;
    rev: string | undefined;
    diffTag: string;
    diffRev?: string;
    modified: boolean;
    iml?: boolean;
    [key: string]: string | boolean | undefined;
}

export type PathGridColumn = {
    header: string;
    key: keyof PathGridRowData;
};

function convertRevToStringValue(rev: string | undefined, modified: boolean): string {
    return `${rev || "New"}${modified ? '*' : ''}`;
}

export function convertPathInfoToFileRowData(pathInfos: PathInfo[]): PathGridRowData[] {
    return pathInfos.map(pathInfo => ({
        id: uuidv4(), // Assign a unique ID to each row
        path: pathInfo.path,
        rev: pathInfo.rev,
        diffRev: pathInfo.diffRev ?? 'None',
        diffTag: pathInfo.diffType,
        modified: pathInfo.precommit,
        iml: pathInfo.iml // Ensure iml property is correctly set if it exists
    }));
}

export function convertReviewPatchInfoToFileRowData(data: ReviewPatchInfo, diffTag: string): PathGridRowData[] {
    return data.files.map(pathInfo => ({
        id: uuidv4(), // Assign a unique ID to each row
        path: pathInfo.url.slice(3),
        rev: pathInfo.rev,
        diffTag: diffTag,
        modified: pathInfo.modified,
        iml: pathInfo.iml // Ensure iml property is correctly set if it exists
    }));
}

// Check Value
const CheckedValue = ({ checked }: { checked: boolean }): React.ReactElement => (
    <input type="checkbox" checked={checked} readOnly />
);

type PathNavigationElementProps = {
    path: string;
    tag: string;
    row: PathGridRowData;
    style?: any;
    onClick: (val: PathGridRowData) => void;
};

const PathNavigationElement = ({ path, tag, onClick, row }: PathNavigationElementProps): React.ReactElement => (
    <ClickableCellElement
        tooltip={`Navigate to diff page for ${path} against ${tag}`}
        value={path}
        rowvalues={row}
        onclick={onClick}
    />
);

type PathsGridProps = {
    columnOrder: PathGridColumn[];
    label: string;
    imlFiles?: string[];
    onClickPath: (rowData: PathGridRowData) => Promise<void>;
    rows?: PathGridRowData[];
    diffCvsTag: string;
    loading: boolean;
    loadingLabel: string;
};

export const IMHeader = (): React.ReactElement => {
    return <span><a href={IML_DOC_LINK} title='If this is checked, files are running with "ImportMode: Latest" mode, click on the link to navigate to documentation'>IML</a></span>
};

export const PathsGrid: React.FC<PathsGridProps> = (props: PathsGridProps) => {
    const { columnOrder, label, imlFiles, rows, diffCvsTag, onClickPath, loading, loadingLabel } = props;
    const gridRef = useRef<SlickgridReact | null>(null);

    useEffect(() => {
        if (gridRef.current && rows) {
            gridRef.current.dataset = rows;
        }
    }, [rows]);

    if (!rows || loading) return <LoadingElement label={loadingLabel} />;

    const columns: Column<any>[] = columnOrder.map((col) => ({
        id: col.key as string,
        name: col.header === 'IML' ? IMHeader() : col.header,
        field: col.key as string,
        formatter: (row, cell, value, columnDef, dataContext) => {
            if (col.key === 'iml') {
                return CheckedValue({ checked: !!value });
            } else if (col.key === 'path') {
                return PathNavigationElement({
                    path: value as string,
                    tag: dataContext.diffTag,
                    row: dataContext,
                    onClick: onClickPath
                });
            } else if (col.key === 'rev') {
                return convertRevToStringValue(value as string, dataContext.modified);
            }
            return value;
        },
        cssClass: col.key === 'path' && imlFiles?.includes(dataContext.path) ? 'iml-cell' : ''
    }));

    const options: GridOption = {
        enableCellNavigation: true,
        enableColumnReorder: false,
        forceFitColumns: true
    };

    return (
        <SlickgridReact
            ref={gridRef}
            columnDefinitions={columns}
            gridOptions={options}
            dataset={rows}
            gridId={`path_grid_${label}`}
        />
    );
};

export default PathsGrid;

