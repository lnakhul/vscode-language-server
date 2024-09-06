const addCustomElements = (
  isReviewerSelectable: boolean,
  selectedUserNames: Set<string>,
  onUserClick?: (approver: PathApprover, checked: boolean) => void,
  onUserGroupClick?: (group: QuackApproverGroup, checked: boolean) => void
) => (cellNode: HTMLElement, row: number, dataContext: any) => {
  const treeContent = cellNode.innerHTML;  // This preserves the tree content rendered by Formatters.tree
  let checkbox = null;
  let additionalContent = "";

  // Add checkboxes for groups and approvers
  if (isReviewerSelectable) {
    if (dataContext.isGroup) {
      const checked = dataContext.approvers.every((val: PathApprover) => selectedUserNames.has(val.userName));
      checkbox = (
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onUserGroupClick?.(dataContext, !checked)}
        />
      );
    } else if (dataContext.isApprover) {
      const checked = selectedUserNames.has(dataContext.approver.userName);
      checkbox = (
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onUserClick?.(dataContext.approver, !checked)}
        />
      );
    }
  }

  // Add custom group or approver links
  if (dataContext.isGroup) {
    const initials = dataContext.approvers.map((x: PathApprover) => x.powwow).join('|');
    const tooltip = `Click to copy initials and select all reviewers in ${dataContext.name}`;
    additionalContent = `${createCopyLink(dataContext.name, initials, tooltip)} `;
  } else if (dataContext.isApprover) {
    additionalContent = `${dataContext.name} ${userToLink(dataContext.approver.userName, dataContext.approver.powwow)} ${dataContext.approver.powwow}`;
  }

  // Clear and re-add content with custom elements
  while (cellNode.firstChild) {
    cellNode.removeChild(cellNode.firstChild);
  }
  const container = document.createElement("div");
  ReactDOM.render(
    <>
      {checkbox} <span dangerouslySetInnerHTML={{ __html: treeContent }} /> {additionalContent}
    </>,
    container
  );
  if (container.firstChild) {
    cellNode.appendChild(container.firstChild);
  }
};

=============================

 const treeFormatter = (_row: number, _cell: number, value: any, _columnDef: Column, dataContext: any) => {
  const { isGroup, approvers, isApprover } = dataContext;
  const treeToggleIcon = dataContext.__collapsed ? '▶' : '▼';

  let additionalContent = '';
  if (isGroup) {
    const initials = approvers.map((x: PathApprover) => x.powwow).join('|');
    const tooltip = `Click to copy initials and select all reviewers in ${dataContext.name}`;
    additionalContent = `${createCopyLink(dataContext.name, initials, tooltip)} `;
  } else if (isApprover) {
    additionalContent = `${dataContext.name} ${userToLink(dataContext.approver.userName, dataContext.approver.powwow)} ${dataContext.approver.powwow}`;
  }

  return `<span>${treeToggleIcon}</span> ${additionalContent}`;
};



===========================================

import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import { SlickgridReact, Column, GridOption, FieldType, Formatters } from 'slickgrid-react';
import { PathApprover, QuackApproverGroup } from "./interfaces/interfaces";
import { SpinningIcon } from "./SpinningIcon";

type ApproverViewProp = {
  approverGroups?: QuackApproverGroup[];
  onUserClick?: (approver: PathApprover, checked: boolean) => void;
  onUserGroupClick?: (group: QuackApproverGroup, checked: boolean) => void;
  isReviewerSelectable: boolean;
  selectedUsers?: PathApprover[] | null;
  onClickGroupLink?: (group: QuackApproverGroup) => void;
};

const ApproversView: React.FC<ApproverViewProp> = ({ approverGroups, selectedUsers, isReviewerSelectable, onUserClick, onUserGroupClick, onClickGroupLink }) => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [gridOptions, setGridOptions] = useState<GridOption>({});

  useEffect(() => {
    if (approverGroups) {
      const formattedData = approverGroups.map(group => ({
        id: uuidv4(),
        file: group.roleName,
        approvers: group.approvers.map(approver => ({
          id: uuidv4(),
          file: approver.displayName,
          userName: approver.userName,
          canApprove: approver.canApprove
        }))
      }));

      setDataset(formattedData);

      setColumns([
        {
          id: 'file',
          name: 'Approvers',
          field: 'file',
          type: FieldType.string,
          formatter: Formatters.tree,
          width: 200
        },
        {
          id: 'userName',
          name: 'Username',
          field: 'userName',
          type: FieldType.string,
          width: 150
        },
        {
          id: 'canApprove',
          name: 'Can Approve',
          field: 'canApprove',
          type: FieldType.boolean,
          formatter: Formatters.checkmark,
          width: 100
        }
      ]);

      setGridOptions({
        enableTreeData: true,
        treeDataOptions: {
          columnId: 'file',
          childrenPropName: 'approvers'
        },
        enableCheckboxSelector: true,
        enableRowSelection: true,
        rowSelectionOptions: {
          selectActiveRow: false,
          onSelectAll: (checked) => {
            const newDataset = dataset.map(group => ({
              ...group,
              __selected: checked,
              approvers: group.approvers.map(approver => ({
                ...approver,
                __selected: checked
              }))
            }));
            setDataset(newDataset);
          },
          onRowSelectionChanged: (e, args) => {
            const { rows } = args;
            const newDataset = dataset.map(group => ({
              ...group,
              __selected: rows.includes(group.id),
              approvers: group.approvers.map(approver => ({
                ...approver,
                __selected: rows.includes(approver.id)
              }))
            }));
            setDataset(newDataset);
          }
        }
      });
    }
  }, [approverGroups]);

  if (!approverGroups) return <SpinningIcon iconName="refresh" spin={approverGroups === undefined} />;

  return (
    <div style={{ width: '100%', height: '500px' }}>
      <SlickgridReact
        gridId="approversGrid"
        columnDefinitions={columns}
        gridOptions={gridOptions}
        dataset={dataset}
      />
    </div>
  );
};

