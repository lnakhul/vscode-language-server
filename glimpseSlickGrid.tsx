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


================================

const treeFormatter = (
  isReviewerSelectable: boolean,
  selectedUserNames: Set<string>,
  onUserClick?: (approver: PathApprover, checked: boolean) => void,
  onUserGroupClick?: (group: QuackApproverGroup, checked: boolean) => void,
  isReviewPage?: boolean // This determines which page we're on
) => {
  return (_row: number, _cell: number, value: any, _columnDef: Column, dataContext: any, grid: SlickGrid) => {
    const treeHtml = Formatters.tree(_row, _cell, value, _columnDef, dataContext, grid);
    
    // Only apply custom formatting on the review page
    if (isReviewPage) {
      const customContent = approversTreeFormatter(isReviewerSelectable, selectedUserNames, onUserClick, onUserGroupClick)(
        _row, _cell, value, _columnDef, dataContext
      );
      
      // Return combined HTML for tree structure and custom content
      return `${treeHtml} ${customContent.outerHTML}`;
    }

    // Just return the tree structure if on the summary page (without checkboxes, links, etc.)
    return treeHtml;
  };
};





formatter: treeFormatter(isReviewerSelectable, selectedUserNames, onUserClick, onUserGroupClick, isReviewPage),


=================

const treeFormatter: Formatter = (_row, _cell, value, _columnDef, dataContext, grid) => {
  const gridOptions = grid.getOptions();
  const treeLevelPropName = gridOptions.treeDataOptions?.levelPropName || '__treeLevel';

  if (!value || !dataContext) return '';

  const dataView = grid.getData();
  const data = dataView.getItems();
  const identifierPropName = dataView.getIdPropertyName() || 'id';
  const idx = dataView.getIdxById(dataContext[identifierPropName]) as number;
  const treeLevel = dataContext[treeLevelPropName];
  
  const spacer = `<span style="display:inline-block; width:${15 * treeLevel}px;"></span>`;

  // Custom content generated by approversTreeFormatter
  const customFormatter = approversTreeFormatter(true, new Set(), undefined, undefined);
  const customContent = customFormatter(_row, _cell, value, _columnDef, dataContext);

  const treeToggle = data[idx + 1]?.[treeLevelPropName] > data[idx][treeLevelPropName] || data[idx]['__hasChildren'];

  // If the row has children, apply collapsing logic
  if (treeToggle) {
    const collapsedClass = dataContext.__collapsed ? 'collapsed' : 'expanded';
    const treeToggleIcon = `<span class="slick-group-toggle ${collapsedClass}" level="${treeLevel}"></span>`;
    return `${spacer} ${treeToggleIcon} ${customContent.outerHTML}`;
  }

  return `${spacer} ${customContent.outerHTML}`;
};

==========================================

const treeFormatter = (
  isReviewerSelectable: boolean,
  selectedUserNames: Set<string>,
  onUserClick?: (approver: PathApprover, checked: boolean) => void,
  onUserGroupClick?: (group: QuackApproverGroup, checked: boolean) => void
): Formatter => {
  return (_row, _cell, value, _columnDef, dataContext, grid) => {
    const gridOptions = grid.getOptions();
    const treeLevelPropName = gridOptions.treeDataOptions?.levelPropName || '__treeLevel';
  
    if (!value || !dataContext) return '';
  
    const dataView = grid.getData();
    const data = dataView.getItems();
    const identifierPropName = dataView.getIdPropertyName() || 'id';
    const idx = dataView.getIdxById(dataContext[identifierPropName]) as number;
    const treeLevel = dataContext[treeLevelPropName];
    const spacer = `<span style="display:inline-block; width:${15 * treeLevel}px;"></span>`;
  
    const customFormatter = approversTreeFormatter(isReviewerSelectable, selectedUserNames, onUserClick, onUserGroupClick);
    const customContent = customFormatter(_row, _cell, value, _columnDef, dataContext);
  
    const treeToggle = data[idx + 1]?.[treeLevelPropName] > data[idx][treeLevelPropName] || data[idx]['__hasChildren'];
  
    if (treeToggle) {
      const collapsedClass = dataContext.__collapsed ? 'collapsed' : 'expanded';
      const treeToggleIcon = `<span class="slick-group-toggle ${collapsedClass}" level="${treeLevel}"></span>`;
      return `${spacer} ${treeToggleIcon} ${customContent.outerHTML}`;
    }
  
    return `${spacer} ${customContent.outerHTML}`;
  };
};

-----------------------------------

  // Force re-render of the grid when the component mounts or when approverGroups change
  useEffect(() => {
    const gridElement = document.getElementById("approversGrid");
    if (gridElement) {
      window.dispatchEvent(new Event('resize'));
    }
  }, [approverGroups]);

  // Force re-render of the grid when the tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      const gridElement = document.getElementById("approversGrid");
      if (gridElement && !document.hidden) {
        window.dispatchEvent(new Event('resize'));
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);


=============================================

