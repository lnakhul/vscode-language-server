import React, { useEffect, useMemo, useRef } from "react";
import { SlickgridReact, Column, GridOption, Formatter, SlickgridReactInstance, SlickEventData } from "slickgrid-react";
import { v4 as uuidv4 } from "uuid";
import { SpinningIcon } from "./SpinningIcon";
import { PathApprover, QuackApproverGroup } from "./interfaces/interfaces";
import { createCopyLink, userToLink } from "../shared/sre/reactFunctions";

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
        // Adding children directly for tree structure
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

  const columns: Column[] = [
    { id: "name", name: "Name", field: "name", formatter: ApproverTreeFormatter(isReviewerSelectable, selectedUserNames) },
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

  // Define the helper functions

  const isGroupSelected = (group: any, selectedUserNames: Set<string>) => {
    return group.groupData.approvers.every((val: PathApprover) => selectedUserNames.has(val.userName));
  };

  const isApproverSelected = (approver: PathApprover, selectedUserNames: Set<string>) => {
    return selectedUserNames.has(approver.userName);
  };

  function approverListView(
    isReviewerSelectable: boolean,
    selectedUserNames: Set<string>
  ) {
    return (_row: number, _cell: number, value: any, _columnDef: Column, dataContext: any) => {
      let checkboxHtml = '';
      if (isReviewerSelectable) {
        if (dataContext.isGroup) {
          const checked = isGroupSelected(dataContext, selectedUserNames) ? 'checked' : '';
          checkboxHtml = `<input type="checkbox" data-group-id="${dataContext.id}" ${checked} />`;
        } else if (dataContext.isApprover) {
          const checked = isApproverSelected(dataContext.approverData, selectedUserNames) ? 'checked' : '';
          checkboxHtml = `<input type="checkbox" data-approver-id="${dataContext.approverData.userName}" ${checked} />`;
        }
      }

      if (dataContext.isGroup) {
        const initials = dataContext.groupData.approvers.map((x: PathApprover) => x.powwow).join('|');
        const tooltip = `Click to copy initials and select all reviewers in ${dataContext.name}`;
        const groupNameHtml = `<span class="group-name" data-group-id="${dataContext.id}" title="${tooltip}">${dataContext.name}</span>`;
        return `${checkboxHtml} ${groupNameHtml}`;
      } else if (dataContext.isApprover) {
        const userLink = userToLink(dataContext.approverData.userName, dataContext.approverData.powwow);
        return `${checkboxHtml} ${dataContext.name} ${userLink} ${dataContext.approverData.powwow}`;
      }
      return value;
    };
  }

  const ApproverTreeFormatter = (
    isReviewerSelectable: boolean,
    selectedUserNames: Set<string>
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

      const customFormatter = approverListView(isReviewerSelectable, selectedUserNames);
      const customContent = customFormatter(_row, _cell, value, _columnDef, dataContext);

      const treeToggle = data[idx + 1]?.[treeLevelPropName] > data[idx][treeLevelPropName] || data[idx]['__hasChildren'];

      if (treeToggle) {
        const collapsedClass = dataContext.__collapsed ? 'collapsed' : 'expanded';
        const treeToggleIcon = `<span class="slick-group-toggle ${collapsedClass}" level="${treeLevel}" data-group-id="${dataContext.id}"></span>`;
        return `${spacer}${treeToggleIcon}${customContent}`;
      }

      return `${spacer}${customContent}`;
    };
  };

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
        const groupItem = data.find((group: any) => group.id === groupId && group.isGroup);
        if (groupItem && onUserGroupClick) {
          onUserGroupClick(groupItem.groupData, checked);
        }
      }

      // Handle checkbox clicks for approvers
      if (target.matches('input[type="checkbox"][data-approver-id]')) {
        const approverId = target.getAttribute("data-approver-id");
        const checked = (target as HTMLInputElement).checked;
        const approverItem = null;
        for (const group of data) {
          if (group.isGroup && group.children) {
            const approver = group.children.find((approver: any) => approver.approverData.userName === approverId);
            if (approver) {
              if (onUserClick) {
                onUserClick(approver.approverData, checked);
              }
              break;
            }
          }
        }
      }

      // Handle group name clicks
      if (target.matches("span.group-name[data-group-id]")) {
        const groupId = target.getAttribute("data-group-id");
        const groupItem = data.find((group: any) => group.id === groupId && group.isGroup);
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
      if (target.matches(".slick-group-toggle")) {
        const dataView = gridObj.getData();
        if (dataContext.__collapsed) {
          dataView.expandGroup(dataContext.id);
        } else {
          dataView.collapseGroup(dataContext.id);
        }
        e.stopImmediatePropagation();
      }
    };

    gridObj.onClick.subscribe(onGridClick);

    return () => {
      gridObj.onClick.unsubscribe(onGridClick);
    };
  }, [reactGrid.current, onUserClick, onUserGroupClick, onClickGroupLink, data]);

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
