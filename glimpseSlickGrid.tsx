import React, { useMemo, useEffect, useRef } from "react";
import { SlickgridReact, Column, GridOption } from "slickgrid-react";
import { v4 as uuidv4 } from "uuid";
import { SpinningIcon } from "./SpinningIcon";
import { FormLabel } from "./FormLabel";
import { createCopyLink, userToLink } from "../shared/sre/reactFunctions";

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

type ApproverTreeItem = {
  id: string;
  name: string;
  parentId?: string;
  children?: ApproverTreeItem[];
  type: "group" | "approver";
  userName?: string;
  powwow?: string;
  checked?: boolean;
  selectable: boolean;
};

type ApproverViewProp = {
  approverGroups?: QuackApproverGroup[];
  onUserClick?: (approver: PathApprover, checked: boolean) => void;
  onUserGroupClick?: (group: QuackApproverGroup, checked: boolean) => void;
  isReviewerSelectable: boolean;
  selectedUsers?: Set<string>;
  onClickGroupLink?: (group: QuackApproverGroup) => void;
};

export const ApproversView: React.FC<ApproverViewProp> = ({
  approverGroups,
  onUserClick,
  onUserGroupClick,
  isReviewerSelectable,
  selectedUsers,
  onClickGroupLink,
}) => {
  const gridRef = useRef<SlickgridReact | null>(null);

  // Convert the approver groups into tree data format
  const treeData: ApproverTreeItem[] = useMemo(() => {
    if (!approverGroups) return [];

    return approverGroups.flatMap((group) => {
      const groupId = uuidv4();
      const groupItem: ApproverTreeItem = {
        id: groupId,
        name: group.roleName,
        type: "group",
        selectable: false,
      };

      const approversItems: ApproverTreeItem[] = group.approvers.map((approver) => ({
        id: uuidv4(),
        name: approver.displayName,
        parentId: groupId,
        type: "approver",
        userName: approver.userName,
        powwow: approver.powwow,
        checked: selectedUsers?.has(approver.userName),
        selectable: isReviewerSelectable,
      }));

      return [groupItem, ...approversItems];
    });
  }, [approverGroups, selectedUsers, isReviewerSelectable]);

  useEffect(() => {
    if (gridRef.current && treeData.length > 0) {
      gridRef.current.dataset = treeData;
    }
  }, [treeData]);

  if (!approverGroups) return <SpinningIcon iconName="refresh" spin={approverGroups === undefined} />;

  const columns: Column[] = [
    {
      id: "name",
      name: "Approver Groups",
      field: "name",
      formatter: (row, cell, value, columnDef, dataContext) => {
        let content;
        if (dataContext.type === "group") {
          content = (
            <span onClick={() => onClickGroupLink?.(dataContext)}>{value}</span>
          );
        } else if (dataContext.type === "approver") {
          content = (
            <>
              {dataContext.selectable && (
                <input
                  type="checkbox"
                  checked={dataContext.checked}
                  onChange={(e) => onUserClick?.(dataContext, e.target.checked)}
                />
              )}
              {`${dataContext.name} (${dataContext.powwow})`}
            </>
          );
        }
        return content;
      },
      cssClass: "slickgrid-column",
    },
  ];

  const gridOptions: GridOption = {
    enableTreeData: true,
    treeDataOptions: {
      columnId: "name",
      parentPropName: "parentId",
      identifierPropName: "id",
    },
    enableCellNavigation: true,
    enableColumnReorder: false,
    enableSorting: false,
    forceFitColumns: true,
  };

  return (
    <div style={{ height: "500px" }}>
      <SlickgridReact
        ref={gridRef}
        gridId={`approvers_grid`}
        columnDefinitions={columns}
        gridOptions={gridOptions}
        dataset={treeData}
      />
    </div>
  );
};

export default ApproversView;


=======================================


import React, { useMemo } from "react";
import { SlickgridReact, Column, GridOption } from "slickgrid-react";
import { v4 as uuidv4 } from "uuid";
import { VSCodeCheckbox } from "@vscode/webview-ui-toolkit/react";
import { SpinningIcon } from "./SpinningIcon";
import { PathApprover, QuackApproverGroup } from "./interfaces/interfaces";
import { createCopyLink, userToLink } from "../shared/sre/reactFunctions";
import FormLabel from "./FormLabel";

type ApproverViewProp = {
  approverGroups?: QuackApproverGroup[];
  onUserClick?: (approver: PathApprover, checked: boolean) => void;
  onUserGroupClick?: (group: QuackApproverGroup, checked: boolean) => void;
  isReviewerSelectable: boolean;
  selectedUsers?: PathApprover[] | null;
  onClickGroupLink?: (group: QuackApproverGroup) => void;
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
        approvers: group.approvers
      });
      group.approvers.forEach(approver => {
        rows.push({
          id: uuidv4(),
          name: approver.displayName,
          parent: groupId,
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
      formatter: (_row, _cell, value, _columnDef, dataContext) => {
        let checkbox = "";
        if (isReviewerSelectable) {
          if (dataContext.isGroup) {
            const checked = dataContext.approvers.every((val: PathApprover) => selectedUserNames.has(val.userName));
            checkbox = `<input type="checkbox" ${checked ? "checked" : ""} />`;
          } else if (dataContext.isApprover) {
            const checked = selectedUserNames.has(dataContext.approver.userName);
            checkbox = `<input type="checkbox" ${checked ? "checked" : ""} />`;
          }
        }

        if (dataContext.isGroup) {
          const initials = dataContext.approvers.map((x: PathApprover) => x.powwow).join('|');
          const tooltip = `Click to copy initials and select all reviewers in ${dataContext.name}`;
          return `<span>${checkbox} ${createCopyLink(dataContext.name, initials, tooltip)}</span>`;
        } else if (dataContext.isApprover) {
          return `<span>${checkbox} ${dataContext.name} ${userToLink(dataContext.approver.userName, dataContext.approver.powwow)} ${dataContext.approver.powwow}</span>`;
        }
        return value;
      }
    }
  ];

  const options: GridOption = {
    enableTreeData: true,
    treeDataOptions: {
      columnId: "name",
      parentPropName: "parent",
      hasChildrenPropName: "isGroup",
      initiallyCollapsed: false
    },
    enableCheckboxSelector: false, // Disable default checkbox column
    multiColumnSort: false,
    enableFiltering: true
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