export default ApproversView;


=====================================

import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import { SlickgridReact, Column, GridOption, FieldType, Formatters } from 'slickgrid-react';
import { PathApprover, QuackApproverGroup } from "./interfaces/interfaces";
import { SpinningIcon } from "./SpinningIcon";

type ApproverViewProp = {
  approverGroups?: QuackApproverGroup[];
  onUserClick?: (approver: PathApprover, checked: boolean) => void;
  onUserGroupClick?: (group: QuackApproverGroup, checked: boolean) => void;
  isReviewerSelectable: boolean;
  selectedUsers?: PathApprover[] | null;
  onClickGroupLink?: (group: QuackApproverGroup) => void;
};

const ApproversView: React.FC<ApproverViewProp> = ({ approverGroups, selectedUsers, isReviewerSelectable, onUserClick, onUserGroupClick, onClickGroupLink }) => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [gridOptions, setGridOptions] = useState<GridOption>({});

  useEffect(() => {
    if (approverGroups) {
      const formattedData = approverGroups.map(group => ({
        id: uuidv4(),
        file: group.roleName,
        approvers: group.approvers.map(approver => ({
          id: uuidv4(),
          file: approver.displayName,
          userName: approver.userName,
          canApprove: approver.canApprove
        }))
      }));

      setDataset(formattedData);

      setColumns([
        {
          id: 'file',
          name: 'Approvers',
          field: 'file',
          type: FieldType.string,
          formatter: Formatters.tree,
          width: 200
        },
        {
          id: 'userName',
          name: 'Username',
          field: 'userName',
          type: FieldType.string,
          width: 150
        },
        {
          id: 'canApprove',
          name: 'Can Approve',
          field: 'canApprove',
          type: FieldType.boolean,
          formatter: Formatters.checkmark,
          width: 100
        }
      ]);

      setGridOptions({
        enableTreeData: true,
        treeDataOptions: {
          columnId: 'file',
          childrenPropName: 'approvers'
        },
        enableCheckboxSelector: isReviewerSelectable,
        enableRowSelection: isReviewerSelectable,
        rowSelectionOptions: {
          selectActiveRow: false
        },
        enableCheckboxSelector: true,
        enableRowSelection: true,
        rowSelectionOptions: {
          selectActiveRow: false
        },
        onSelectedRowsChanged: (e, args) => {
          const selectedRows = args.rows;
          const newDataset = dataset.map(group => ({
            ...group,
            __selected: selectedRows.includes(group.id),
            approvers: group.approvers.map(approver => ({
              ...approver,
              __selected: selectedRows.includes(approver.id)
            }))
          }));
          setDataset(newDataset);
        }
      });
    }
  }, [approverGroups]);

  if (!approverGroups) return <SpinningIcon iconName="refresh" spin={approverGroups === undefined} />;

  return (
    <div style={{ width: '100%', height: '500px' }}>
      <SlickgridReact
        gridId="approversGrid"
        columnDefinitions={columns}
        gridOptions={gridOptions}
        dataset={dataset}
      />
    </div>
  );
};

export default ApproversView;

=================================

const approversTreeFormatter = (
  row: number, 
  cell: number, 
  value: any, 
  columnDef: Column, 
  dataContext: any, 
  grid: SlickGrid
) => {
  const defaultTreeFormatter = Formatters.tree(row, cell, value, columnDef, dataContext, grid); // Maintain tree structure

  let checkbox = null;
  if (dataContext.isGroup) {
    const checked = dataContext.approvers.every((approver: PathApprover) => dataContext.selectedUserNames.has(approver.userName));
    checkbox = (<input type="checkbox" checked={checked} onChange={() => dataContext.onUserGroupClick?.(dataContext, !checked)} />);
  } else if (dataContext.isApprover) {
    const checked = dataContext.selectedUserNames.has(dataContext.approver.userName);
    checkbox = (<input type="checkbox" checked={checked} onChange={() => dataContext.onUserClick?.(dataContext.approver, !checked)} />);
  }

  const renderedElement = dataContext.isGroup ? (
    <span>{checkbox} {createCopyLink(dataContext.name, dataContext.approvers.map((x: PathApprover) => x.powwow).join('|'), `Click to copy initials and select all reviewers in ${dataContext.name}`)}</span>
  ) : (
    <span>{checkbox} {dataContext.name} {userToLink(dataContext.approver.userName, dataContext.approver.powwow)} {dataContext.approver.powwow}</span>
  );

  return renderElement(<span>{renderedElement}{defaultTreeFormatter}</span>);
};
