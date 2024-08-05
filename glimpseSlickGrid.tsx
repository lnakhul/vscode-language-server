import React from "react";
import { SlickgridReact, Column, GridOption, Formatter } from 'slickgrid-react';
import { v4 as uuidv4 } from 'uuid';
import { PathGridRowData, IML_DOC_LINK, PathInfo, ReviewPatchInfo } from "../interfaces/interfaces";
import { LoadingElement } from "./SharedComponents";

export type PathGridColumn = {
  header: string;
  key: keyof PathGridRowData;
};

function convertRevToStringValue(rev: string | undefined, modified: boolean): string {
  return `${rev || "New"}${modified ? '*' : ''}`;
}

export function convertPathInfoToFileRowData(pathInfos: PathInfo[]): PathGridRowData[] {
  return pathInfos.map(pathInfo => ({
    path: pathInfo.path,
    rev: pathInfo.rev,
    diffRev: pathInfo.diffRev ?? 'None',
    diffTag: pathInfo.diffType,
    modified: pathInfo.precommit
  }));
}

// Path Formatter
const pathFormatter: Formatter<PathGridRowData> = (row, cell, value, columnDef, dataContext) => {
  const element = document.createElement('span');
  element.title = `Navigate to diff page for ${value} against ${dataContext.diffTag}`;
  element.textContent = value;
  return element;
};

// IML Formatter
const imlFormatter: Formatter<PathGridRowData> = (row, cell, value, columnDef, dataContext) => {
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = !!value;
  checkbox.disabled = true;
  return checkbox;
};

// Define the columns
const pathGridColumns: Column<PathGridRowData>[] = [
  { id: 'path', name: 'Path', field: 'path', formatter: pathFormatter },
  { id: 'rev', name: 'Rev', field: 'rev' },
  { id: 'diffTag', name: 'Diff Type', field: 'diffTag' },
  { id: 'diffRev', name: 'Diff Against', field: 'diffRev' },
  { id: 'iml', name: 'IML', field: 'iml', formatter: imlFormatter },
];

// Grid options
const gridOptions: GridOption = {
  enableCellNavigation: true,
  enableColumnReorder: true,
  enableSorting: true,
};

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

export const PathsGrid: React.FC<PathsGridProps> = ({
  columnOrder,
  label,
  imlFiles,
  rows,
  diffCvsTag,
  onClickPath,
  loading,
  loadingLabel
}) => {
  if (!rows || loading) return <LoadingElement label={loadingLabel} />;

  // Add a unique id for each row using uuidv4
  const dataset = rows.map(row => ({ ...row, id: uuidv4(), iml: imlFiles?.includes(row.path) }));

  return (
    <SlickgridReact
      gridId={`path_grid_${label}`}
      columnDefinitions={pathGridColumns}
      dataset={dataset}
      gridOptions={gridOptions}
      customEvents={{
        onCellClicked: (e, args) => onClickPath(args.dataContext),
      }}
    />
  );
};

export default PathsGrid;
