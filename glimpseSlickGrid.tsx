const approversTreeFormatter = (
  isReviewerSelectable: boolean,
  selectedUserNames: Set<string>,
  onUserClick?: (approver: PathApprover, checked: boolean) => void,
  onUserGroupClick?: (group: QuackApproverGroup, checked: boolean) => void
) => {
  return (dataContext: any) => {
    let checkbox = null;

    // Check if the item is a group or an approver
    if (isReviewerSelectable) {
      if (dataContext.isGroup) {
        const checked = dataContext.approvers.every((val: PathApprover) =>
          selectedUserNames.has(val.userName)
        );
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

    // Render the group or approver elements
    if (dataContext.isGroup) {
      const initials = dataContext.approvers.map((x: PathApprover) => x.powwow).join('|');
      const tooltip = `Click to copy initials and select all reviewers in ${dataContext.name}`;
      return (
        <span>
          {checkbox} {createCopyLink(dataContext.name, initials, tooltip)}
        </span>
      );
    } else if (dataContext.isApprover) {
      return (
        <span>
          {checkbox} {dataContext.name}{" "}
          {userToLink(dataContext.approver.userName, dataContext.approver.powwow)}{" "}
          {dataContext.approver.powwow}
        </span>
      );
    }

    return <span>{dataContext.name}</span>;
  };
};
