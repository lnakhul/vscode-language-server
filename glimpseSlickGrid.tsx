// ApproversListView.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  SlickgridReact,
  SlickgridReactInstance,
  Column,
  GridOption,
  FieldType,
  Formatter,
} from 'slickgrid-react';
import { PathApprover, QuackApproverGroup } from './interfaces/interfaces';
import { userToLink, createCopyLink } from '../shared/sre/reactFunctions';

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

  // Prepare data and grid configurations
  useEffect(() => {
    const columns: Column[] = [
      {
        id: 'file',
        name: 'Name',
        field: 'file',
        type: FieldType.string,
        width: 250,
        formatter: treeFormatter,
        filterable: false,
        sortable: false,
      },
      {
        id: 'powwow',
        name: 'Powwow',
        field: 'powwow',
        type: FieldType.string,
        filterable: false,
        sortable: false,
      },
      // Add more columns as needed
    ];

    const options: GridOption = {
      enableTreeData: true,
      treeDataOptions: {
        columnId: 'file',
        childrenPropName: 'children',
      },
      enableCheckboxSelector: false, // We handle checkboxes manually
      enableFiltering: false,
      enableSorting: false,
      autoResize: {
        container: '#approvers-grid-container',
        rightPadding: 10,
      },
      rowHeight: 35,
      headerRowHeight: 35,
      enableColumnReorder: false,
      enableCellNavigation: false,
    };

    setColumnDefinitions(columns);
    setGridOptions(options);
    const data = prepareDataset(approverGroups);
    setDatasetHierarchical(data);
  }, [approverGroups]);

  // Create a set of selected user names for quick lookup
  const selectedUsersSet = useMemo(() => new Set(selectedUsers?.map(user => user.userName)), [selectedUsers]);

  // Event handler setup
  useEffect(() => {
    const gridObj = reactGrid.current?.slickGrid;
    if (!gridObj) return;

    const handleGridClick = (e: Event, args: any) => {
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
        if (groupItem && onClickGroupLink) {
          onClickGroupLink(groupItem.groupData);
        }
      }

      // Handle expand/collapse
      if (target.matches('.slick-group-toggle')) {
        gridObj.getData().collapseExpandGroup(args.row);
        e.stopImmediatePropagation();
      }
    };

    gridObj.onClick.subscribe(handleGridClick);

    return () => {
      gridObj.onClick.unsubscribe(handleGridClick);
    };
  }, [reactGrid, onUserClick, onClickGroupLink, datasetHierarchical]);

  const findApproverById = (id: string | null) => {
    if (!id) return null;
    for (const group of datasetHierarchical) {
      const approver = group.children.find((approver: any) => approver.userName === id);
      if (approver) return approver;
    }
    return null;
  };

  const findGroupById = (id: string | null) => {
    if (!id) return null;
    return datasetHierarchical.find(group => group.id === id) || null;
  };

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

  const treeFormatter: Formatter = (_row, _cell, value, _columnDef, dataContext, grid) => {
    const gridOptions = grid.getOptions();
    const treeLevelPropName = gridOptions.treeDataOptions?.levelPropName || '__treeLevel';
    const treeLevel = dataContext[treeLevelPropName];
    const spacer = `<span style="display:inline-block; width:${15 * treeLevel}px;"></span>`;

    if (dataContext.children && dataContext.children.length > 0) {
      // Group item
      const folderIcon = dataContext.__collapsed ? 'mdi-folder' : 'mdi-folder-open';
      const groupName = dataContext.file;
      const groupId = dataContext.id;
      return `
        ${spacer}
        <span class="slick-group-toggle ${dataContext.__collapsed ? 'collapsed' : 'expanded'}" data-group-id="${groupId}"></span>
        <span class="mdi icon ${folderIcon}"></span>
        <span class="group-name" data-group-id="${groupId}" style="cursor: pointer;">${groupName}</span>
      `;
    } else {
      // Approver item
      const isChecked = selectedUsersSet.has(dataContext.userName) ? 'checked' : '';
      const checkbox = isReviewerSelectable
        ? `<input type="checkbox" data-approver-id="${dataContext.userName}" ${isChecked} />`
        : '';
      const approverName = dataContext.file;
      return `
        ${spacer}
        ${checkbox}
        <span>${approverName}</span>
      `;
    }
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
