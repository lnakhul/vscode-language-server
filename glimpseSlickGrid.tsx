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
