import React, { useEffect, useMemo, useRef } from "react";
import { SlickgridReact, Column, GridOption, Formatter, SlickgridReactInstance, SlickEventData } from "slickgrid-react";
import { v4 as uuidv4 } from "uuid";
import { SpinningIcon } from "./SpinningIcon";
import { PathApprover, QuackApproverGroup } from "./interfaces/interfaces";
import { createCopyLink } from "../shared/sre/reactFunctions";

type ApproverViewProp = {
  approverGroups?: QuackApproverGroup[];
  onUserClick?: (approver: PathApprover, checked: boolean) => void;
  onUserGroupClick?: (group: QuackApproverGroup, checked: boolean) => void;
  isReviewerSelectable: boolean;
  selectedUsers?: PathApprover[] | null;
  onClickGroupLink?: (group: QuackApproverGroup) => void;
};

const ApproversView: React.FC<ApproverViewProp> = ({
  approverGroups,
  selectedUsers,
  isReviewerSelectable,
  onUserClick,
  onUserGroupClick,
  onClickGroupLink,
}) => {
  if (!approverGroups) return <SpinningIcon iconName="refresh" spin={approverGroups === undefined} />;

  const selectedUserNames = useMemo(() => new Set<string>(selectedUsers?.map((val) => val.userName)), [selectedUsers]);

  const data = useMemo(() => {
    const rows: any[] = [];
    approverGroups?.forEach((group) => {
      const groupId = uuidv4();
      rows.push({
        id: groupId,
        name: group.roleName,
        isGroup: true,
        __hasChildren: true,
        __collapsed: false, // You can set initial collapse state here
        groupData: group,
        children: group.approvers.map((approver) => ({
          id: approver.userName, // Assuming userName is unique
          name: approver.displayName,
          __parentId: groupId,
          isApprover: true,
          approverData: approver,
        })),
      });
    });
    return rows;
  }, [approverGroups]);

  // Define treeFormatter inside the component
  const treeFormatter: Formatter = (_row, _cell, value, _columnDef, dataContext, grid) => {
    const gridOptions = grid.getOptions();
    const treeLevelPropName = gridOptions.treeDataOptions?.levelPropName || "__treeLevel";
    const treeLevel = dataContext[treeLevelPropName];
    const spacer = `<span style="display:inline-block; width:${15 * treeLevel}px;"></span>`;

    if (dataContext.isGroup) {
      const initials = dataContext.groupData.approvers.map((x: PathApprover) => x.powwow).join("|");
      const tooltip = `Click to copy initials: ${initials}`;
      const folderIcon = dataContext.__collapsed ? "mdi-folder" : "mdi-folder-open";
      const isChecked = dataContext.groupData.approvers.every((approver: PathApprover) =>
        selectedUserNames.has(approver.userName)
      )
        ? "checked"
        : "";
      const checkbox = isReviewerSelectable
        ? `<input type="checkbox" data-group-id="${dataContext.id}" ${isChecked} />`
        : "";

      return `
        ${spacer}
        <span class="slick-group-toggle ${dataContext.__collapsed ? "collapsed" : "expanded"}" data-group-id="${dataContext.id}"></span>
        <span class="mdi icon ${folderIcon}"></span>
        ${checkbox}
        <span class="group-name" data-group-id="${dataContext.id}" title="${tooltip}">${value}</span>
      `;
    } else if (dataContext.isApprover) {
      const isChecked = selectedUserNames.has(dataContext.id) ? "checked" : "";
      const checkbox = isReviewerSelectable
        ? `<input type="checkbox" data-approver-id="${dataContext.id}" ${isChecked} />`
        : "";
      const approverName = dataContext.name;
      const userName = dataContext.id;
      const powwow = dataContext.approverData.powwow;
      return `
        ${spacer}
        ${checkbox}
        <span>${approverName} (${userName}) ${powwow}</span>
      `;
    }
    return "";
  };

  const columns: Column[] = [
    { id: "name", name: "Name", field: "name", formatter: treeFormatter },
  ];

  const gridOptions: GridOption = {
    enableCellNavigation: true,
    enableColumnReorder: false,
    syncColumnCellResize: true,
    enableAutoTooltip: true,
    enableHeaderMenu: false,
    enableRowSelection: false,
    showCellSelection: false,
    enableContextMenu: false,
    enableColumnPicker: false,
    enableCheckboxSelector: false,
    enableTreeData: true,
    treeDataOptions: {
      columnId: "name",
      childrenPropName: "children",
      parentPropName: "__parentId",
      hasChildrenPropName: "__hasChildren",
      initiallyCollapsed: false,
    },
    multiColumnSort: false,
    enableFiltering: false,
    enableSorting: false,
  };

  const reactGrid = useRef<SlickgridReactInstance>(null);

  // Set up event handlers
  useEffect(() => {
    const gridObj = reactGrid.current?.slickGrid;
    if (!gridObj) return;

    const onGridClick = (e: SlickEventData, args: any) => {
      const target = e.target as HTMLElement;
      const dataContext = gridObj.getDataItem(args.row);

      // Handle checkbox clicks for groups
      if (target.matches('input[type="checkbox"][data-group-id]')) {
        const groupId = target.getAttribute("data-group-id");
        const checked = (target as HTMLInputElement).checked;
        const groupItem = findGroupById(groupId);
        if (groupItem && onUserGroupClick) {
          onUserGroupClick(groupItem.groupData, checked);
        }
      }

      // Handle checkbox clicks for approvers
      if (target.matches('input[type="checkbox"][data-approver-id]')) {
        const approverId = target.getAttribute("data-approver-id");
        const checked = (target as HTMLInputElement).checked;
        const approverItem = findApproverById(approverId);
        if (approverItem && onUserClick) {
          onUserClick(approverItem.approverData, checked);
        }
      }

      // Handle group name clicks
      if (target.matches("span.group-name[data-group-id]")) {
        const groupId = target.getAttribute("data-group-id");
        const groupItem = findGroupById(groupId);
        if (groupItem) {
          const initials = groupItem.groupData.approvers.map((a: PathApprover) => a.powwow).join("|");
          // Copy initials to clipboard
          navigator.clipboard.writeText(initials).then(() => {
            console.log("Initials copied to clipboard:", initials);
          });
          if (onClickGroupLink) {
            onClickGroupLink(groupItem.groupData);
          }
        }
      }

      // Handle expand/collapse clicks
      if (target.matches("span.slick-group-toggle")) {
        const groupId = target.getAttribute("data-group-id");
        const groupItem = findGroupById(groupId);
        if (groupItem) {
          groupItem.__collapsed = !groupItem.__collapsed;
          gridObj.invalidate();
          gridObj.render();
        }
      }
    };

    gridObj.onClick.subscribe(onGridClick);

    return () => {
      gridObj.onClick.unsubscribe(onGridClick);
    };
  }, [reactGrid.current, onUserClick, onUserGroupClick, onClickGroupLink, selectedUserNames]);

  // Helper function to find an approver by ID
  const findApproverById = (id: string | null) => {
    if (!id) return null;
    for (const group of data) {
      if (group.isGroup && group.children) {
        const approver = group.children.find((approver: any) => approver.id === id);
        if (approver) return approver;
      }
    }
    return null;
  };

  // Helper function to find a group by ID
  const findGroupById = (id: string | null) => {
    if (!id) return null;
    return data.find((group) => group.id === id && group.isGroup) || null;
  };

  return (
    <div id="approvers-grid-container" style={{ width: "100%", height: "500px" }}>
      <SlickgridReact
        ref={reactGrid}
        gridId="approversGrid"
        columnDefinitions={columns}
        gridOptions={gridOptions}
        dataset={data}
      />
    </div>
  );
};

export default ApproversView;
