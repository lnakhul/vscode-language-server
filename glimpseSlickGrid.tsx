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

// Helper to render custom elements post tree rendering
const addCustomElements = (
  isReviewerSelectable: boolean,
  selectedUserNames: Set<string>,
  onUserClick?: (approver: PathApprover, checked: boolean) => void,
  onUserGroupClick?: (group: QuackApproverGroup, checked: boolean) => void
) => (cellNode: HTMLElement, row: number, dataContext: any) => {
  let checkbox = null;

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

  if (checkbox) {
    const container = document.createElement('div');
    ReactDOM.render(checkbox, container);
    if (container.firstChild) {
      // Add the checkbox at the beginning of the cell
      cellNode.prepend(container.firstChild);
    }
  }

  if (dataContext.isGroup) {
    const initials = dataContext.approvers.map((x: PathApprover) => x.powwow).join('|');
    const tooltip = `Click to copy initials and select all reviewers in ${dataContext.name}`;
    const copyLink = createCopyLink(dataContext.name, initials, tooltip);

    const container = document.createElement('div');
    ReactDOM.render(<span>{copyLink}</span>, container);
    if (container.firstChild) {
      // Append the copy link at the end of the cell
      cellNode.appendChild(container.firstChild);
    }
  }

  if (dataContext.isApprover) {
    const userLink = userToLink(dataContext.approver.userName, dataContext.approver.powwow);

    const container = document.createElement('div');
    ReactDOM.render(
      <span>
        {dataContext.name} {userLink} {dataContext.approver.powwow}
      </span>,
      container
    );
    if (container.firstChild) {
      // Append the approver information at the end of the cell
      cellNode.appendChild(container.firstChild);
    }
  }
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

  const selectedUserNames = new Set<string>(selectedUsers?.map((val) => val.userName));

  // Prepare the tree data structure
  const data = useMemo(() => {
    const rows: any[] = [];
    approverGroups?.forEach((group) => {
      const groupId = uuidv4();
      rows.push({
        id: groupId,
        name: group.roleName,
        isGroup: true,
        __hasChildren: true, // Group has child approvers
        approvers: group.approvers,
      });
      group.approvers.forEach((approver) => {
        rows.push({
          id: uuidv4(),
          name: approver.displayName,
          __parentId: groupId, // Link approver to parent group
          isApprover: true,
          approver,
        });
      });
    });
    return rows;
  }, [approverGroups]);

  // Column definition for the tree data
  const columns: Column[] = [
    {
      id: "name",
      name: "Name",
      field: "name",
      formatter: Formatters.tree, // Directly use tree formatter for collapsing/expanding
      asyncPostRender: addCustomElements(isReviewerSelectable, selectedUserNames, onUserClick, onUserGroupClick), // Use asyncPostRender for custom functionality
      sortable: true,
      filterable: true,
      width: 300,
    }
  ];

  // SlickGrid options for tree data
  const options: GridOption = {
    enableTreeData: true, // Enable tree functionality
    treeDataOptions: {
      columnId: "name", // The column with tree data
      parentPropName: "__parentId", // Parent-child linking
      hasChildrenPropName: "__hasChildren", // Identify rows with children
      initiallyCollapsed: false, // Set to true if you want initially collapsed
    },
    enableSorting: true,
    enableFiltering: true,
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
