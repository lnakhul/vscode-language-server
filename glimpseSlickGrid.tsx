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