import React, { useMemo } from "react";
import { SlickgridReact, Column, GridOption, Formatter } from "slickgrid-react";
import { v4 as uuidv4 } from "uuid";
import { SpinningIcon } from "./SpinningIcon";
import { PathApprover, QuackApproverGroup } from "./interfaces/interfaces";
import { createCopyLink, userToLink } from "../shared/sre/reactFunctions";
import ReactDOM from "react-dom";

// Helper function for React element rendering
const renderElement = (jsx: React.ReactElement): HTMLElement => {
  const container = document.createElement("div");
  ReactDOM.render(jsx, container);
  return container.childElementCount === 1 ? container.firstChild as HTMLElement : container;
};

// Custom function to render the approver list view inside a SlickGrid cell
const approverListView = (
  isReviewerSelectable: boolean,
  selectedUserNames: Set<string>,
  onUserClick?: (approver: PathApprover, checked: boolean) => void,
  onUserGroupClick?: (group: QuackApproverGroup, checked: boolean) => void
) => {
  return (_row: number, _cell: number, value: any, _columnDef: Column, dataContext: any) => {

    let checkbox = null;
    if (isReviewerSelectable) {
      if (dataContext.isGroup) {
        const checked = dataContext.approvers.every((val: PathApprover) => selectedUserNames.has(val.userName));
        checkbox = (
          <input type="checkbox" checked={checked} onChange={() => onUserGroupClick?.(dataContext, !checked)} />
        );
      } else if (dataContext.isApprover) {
        const checked = selectedUserNames.has(dataContext.approver.userName);
        checkbox = (
          <input type="checkbox" checked={checked} onChange={() => onUserClick?.(dataContext.approver, !checked)} />
        );
      }
    }

    if (dataContext.isGroup) {
      const initials = dataContext.approvers.map((x: PathApprover) => x.powwow).join('|');
      const tooltip = `Click to copy initials and select all reviewers in ${dataContext.name}`;
      return renderElement(
        <span>{checkbox} {createCopyLink(dataContext.name, initials, tooltip)}</span>
      );
    } else if (dataContext.isApprover) {
      return renderElement(
        <span>{checkbox} {dataContext.name} {userToLink(dataContext.approver.userName, dataContext.approver.powwow)} {dataContext.approver.powwow}</span>
      );
    }
    return renderElement(value);
  };
};

// Formatter function for the tree structure
const ApproverTreeFormatter = (
  isReviewerSelectable: boolean,
  selectedUserNames: Set<string>,
  onUserClick?: (approver: PathApprover, checked: boolean) => void,
  onUserGroupClick?: (group: QuackApproverGroup, checked: boolean) => void
): Formatter => {
  return (_row, _cell, value, _columnDef, dataContext, grid) => {
    const gridOptions = grid.getOptions();
    const treeLevelPropName = gridOptions.treeDataOptions?.levelPropName || '__treeLevel';

    if (!value || !dataContext) return '';

    const dataView = grid.getData();
    const data = dataView.getItems();
    const identifierPropName = dataView.getIdPropertyName() || 'id';
    const idx = dataView.getIdxById(dataContext[identifierPropName]) as number;
    const treeLevel = dataContext[treeLevelPropName];
    const spacer = `<span style="display:inline-block; width:${15 * treeLevel}px;"></span>`;

    const customFormatter = approverListView(isReviewerSelectable, selectedUserNames, onUserClick, onUserGroupClick);
    const customContent = customFormatter(_row, _cell, value, _columnDef, dataContext);

    const treeToggle = data[idx + 1]?.[treeLevelPropName] > data[idx][treeLevelPropName] || data[idx]['__hasChildren'];

    if (treeToggle) {
      const collapsedClass = dataContext.__collapsed ? 'collapsed' : 'expanded';
      const treeToggleIcon = `<span class="slick-group-toggle ${collapsedClass}" level="${treeLevel}"></span>`;
      return `${spacer} ${treeToggleIcon} ${customContent.outerHTML}`;
    }

    return `${spacer} <span class="slick-group-toggle" level="${treeLevel}"></span>  ${customContent.outerHTML}`;
  };
};

// Main Approvers View Component
const ApproversView: React.FC<ApproverViewProp> = ({
  approverGroups,
  selectedUsers,
  isReviewerSelectable,
  onUserClick,
  onUserGroupClick,
  onClickGroupLink
}) => {
  if (!approverGroups) return <SpinningIcon iconName="refresh" spin={approverGroups === undefined} />;

  const selectedUserNames = useMemo(() => new Set<string>(selectedUsers?.map(val => val.userName) ?? []), [selectedUsers]);

  // Memoize the data rows based on approverGroups to avoid unnecessary renders
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
      formatter: ApproverTreeFormatter(isReviewerSelectable, selectedUserNames, onUserClick, onUserGroupClick)
    }
  ];

  const options: GridOption = {
    enableCellNavigation: true,
    enableColumnReorder: false,
    enableAutoTooltip: true,
    enableTreeData: true,
    treeDataOptions: {
      columnId: "name",
      parentPropName: "__parentId",
      hasChildrenPropName: "__hasChildren",
      initiallyCollapsed: false // You can control this as needed
    }
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

