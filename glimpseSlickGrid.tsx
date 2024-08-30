import React, { useMemo } from "react";
import { SlickgridReact, Column, GridOption, Formatters } from "slickgrid-react";
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

function customTreeFormatter(
  isReviewerSelectable: boolean,
  selectedUserNames: Set<string>,
  createCopyLink: (name: string, initials: string, tooltip: string) => string,
  userToLink: (userName: string, powwow: string) => string,
  onUserClick?: (approver: PathApprover, checked: boolean) => void,
  onUserGroupClick?: (group: QuackApproverGroup, checked: boolean) => void
) {
  return (row, cell, value, columnDef, dataContext) => {
    const treeFormatter = Formatters.tree(row, cell, value, columnDef, dataContext);

    let checkbox = "";
    if (isReviewerSelectable) {
      if (dataContext.isGroup) {
        const checked = dataContext.approvers.every((val: PathApprover) => selectedUserNames.has(val.userName));
        checkbox = `<input type="checkbox" ${checked ? "checked" : ""} onclick="(${onUserGroupClick?.toString()})(${JSON.stringify(dataContext)}, ${!checked})" />`;
      } else if (dataContext.isApprover) {
        const checked = selectedUserNames.has(dataContext.approver.userName);
        checkbox = `<input type="checkbox" ${checked ? "checked" : ""} onclick="(${onUserClick?.toString()})(${JSON.stringify(dataContext.approver)}, ${!checked})" />`;
      }
    }

    if (dataContext.isGroup) {
      const initials = dataContext.approvers.map((x: PathApprover) => x.powwow).join('|');
      const tooltip = `Click to copy initials and select all reviewers in ${dataContext.name}`;
      return `${treeFormatter} ${checkbox} ${createCopyLink(dataContext.name, initials, tooltip)}`;
    } else if (dataContext.isApprover) {
      return `${treeFormatter} ${checkbox} ${dataContext.name} ${userToLink(dataContext.approver.userName, dataContext.approver.powwow)} ${dataContext.approver.powwow}`;
    }
    return treeFormatter;
  };
}

const ApproversView: React.FC<ApproverViewProp> = ({
  approverGroups,
  selectedUsers,
  isReviewerSelectable,
  onUserClick,
  onUserGroupClick,
  onClickGroupLink,
}) => {
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
        __hasChildren: true, // Indicate this row has children
        __parentId: null, // Root node, no parent
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
      formatter: customTreeFormatter(isReviewerSelectable, selectedUserNames, createCopyLink, userToLink, onUserClick, onUserGroupClick),
      exportCustomFormatter: Formatters.treeExport,
      width: 220,
      cssClass: 'cell-title',
      queryFieldSorter: 'id',
      type: 'string'
    }
  ];

  const options: GridOption = {
    enableTreeData: true,
    treeDataOptions: {
      columnId: "name",
      parentPropName: "__parentId",
      hasChildrenPropName: "__hasChildren",
      initiallyCollapsed: false // set to false to see all rows
    },
    enableCheckboxSelector: false, // Disable default checkbox column
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
