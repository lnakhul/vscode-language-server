type ApproverCellProps = {
  value: any;
  dataContext: any;
  columnDef: Column;
  row: number;
  cell: number;
  grid: SlickGrid;
  isReviewerSelectable: boolean;
  selectedUserNames: Set<string>;
  onUserClick?: (approver: PathApprover, checked: boolean) => void;
  onUserGroupClick?: (group: QuackApproverGroup, checked: boolean) => void;
  onClickGroupLink?: (group: QuackApproverGroup) => void;
};

const ApproverCell: React.FC<ApproverCellProps> = ({
  value,
  dataContext,
  grid,
  isReviewerSelectable,
  selectedUserNames,
  onUserClick,
  onUserGroupClick,
  onClickGroupLink,
}) => {
  // Determine tree level and whether node is collapsed
  const gridOptions = grid.getOptions();
  const treeLevelPropName = gridOptions.treeDataOptions?.levelPropName || '__treeLevel';
  const treeLevel = dataContext[treeLevelPropName] || 0;
  const isLeaf = !dataContext.__hasChildren;
  const isCollapsed = dataContext.__collapsed;

  // Handle tree toggle click
  const handleToggleClick = () => {
    const dataView = grid.getData();
    dataView.expandCollapse(dataContext);
    grid.invalidate();
  };

  // Spacer for indentation
  const spacerStyle = {
    display: 'inline-block',
    width: `${15 * treeLevel}px`,
  };

  // Toggle icon
  const toggleIconClass = !isLeaf
    ? isCollapsed
      ? 'slick-group-toggle collapsed'
      : 'slick-group-toggle expanded'
    : 'slick-group-toggle';
  const toggleIcon = (
    <span
      className={toggleIconClass}
      onClick={isLeaf ? undefined : handleToggleClick}
      style={{ cursor: isLeaf ? 'default' : 'pointer' }}
    ></span>
  );

  // Checkbox handling
  let checkbox = null;
  if (isReviewerSelectable) {
    if (dataContext.isGroup) {
      const checked = isGroupSelected(dataContext, selectedUserNames);
      checkbox = (
        <VSCodeCheckbox
          checked={checked}
          onClick={() => onUserGroupClick?.(dataContext, !checked)}
        />
      );
    } else if (dataContext.isApprover) {
      const checked = isApproverSelected(dataContext.approver, selectedUserNames);
      checkbox = (
        <VSCodeCheckbox
          checked={checked}
          onClick={() => onUserClick?.(dataContext.approver, !checked)}
        />
      );
    }
  }

  // Content rendering
  const content = (() => {
    if (dataContext.isGroup) {
      const initials = dataContext.approvers.map((x: PathApprover) => x.powwow).join('|');
      const tooltip = `Click to copy initials and select all reviewers in ${dataContext.name}`;
      return (
        <span>
          {checkbox}{' '}
          {createCopyLink(dataContext.name, initials, tooltip)}
        </span>
      );
    } else if (dataContext.isApprover) {
      return (
        <span>
          {checkbox} {dataContext.name}{' '}
          {userToLink(dataContext.approver.userName, dataContext.approver.powwow)}{' '}
          {dataContext.approver.powwow}
        </span>
      );
    }
    return <span>{value}</span>;
  })();

  return (
    <div>
      <span style={spacerStyle}></span>
      {toggleIcon}
      {content}
    </div>
  );
};
