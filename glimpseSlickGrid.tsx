// ApproversListView.tsx

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SlickgridReact, SlickgridReactInstance } from 'slickgrid-react';
import { Column, GridOption, FieldType, Formatter, SlickEventData } from 'slickgrid-react';
import { PathApprover, QuackApproverGroup } from './interfaces/interfaces';
import { createCopyLink, userToLink } from '../shared/sre/reactFunctions';
import './ApproversListView.scss'; // Include any necessary styles

type ApproverViewProps = {
  approverGroups?: QuackApproverGroup[];
  onUserClick?: (approver: PathApprover, checked: boolean) => void;
  onUserGroupClick?: (group: QuackApproverGroup, checked: boolean) => void;
  isReviewerSelectable: boolean;
  selectedUsers?: PathApprover[] | null;
  onClickGroupLink?: (group: QuackApproverGroup) => void;
};

const ApproversView: React.FC<ApproverViewProps> = ({
  approverGroups,
  onUserClick,
  onUserGroupClick,
  isReviewerSelectable,
  selectedUsers,
  onClickGroupLink,
}) => {
  const [columnDefinitions, setColumnDefinitions] = useState<Column[]>([]);
  const [gridOptions, setGridOptions] = useState<GridOption>({});
  const [datasetHierarchical, setDatasetHierarchical] = useState<any[]>([]);
  const reactGrid = useRef<SlickgridReactInstance>(null);

  // Create a set of selected user names for quick lookup
  const selectedUsersSet = useMemo(() => new Set(selectedUsers?.map(user => user.userName)), [selectedUsers]);

  // Prepare data and grid configurations
  useEffect(() => {
    setColumnDefinitions(getColumns());
    setGridOptions(getGridOptions());
    setDatasetHierarchical(prepareDataset(approverGroups));
  }, [approverGroups, isReviewerSelectable]);

  // Define treeFormatter inside the component so it has access to selectedUsersSet and isReviewerSelectable
  const treeFormatter: Formatter = (_row, _cell, value, columnDef, dataContext, grid) => {
    const gridOptions = grid.getOptions();
    const treeLevelPropName = gridOptions.treeDataOptions?.levelPropName || '__treeLevel';
    const treeLevel = dataContext[treeLevelPropName];
    const spacer = `<span style="display:inline-block; width:${15 * treeLevel}px;"></span>`;

    // Determine if the item is a group or an approver
    if (dataContext.children && dataContext.children.length > 0) {
      // Group item
      const folderIcon = dataContext.__collapsed ? 'mdi-folder' : 'mdi-folder-open';
      // For copying initials, use dataContext.groupData.approvers.map(a => a.powwow).join('|')
      const initials = dataContext.groupData.approvers.map((a: PathApprover) => a.powwow).join('|');
      const tooltip = `Click to copy initials: ${initials}`;
      return `
        ${spacer}
        <span class="slick-group-toggle ${dataContext.__collapsed ? 'collapsed' : 'expanded'}" data-group-id="${dataContext.id}"></span>
        <span class="mdi icon ${folderIcon}"></span>
        <span class="group-name" data-group-id="${dataContext.id}" title="${tooltip}">${value}</span>
      `;
    } else {
      // Approver item
      const isChecked = selectedUsersSet.has(dataContext.userName) ? 'checked' : '';
      const checkbox = isReviewerSelectable ? `<input type="checkbox" data-approver-id="${dataContext.userName}" ${isChecked} />` : '';
      const approverName = dataContext.file; // displayName
      const userName = dataContext.userName;
      const powwow = dataContext.powwow;
      // Display the approver information
      return `
        ${spacer}
        ${checkbox}
        <span>${approverName} (${userName}) ${powwow}</span>
      `;
    }
  };

  // Define grid columns
  const getColumns = (): Column[] => {
    return [
      {
        id: 'file',
        name: 'Name',
        field: 'file',
        type: FieldType.string,
        width: 150,
        formatter: treeFormatter,
        filterable: false,
        sortable: false,
      },
      // Add more columns if needed
    ];
  };

  // Define grid options
  const getGridOptions = (): GridOption => {
    return {
      enableTreeData: true,
      treeDataOptions: {
        columnId: 'file',
        childrenPropName: 'children',
      },
      enableCheckboxSelector: false, // We'll handle checkboxes manually
      enableFiltering: false,
      enableSorting: false,
      autoResize: {
        container: '#approvers-grid-container',
        rightPadding: 10,
      },
      headerRowHeight: 35,
      rowHeight: 33,
    };
  };

  // Prepare the hierarchical dataset
  const prepareDataset = (approverGroups?: QuackApproverGroup[]) => {
    if (!approverGroups) return [];
    return approverGroups.map(group => ({
      id: uuidv4(),
      file: group.roleName,
      groupData: group,
      __collapsed: false, // initialize as not collapsed
      children: group.approvers.map(approver => ({
        id: approver.userName, // use userName as unique ID for approvers
        file: approver.displayName,
        userName: approver.userName,
        powwow: approver.powwow,
        approverData: approver,
      })),
    }));
  };

  // Set up event handlers
  useEffect(() => {
    const gridObj = reactGrid.current?.slickGrid;
    if (!gridObj) return;

    const onGridClick = (e: SlickEventData, args: any) => {
      const target = e.target as HTMLElement;
      const dataContext = gridObj.getDataItem(args.row);

      // Handle checkbox clicks
      if (target.matches('input[type="checkbox"][data-approver-id]')) {
        const approverId = target.getAttribute('data-approver-id');
        const checked = (target as HTMLInputElement).checked;
        const approverItem = findApproverById(approverId);
        if (approverItem && onUserClick) {
          onUserClick(approverItem.approverData, checked);
        }
      }

      // Handle group name clicks
      if (target.matches('span.group-name[data-group-id]')) {
        const groupId = target.getAttribute('data-group-id');
        const groupItem = findGroupById(groupId);
        if (groupItem) {
          const initials = groupItem.groupData.approvers.map((a: PathApprover) => a.powwow).join('|');
          // Copy initials to clipboard
          navigator.clipboard.writeText(initials).then(() => {
            // Optionally show a success message
            console.log('Initials copied to clipboard:', initials);
          });
          if (onClickGroupLink) {
            onClickGroupLink(groupItem.groupData);
          }
        }
      }

      // Handle expand/collapse clicks
      if (target.matches('.slick-group-toggle')) {
        const groupId = target.getAttribute('data-group-id');
        const groupItem = findGroupById(groupId);
        if (groupItem) {
          groupItem.__collapsed = !groupItem.__collapsed;
          gridObj.invalidate();
          gridObj.render();
        }
      }
    };

    gridObj.onClick.subscribe(onGridClick);

    // Cleanup on unmount
    return () => {
      gridObj.onClick.unsubscribe(onGridClick);
    };
  }, [reactGrid.current, onUserClick, onClickGroupLink, selectedUsersSet]);

  // Helper function to find an approver by ID
  const findApproverById = (id: string | null) => {
    if (!id) return null;
    for (const group of datasetHierarchical) {
      const approver = group.children.find((approver: any) => approver.userName === id);
      if (approver) return approver;
    }
    return null;
  };

  // Helper function to find a group by ID
  const findGroupById = (id: string | null) => {
    if (!id) return null;
    return datasetHierarchical.find(group => group.id === id) || null;
  };

  return (
    <div id="approvers-grid-container" style={{ width: '100%', height: '500px' }}>
      <SlickgridReact
        ref={reactGrid}
        gridId="approversGrid"
        columnDefinitions={columnDefinitions}
        gridOptions={gridOptions}
        datasetHierarchical={datasetHierarchical}
      />
    </div>
  );
};

export default ApproversView;
