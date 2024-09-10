import React, { useMemo } from "react";
import { SlickgridReact, Column, GridOption, Formatters, SlickGrid } from "slickgrid-react";
import { v4 as uuidv4 } from "uuid";
import { SpinningIcon } from "./SpinningIcon";
import { PathApprover, QuackApproverGroup } from "./interfaces/interfaces";
import { createCopyLink, userToLink } from "../shared/sre/reactFunctions";
import ReactDOM from "react-dom";

type PathApprover = {
  displayName: string;
  powwow: string;
  userName: string;
  nbkid: string;
  canApprove: boolean;
};

type QuackApproverGroup = {
  roleName: string;
  approvers: PathApprover[];
};

type ApproverViewProp = {
  approverGroups?: QuackApproverGroup[];
  onUserClick?: (approver: PathApprover, checked: boolean) => void;
  onUserGroupClick?: (group: QuackApproverGroup, checked: boolean) => void;
  isReviewerSelectable: boolean;
  selectedUsers?: PathApprover[] | null;
  onClickGroupLink?: (group: QuackApproverGroup) => void;
};

const renderElement = (jsx: React.ReactElement): HTMLElement => {
  const container = document.createElement("div");
  ReactDOM.render(jsx, container);
  return container.childElementCount === 1 ? container.firstElementChild as HTMLElement : container;
};

function approversTreeFormatter(
  isReviewerSelectable: boolean,
  selectedUserNames: Set<string>,
  onUserClick?: (approver: PathApprover, checked: boolean) => void,
  onUserGroupClick?: (group: QuackApproverGroup, checked: boolean) => void
) {
  return (_row: number, _cell: number, value: any, _columnDef: Column, dataContext: any) => {
    let checkbox = null;
    if (isReviewerSelectable) {
      if (dataContext.isGroup) {
        const checked = dataContext.approvers.every((val: PathApprover) => selectedUserNames.has(val.userName));
        checkbox = (<input type="checkbox" checked={checked} onChange={() => onUserGroupClick?.(dataContext, !checked)} />);
      } else if (dataContext.isApprover) {
        const checked = selectedUserNames.has(dataContext.approver.userName);
        checkbox = (<input type="checkbox" checked={checked} onChange={() => onUserClick?.(dataContext.approver, !checked)} />);
      }
    }

    if (dataContext.isGroup) {
      const initials = dataContext.approvers.map((x: PathApprover) => x.powwow).join('|');
      const tooltip = `Click to copy initials and select all reviewers in ${dataContext.name}`;
      return renderElement(<span>{checkbox} {createCopyLink(dataContext.name, initials, tooltip)}</span>);
    } else if (dataContext.isApprover) {
      return renderElement(<span>{checkbox} {dataContext.name} {userToLink(dataContext.approver.userName, dataContext.approver.powwow)} {dataContext.approver.powwow}</span>);
    }
    return renderElement(value);
  };
}

const treeFormatter: Formatter = (_row, _cell, value, _columnDef, dataContext, grid) => {
  const gridOptions = grid.getOptions();
  const treeLevelPropName = gridOptions.treeDataOptions?.levelPropName || '__treeLevel';
  if (value === null || value === undefined || dataContext === undefined) {
    return '';
  }
  const dataView = grid.getData();
  const data = dataView.getItems();
  const identifierPropName = dataView.getIdPropertyName() || 'id';
  const idx = dataView.getIdxById(dataContext[identifierPropName]) as number;
  const treeLevel = dataContext[treeLevelPropName];
  const spacer = `<span style="display:inline-block; width:${(15 * treeLevel)}px;"></span>`;

  const customFormatter = approversTreeFormatter(true, new Set(), undefined, undefined);
  const customContent = customFormatter(_row, _cell, value, _columnDef, dataContext);

  if (data[idx + 1]?.[treeLevelPropName] > data[idx][treeLevelPropName] || data[idx]['__hasChildren']) {
    if (dataContext.__collapsed) {
      return `<span class="hidden"></span>${spacer} <span class="slick-group-toggle collapsed" level="${treeLevel}"></span>${customContent.outerHTML}`;
    } else {
      return `<span class="hidden"></span>${spacer} <span class="slick-group-toggle expanded" level="${treeLevel}"></span>${customContent.outerHTML}`;
    }
  } else {
    return `<span class="hidden"></span>${spacer} <span class="slick-group-toggle" level="${treeLevel}"></span>${customContent.outerHTML}`;
  }
};

const ApproversView: React.FC<ApproverViewProp> = ({ approverGroups, selectedUsers, isReviewerSelectable, onUserClick, onUserGroupClick, onClickGroupLink }) => {
  if (!approverGroups) return <SpinningIcon iconName="refresh" spin={approverGroups === undefined} />;

  const selectedUserNames = new Set<string>(selectedUsers?.map(val => val.userName));

  const data = useMemo(() => {
    const rows: any[] = [];
    approverGroups?.forEach(group => {
      const groupId = uuidv4();
      rows.push({
        id: groupId,
        name: group.roleName,
        isGroup: true,
        __hasChildren: true, 
        approvers: group.approvers
      });
      group.approvers.forEach(approver => {
        rows.push({
          id: uuidv4(),
          name: approver.displayName,
          __parentId: groupId,
          isApprover: true,
          approver
        });
      });
    });
    return rows;
  }, [approverGroups]);

  const columns: Column[] = [
    {
      id: "name",
      name: "Name",
      field: "name",
      formatter: treeFormatter,
      minWidth: 300
    }
  ];

  const options: GridOption = {
    enableTreeData: true,
    treeDataOptions: {
      columnId: "name", 
      parentPropName: "__parentId", 
      hasChildrenPropName: "__hasChildren", 
      initiallyCollapsed: false,  // set to false to see all rows
    },
    enableCheckboxSelector: false, 
    multiColumnSort: false,
    enableFiltering: true,
    enableSorting: true,
  };

  return (
      <SlickgridReact
        gridId="approversGrid"
        columnDefinitions={columns}
        dataset={data}
        gridOptions={options}
      />
  );
};

export default ApproversView;
