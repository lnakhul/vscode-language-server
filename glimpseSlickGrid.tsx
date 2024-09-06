function approversTreeFormatter(
  isReviewerSelectable: boolean,
  selectedUserNames: Set<string>,
  onUserClick?: (approver: PathApprover, checked: boolean) => void,
  onUserGroupClick?: (group: QuackApproverGroup, checked: boolean) => void
) {
  return (row: number, _cell: number, value: any, columnDef: Column, dataContext: any, grid: SlickGrid) => {
    const treeLevel = dataContext['__treeLevel'] || 0;
    const isLeaf = !dataContext['__hasChildren'];
    const indent = `<span style="display:inline-block; width:${treeLevel * 15}px;"></span>`;
    const collapseIcon = isLeaf
      ? ''
      : `<span class="slick-group-toggle ${dataContext.__collapsed ? 'collapsed' : 'expanded'}"></span>`;

    let checkbox = null;
    if (isReviewerSelectable) {
      if (dataContext.isGroup) {
        const checked = dataContext.approvers.every((val: PathApprover) => selectedUserNames.has(val.userName));
        checkbox = `<input type="checkbox" ${checked ? 'checked' : ''} onclick="(${() => onUserGroupClick?.(dataContext, !checked)})()" />`;
      } else if (dataContext.isApprover) {
        const checked = selectedUserNames.has(dataContext.approver.userName);
        checkbox = `<input type="checkbox" ${checked ? 'checked' : ''} onclick="(${() => onUserClick?.(dataContext.approver, !checked)})()" />`;
      }
    }

    if (dataContext.isGroup) {
      const initials = dataContext.approvers.map((x: PathApprover) => x.powwow).join('|');
      const tooltip = `Click to copy initials and select all reviewers in ${dataContext.name}`;
      const groupLabel = `${checkbox} ${createCopyLink(dataContext.name, initials, tooltip)}`;

      return `${indent}${collapseIcon} ${groupLabel}`;
    } else if (dataContext.isApprover) {
      const approverLabel = `${checkbox} ${value} ${userToLink(dataContext.approver.userName, dataContext.approver.powwow)} ${dataContext.approver.powwow}`;
      return `${indent}${collapseIcon} ${approverLabel}`;
    }

    return `${indent}${collapseIcon} ${value}`;
  };
}



========================================


function approversTreeFormatter(
  isReviewerSelectable: boolean,
  selectedUserNames: Set<string>,
  onUserClick?: (approver: PathApprover, checked: boolean) => void,
  onUserGroupClick?: (group: QuackApproverGroup, checked: boolean) => void
) {
  return (_row: number, _cell: any, value: any, _columnDef: Column, dataContext: any) => {
    let checkbox = null;
    if (isReviewerSelectable) {
      if (dataContext.isGroup) {
        const checked = dataContext.approvers.every((val: PathApprover) => selectedUserNames.has(val.userName));
        checkbox = (
          <VSCodeCheckbox
            checked={checked}
            onClick={() => onUserGroupClick?.(dataContext, !checked)}
          />
        );
      } else if (dataContext.isApprover) {
        const checked = selectedUserNames.has(dataContext.approver.userName);
        checkbox = (
          <VSCodeCheckbox
            checked={checked}
            onClick={() => onUserClick?.(dataContext.approver, !checked)}
          />
        );
      }
    }

    if (dataContext.isGroup) {
      const initials = dataContext.approvers.map((x: PathApprover) => x.powwow).join('|');
      const tooltip = `Click to copy initials and select all reviewers in ${dataContext.name}`;
      return renderElement(
        <span>
          {checkbox} {createCopyLink(dataContext.name, initials, tooltip)}
        </span>
      );
    } else if (dataContext.isApprover) {
      return renderElement(
        <span>
          {checkbox} {dataContext.name} {userToLink(dataContext.approver.userName, dataContext.approver.powwow)} {dataContext.approver.powwow}
        </span>
      );
    }

    return renderElement(value);
  };
}

// Main ApproversView component
const ApproversView: React.FC<ApproverViewProp> = ({
  approverGroups,
  selectedUsers,
  isReviewerSelectable,
  onUserClick,
  onUserGroupClick,
}) => {
  if (!approverGroups) return <SpinningIcon iconName="refresh" spin={approverGroups === undefined} />;

  const selectedUserNames = new Set<string>(selectedUsers?.map((val) => val.userName));

  // Prepare data for slickgrid
  const data = useMemo(() => {
    const rows: any[] = [];
    approverGroups?.forEach((group) => {
      const groupId = uuidv4();
      rows.push({
        id: groupId,
        name: group.roleName, // Ensure group name renders correctly
        isGroup: true,
        __hasChildren: true,
        approvers: group.approvers,
      });
      group.approvers.forEach((approver) => {
        rows.push({
          id: uuidv4(),
          name: approver.displayName, // Ensure approver name renders correctly
          __parentId: groupId,
          isApprover: true,
          approver,
        });
      });
    });
    return rows;
  }, [approverGroups]);

  const columns: Column[] = [
    {
      id: 'name',
      name: 'Name',
      field: 'name',  // Correct field name for display
      formatter: Formatters.tree,  // Use Formatters.tree for tree structure
      asyncPostRender: (domNode, _row, dataContext, _columnDef) => {
        const existingContent = domNode.querySelector('.slick-group-title, .slick-cell-content');
        const customContent = approversTreeFormatter(
          isReviewerSelectable,
          selectedUserNames,
          onUserClick,
          onUserGroupClick
        )(_row, undefined, dataContext.name, _columnDef, dataContext);

        if (existingContent && customContent) {
          existingContent.appendChild(customContent);
        }
      },
      minWidth: 300,
    },
  ];
