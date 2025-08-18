import React, { useMemo } from "react";
import "@vscode-elements/elements/dist/vscode-checkbox";
import "@vscode-elements/elements/dist/vscode-tree";
import "@vscode-elements/elements/dist/vscode-tree-item";
import FormLabel from "./FormLabel";
import { SpinningIcon } from "./SpinningIcon";
import styles from "../css/ApproversListView.module.css";
import { userToLink } from "../reactFunctions";

/** Types (same as before) */
type PathApprover = {
  displayName: string;
  powwow: string;
  username: string;
  nbkid: string;
  canApprove: boolean;
};

type QuackApproverGroup = {
  roleName: string;
  approvers: PathApprover[];
};

type ApproverViewProp = {
  approverGroups?: QuackApproverGroup[];
  onUserClick?: (approver: PathApprover, checked: boolean) => void;
  onUserGroupClick?: (group: QuackApproverGroup, checked: boolean) => void;
  isReviewerSelectable: boolean;
  selectedUsers?: PathApprover[] | null;
  onClickGroupLink?: (group: QuackApproverGroup) => void;
};

/** Helpers */
function commandLink(command: string, ...args: string[]) {
  const encodedArgs =
    args.length > 0 ? `?${encodeURIComponent(JSON.stringify(args))}` : "";
  return `command:${command}${encodedArgs}`;
}

function Initials(group: QuackApproverGroup) {
  return group.approvers.map((a) => a.powwow).join(" | ");
}

/** Leaf item (approver) rendered as a tree item */
function ApproverTreeItem(props: {
  approver: PathApprover;
  isSelectable: boolean;
  isSelected: boolean;
  onToggle?: (approver: PathApprover, checked: boolean) => void;
}) {
  const { approver, isSelectable, isSelected, onToggle } = props;

  const onCheckboxClick: React.MouseEventHandler = (e) => {
    e.stopPropagation();
    onToggle?.(approver, !isSelected);
  };

  return (
    <vscode-tree-item class={styles.approverItemStyle as any}>
      {isSelectable && (
        <vscode-checkbox
          checked={isSelected}
          onClick={onCheckboxClick}
        ></vscode-checkbox>
      )}
      <FormLabel style={{ display: "inline-block", marginLeft: 5 }}>
        {approver.displayName} {userToLink(approver.username, approver.powwow)}{" "}
        {approver.powwow}
      </FormLabel>
    </vscode-tree-item>
  );
}

/** Group item (branch) as a tree item containing approver leaves */
function ApproverGroupTreeItem(props: {
  group: QuackApproverGroup;
  isInitiallyOpen: boolean;
  selectedUsernames: Set<string>;
  onSelectGroup?: (group: QuackApproverGroup, checked: boolean) => void;
  onClickGroupLink?: (group: QuackApproverGroup) => void;
  renderApprover: (approver: PathApprover, idx: number) => React.ReactNode;
}) {
  const {
    group,
    isInitiallyOpen,
    selectedUsernames,
    onSelectGroup,
    onClickGroupLink,
    renderApprover,
  } = props;

  const { roleName, approvers } = group;
  const allChecked = approvers.every((a) => selectedUsernames.has(a.username));
  const initials = Initials(group);

  const tooltip = [
    "Click to copy Quartz Chat initials to clipboard",
    initials,
    onSelectGroup ? `and select all reviewers in ${roleName} group` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const onGroupCheckboxClick: React.MouseEventHandler = (e) => {
    e.stopPropagation();
    onSelectGroup?.(group, !allChecked);
  };

  const onGroupLinkClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    // Don’t let the tree toggle because we’re performing actions.
    e.stopPropagation();
    onClickGroupLink?.(group);
    // Allow the anchor’s href=command:... to execute (no preventDefault!).
  };

  return (
    <vscode-tree-item open={isInitiallyOpen as any}>
      <div className={styles.groupHeader as any} style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {onSelectGroup && (
          <vscode-checkbox
            checked={allChecked}
            onClick={onGroupCheckboxClick}
          ></vscode-checkbox>
        )}
        {/* "Rich content" label area */}
        <FormLabel cssClassName={styles.groupHeader}>
          <a
            href={commandLink("quartz.internal.copyToClipboard", initials)}
            title={tooltip}
            onClick={onGroupLinkClick}
            // make it obvious this is clickable-but not a navigation
            style={{ cursor: "pointer", textDecoration: "underline" }}
          >
            {roleName}
          </a>
        </FormLabel>
      </div>

      {/* Children */}
      {approvers.map(renderApprover)}
    </vscode-tree-item>
  );
}

/** Top-level view: now renders a single <vscode-tree> containing all groups/items */
export const ApproversView: React.FC<ApproverViewProp> = ({
  approverGroups,
  selectedUsers,
  isReviewerSelectable,
  onUserClick,
  onUserGroupClick,
  onClickGroupLink,
}) => {
  if (!approverGroups)
    return <SpinningIcon iconName="refresh" spin={approverGroups === undefined} />;

  const groups = useMemo(
    () => approverGroups.filter((g) => g.approvers.length > 0),
    [approverGroups]
  );
  const selectedUsernames = new Set<string>(
    selectedUsers?.map((u) => u.username)
  );

  return (
    <vscode-tree
      // Keep default single-click expand; configurable if you want double-click
      class={styles.listStyle as any}
    >
      {groups.map((group, index) => (
        <ApproverGroupTreeItem
          key={`quack_approver_${index}`}
          group={group}
          isInitiallyOpen={index === 0}
          selectedUsernames={selectedUsernames}
          onSelectGroup={onUserGroupClick}
          onClickGroupLink={onClickGroupLink}
          renderApprover={(approver, idx) => (
            <ApproverTreeItem
              key={`approver_item_${group.roleName}_${approver.username}_${idx}`}
              approver={approver}
              isSelectable={isReviewerSelectable}
              isSelected={selectedUsernames.has(approver.username)}
              onToggle={onUserClick}
            />
          )}
        />
      ))}
    </vscode-tree>
  );
};

export default ApproversView;
