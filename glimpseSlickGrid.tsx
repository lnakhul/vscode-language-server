const createCheckbox = (checked: boolean, onChange: () => void) => {
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = checked;
  input.addEventListener("change", onChange);
  return input;
};

// Custom formatter that adds checkboxes based on tree nodes
const approversTreeFormatter = (row: number, cell: number, value: any, columnDef: Column, dataContext: any, grid: SlickGrid) => {
  // Render the tree node first using the default formatter
  const treeNode = Formatters.tree(row, cell, value, columnDef, dataContext, grid);

  // Handle checkboxes for group and individual approvers
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";

  if (dataContext.isGroup) {
    const allChecked = dataContext.approvers.every((approver: PathApprover) =>
      dataContext.selectedUserNames.has(approver.userName)
    );
    checkbox.checked = allChecked;
    checkbox.onchange = () => {
      dataContext.onUserGroupClick?.(dataContext.groupData, !allChecked);
    };
  } else if (dataContext.isApprover) {
    const isChecked = dataContext.selectedUserNames.has(dataContext.approver.userName);
    checkbox.checked = isChecked;
    checkbox.onchange = () => {
      dataContext.onUserClick?.(dataContext.approver, !isChecked);
    };
  }

  // Combine the checkbox with the tree node
  const wrapper = document.createElement("div");
  wrapper.appendChild(checkbox);
  wrapper.appendChild(treeNode);

  return wrapper;
};
