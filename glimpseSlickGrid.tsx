import React, { useEffect, useMemo, useRef } from "react";
import { SlickgridReact, Column, GridOption } from "slickgrid-react";
import { v4 as uuidv4 } from 'uuid';
import { SpinningIcon } from "./SpinningIcon";
import { PathApprover, QuackApproverGroup } from "./interfaces/interfaces";

// Define the interface for the SlickGrid row data
interface ApproverGridRowData {
    id: string;
    parent: string | null; // Parent ID for tree structure
    roleName?: string;
    displayName?: string;
    powwow?: string;
    userName?: string;
    canApprove?: boolean;
    isGroup: boolean; // Distinguishes between groups and individual approvers
}

// Function to transform approver data into the SlickGrid format
const convertApproversToGridData = (approverGroups: QuackApproverGroup[]): ApproverGridRowData[] => {
    const data: ApproverGridRowData[] = [];
    approverGroups.forEach(group => {
        const groupId = uuidv4();
        data.push({
            id: groupId,
            parent: null,
            roleName: group.roleName,
            isGroup: true
        });
        group.approvers.forEach(approver => {
            data.push({
                id: uuidv4(),
                parent: groupId,
                displayName: approver.displayName,
                powwow: approver.powwow,
                userName: approver.userName,
                canApprove: approver.canApprove,
                isGroup: false
            });
        });
    });
    return data;
};

type ApproversViewProps = {
    approverGroups?: QuackApproverGroup[];
    isReviewerSelectable: boolean;
    selectedUsers?: Set<string>;
    onUserClick?: (approver: PathApprover, checked: boolean) => void;
    onUserGroupClick?: (group: QuackApproverGroup) => void;
};

const ApproversView: React.FC<ApproversViewProps> = ({ 
    approverGroups, 
    isReviewerSelectable, 
    selectedUsers, 
    onUserClick, 
    onUserGroupClick 
}) => {
    const gridRef = useRef<SlickgridReact | null>(null);

    // Use a spinner if approver groups are not yet available
    if (!approverGroups) return <SpinningIcon iconName="refresh" spin={true} />;

    const data = useMemo(() => convertApproversToGridData(approverGroups), [approverGroups]);

    // Define the SlickGrid columns
    const columns: Column<ApproverGridRowData>[] = [
        {
            id: 'roleName',
            name: 'Group/Approver',
            field: 'roleName',
            formatter: (_row, _cell, value, columnDef, dataContext) => {
                if (dataContext.isGroup) {
                    // Group Header
                    return `<span class="slickgroup-header">${value}</span>`;
                } else {
                    // Individual Approver
                    return `<span class="slickgroup-approver">${dataContext.displayName} (${dataContext.powwow})</span>`;
                }
            },
            cssClass: 'slick-cell',
            width: 200
        },
        ...(isReviewerSelectable ? [{
            id: 'select',
            name: 'Select',
            field: 'canApprove',
            formatter: (_row, _cell, value, columnDef, dataContext) => {
                if (!dataContext.isGroup) {
                    return `<input type="checkbox" ${value ? "checked" : ""} ${dataContext.canApprove ? "" : "disabled"}/>`;
                }
                return '';
            },
            cssClass: 'slick-cell',
            width: 50
        }] : [])
    ];

    const options: GridOption = {
        enableTreeData: true,
        treeDataOptions: {
            columnId: 'roleName',
            parentPropName: 'parent',
            childrenPropName: 'children',
            collapsed: true
        },
        enableCellNavigation: true,
        enableColumnReorder: false,
        forceFitColumns: true
    };

    // Resize grid when it becomes visible
    useEffect(() => {
        const observer = new MutationObserver(() => {
            if (gridRef.current) {
                window.dispatchEvent(new Event("resize"));
            }
        });
        observer.observe(document.body, { attributes: true, childList: true, subtree: true });
        return () => observer.disconnect();
    }, []);

    return (
        <SlickgridReact
            ref={gridRef}
            gridId="approversGrid"
            columnDefinitions={columns}
            gridOptions={options}
            dataset={data}
        />
    );
};

export default ApproversView;



=========================================================



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
    { id: 'name', name: 'Name', field: 'name', width: 200, formatter: (row, cell, value, columnDef, dataContext) => {
      if (dataContext.isGroup) {
        return `<a href="#" title="Click to copy initials: ${dataContext.initials}">${value}</a>`;
      } else {
        return `<a href="#" title="${dataContext.displayName}">${value}</a>`;
      }
    }},
    { id: 'select', name: 'Select', field: 'select', width: 50, formatter: (row, cell, value, columnDef, dataContext) => {
      if (!dataContext.isGroup && isReviewerSelectable) {
        return `<input type="checkbox" ${value ? 'checked' : ''} />`;
      }
      return '';
    }},
  ];

  const rows = useMemo(() => {
    if (!approverGroups) return [];
    const selectedUserNames = new Set<string>(selectedUsers?.map(val => val.userName));
    return approverGroups.flatMap(group => [
      {
        id: uuidv4(),
        name: group.roleName,
        initials: group.approvers.map(x => x.powwow).join('|'),
        isGroup: true,
        parent: null,
        select: group.approvers.every(val => selectedUserNames.has(val.userName))
      },
      ...group.approvers.map(approver => ({
        id: uuidv4(),
        name: approver.userName,
        displayName: approver.displayName,
        isGroup: false,
        parent: group.roleName,
        select: selectedUserNames.has(approver.userName)
      }))
    ]);
  }, [approverGroups, selectedUsers]);

  const options: GridOption = {
    enableCellNavigation: true,
    enableColumnReorder: false,
    forceFitColumns: true,
    treeDataOptions: {
      columnId: 'name',
      childrenPropName: 'children',
      parentPropName: 'parent'
    }
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
