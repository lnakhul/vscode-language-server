const addCustomElements = (
  isReviewerSelectable: boolean,
  selectedUserNames: Set<string>,
  onUserClick?: (approver: PathApprover, checked: boolean) => void,
  onUserGroupClick?: (group: QuackApproverGroup, checked: boolean) => void
) => (cellNode: HTMLElement, row: number, dataContext: any) => {
  // We need to ensure that the cell still supports tree collapsing/expanding

  let checkbox = null;
  let additionalContent = "";

  // Render checkboxes for groups and approvers
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

  // Remove existing inner content to avoid duplication
  while (cellNode.firstChild) {
    cellNode.removeChild(cellNode.firstChild);
  }

  // Rebuild the content by preserving the tree structure and appending custom content
  const container = document.createElement("div");
  ReactDOM.render(
    <>
      {checkbox} {additionalContent}
    </>,
    container
  );

  // Ensure firstChild exists before appending
  if (container.firstChild) {
    cellNode.appendChild(container.firstChild); // Add the combined content to the cell
  }
};
