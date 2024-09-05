const addCustomElements = (
  isReviewerSelectable: boolean,
  selectedUserNames: Set<string>,
  onUserClick?: (approver: PathApprover, checked: boolean) => void,
  onUserGroupClick?: (group: QuackApproverGroup, checked: boolean) => void
) => (cellNode: HTMLElement, row: number, dataContext: any) => {
  const treeContent = cellNode.innerHTML;  // This preserves the tree content rendered by Formatters.tree
  let checkbox = null;
  let additionalContent = "";

  // Add checkboxes for groups and approvers
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

  // Add custom group or approver links
  if (dataContext.isGroup) {
    const initials = dataContext.approvers.map((x: PathApprover) => x.powwow).join('|');
    const tooltip = `Click to copy initials and select all reviewers in ${dataContext.name}`;
    additionalContent = `${createCopyLink(dataContext.name, initials, tooltip)} `;
  } else if (dataContext.isApprover) {
    additionalContent = `${dataContext.name} ${userToLink(dataContext.approver.userName, dataContext.approver.powwow)} ${dataContext.approver.powwow}`;
  }

  // Clear and re-add content with custom elements
  while (cellNode.firstChild) {
    cellNode.removeChild(cellNode.firstChild);
  }
  const container = document.createElement("div");
  ReactDOM.render(
    <>
      {checkbox} <span dangerouslySetInnerHTML={{ __html: treeContent }} /> {additionalContent}
    </>,
    container
  );
  if (container.firstChild) {
    cellNode.appendChild(container.firstChild);
  }
};
