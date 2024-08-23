import React, { useEffect, useMemo, useRef } from "react";
import { SlickgridReact, Column, GridOption } from "slickgrid-react";
import { v4 as uuidv4 } from "uuid";
import { PathApprover, QuackApproverGroup } from "./interfaces/interfaces";
import { createCopyLink, userToLink } from "../shared/sre/reactFunctions";
import { SpinningIcon } from "./SpinningIcon";
import { VSCodeCheckbox } from "@vscode/webview-ui-toolkit/react";

type ApproverViewProp = {
  approverGroups?: QuackApproverGroup[];
  onUserClick?: (approver: PathApprover, checked: boolean) => void;
  onUserGroupClick?: (group: QuackApproverGroup, checked: boolean) => void;
  isReviewerSelectable: boolean;
  selectedUsers?: PathApprover[] | null;
  onClickGroupLink?: (group: QuackApproverGroup) => void;
};

const ApproversView: React.FC<ApproverViewProp> = ({ approverGroups, selectedUsers, isReviewerSelectable, onUserClick, onUserGroupClick, onClickGroupLink }) => {
  const gridRef = useRef<SlickgridReact | null>(null);

  const columns: Column[] = [
    { id: 'group', name: 'Group', field: 'group', width: 100, formatter: (row, cell, value) => value },
    { id: 'approver', name: 'Approver', field: 'approver', width: 100, formatter: (row, cell, value) => value },
    { id: 'select', name: 'Select', field: 'select', width: 50, formatter: (row, cell, value) => {
      return `<input type="checkbox" ${value ? 'checked' : ''} />`;
    }},
  ];

  const rows = useMemo(() => {
    if (!approverGroups) return [];
    const selectedUserNames = new Set<string>(selectedUsers?.map(val => val.userName));
    return approverGroups.flatMap(group => 
      group.approvers.map(approver => ({
        id: uuidv4(),
        group: `<a href="#" title="Click to copy initials: ${approver.powwow}">${group.roleName}</a>`,
        approver: `<a href="#" title="${approver.displayName}">${approver.userName}</a>`,
        select: selectedUserNames.has(approver.userName)
      }))
    );
  }, [approverGroups, selectedUsers]);

  const options: GridOption = {
    enableCellNavigation: true,
    enableColumnReorder: false,
    forceFitColumns: true
  };

  useEffect(() => {
    if (gridRef.current && rows) {
      gridRef.current.dataset = rows;
    }
  }, [rows]);

  if (!approverGroups) return <SpinningIcon iconName="refresh" spin={approverGroups === undefined} />;

  return (
    <SlickgridReact
      ref={gridRef}
      columnDefinitions={columns}
      gridOptions={options}
      dataset={rows}
      gridId="approver_grid"
    />
  );
};

export default ApproversView;
