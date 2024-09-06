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



===================

asyncPostRender: (domNode, row, dataContext, columnDef) => {
        // Generate HTML using the custom formatter
        const htmlContent = generateHTML(
          isReviewerSelectable,
          selectedUserNames,
          onUserClick,
          onUserGroupClick,
          dataContext
        );

        // Insert HTML content into the DOM node
        if (domNode) {
          domNode.innerHTML = htmlContent;
        }

        // Add event listeners for checkboxes
        const groupCheckbox = domNode.querySelector(".approver-group-checkbox");
        if (groupCheckbox) {
          groupCheckbox.addEventListener("change", (event) => {
            const target = event.target as HTMLInputElement;
            onUserGroupClick?.(dataContext, target.checked);
          });
        }

        const approverCheckbox = domNode.querySelector(".approver-checkbox");
        if (approverCheckbox) {
          approverCheckbox.addEventListener("change", (event) => {
            const target = event.target as HTMLInputElement;
            onUserClick?.(dataContext.approver, target.checked);
          });
        }
      },
