import { createElement, useMemo } from "react";
import "@vscode-elements/elements/dist/vscode-checkbox";
import "@vscode-elements/elements/dist/vscode-tree";
import "@vscode-elements/elements/dist/vscode-tree-item";
import FormLabel from "./FormLabel";
import { SpinningIcon } from "./SpinningIcon";
import styles from "../css/ApproversListView.module.css";
import { createCopyLink as makeCopyLink, userToLink } from "../reactFunctions";

/** keep your command link helper */
function commandLink(command: string, ...args: string[]) {
  const encodedArgs =
    args.length > 0 ? `?${encodeURIComponent(JSON.stringify(args))}` : "";
  return `command:${command}${encodedArgs}`;
}

/** keep your local copy helper, just reusing commandLink */
function createCopyLink(label: string, text: string, tooltip: string) {
  return createElement(
    "a",
    {
      href: commandLink("quartz.internal.copyToClipboard", text),
      title: tooltip,
      onClick: (e: React.MouseEvent) => {
        // let the command run, but don’t toggle selection/expansion
        e.stopPropagation();
      },
    },
    label
  );
}

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

/** Single approver node rendered inside a <vscode-tree-item> */
const ApproverLeaf: React.FC<{
  approver: PathApprover;
  isReviewerSelectable: boolean;
  isSelected: boolean;
  onToggle: (approver: PathApprover, checked: boolean, e: React.MouseEvent) => void;
}> = ({ approver, isReviewerSelectable, isSelected, onToggle }) => {
  return (
    <vscode-tree-item data-kind="approver" data-username={approver.username}>
      <span className={styles.approverItemStyle}>
        {isReviewerSelectable && (
          <vscode-checkbox
            checked={isSelected}
            onClick={(e: any) => {
              // prevent expanding/selecting the tree item when clicking the checkbox
              e.stopPropagation?.();
              onToggle(approver, !isSelected, e);
            }}
          />
        )}
        <FormLabel style={{ display: "inline-block", marginLeft: 5 }}>
          {approver.displayName} {userToLink(approver.username, approver.powwow)} {approver.powwow}
        </FormLabel>
      </span>
    </vscode-tree-item>
  );
};

/** Group node with children inside <vscode-tree> */
const ApproverGroupNode: React.FC<{
  group: QuackApproverGroup;
  initiallyExpanded?: boolean;
  selected: Set<string>;
  onSelectGroup?: (group: QuackApproverGroup, checked: boolean) => void;
  onClickGroupLink?: (group: QuackApproverGroup) => void;
  renderLeaf: (approver: PathApprover, index: number) => React.ReactNode;
}> = ({ group, initiallyExpanded, selected, onSelectGroup, onClickGroupLink, renderLeaf }) => {
  const { roleName, approvers } = group;
  const allChecked = approvers.length > 0 && approvers.every((a) => selected.has(a.username));
  const initials = approvers.map((x) => x.displayName?.[0] ?? "").join(" | ");
  let tooltip = `Click to copy Quartz Chat initials to clipboard\n${initials}`;
  if (onSelectGroup) tooltip += ` and select all reviewers in ${roleName} group`;

  const onGroupLabelClick = (e: React.MouseEvent) => {
    // Add initials to the Comment box (your parent handler)
    e.stopPropagation(); // don’t toggle the tree row
    onClickGroupLink?.(group);
  };

  const onGroupCheckboxClick = (e: any) => {
    e.stopPropagation(); // don’t toggle expand/collapse
    onSelectGroup?.(group, !allChecked);
  };

  return (
    <vscode-tree-item
      data-kind="group"
      data-role={roleName}
      expanded={!!initiallyExpanded}
    >
      {/* Header row content */}
      <span className={styles.groupHeader} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        {onSelectGroup && (
          <vscode-checkbox checked={allChecked} onClick={onGroupCheckboxClick} />
        )}
        {/* Keep your copy-to-clipboard link and click-to-append-initials behavior */}
        <span onClick={onGroupLabelClick}>
          {createCopyLink(roleName, initials, tooltip)}
        </span>
      </span>

      {/* Children */}
      {approvers.map(renderLeaf)}
    </vscode-tree-item>
  );
};

/*** Approver View (unchanged external API) ***/
export const ApproversView: React.FC<ApproverViewProp> = ({
  approverGroups,
  selectedUsers,
  isReviewerSelectable,
  onUserClick,
  onUserGroupClick,
  onClickGroupLink,
}) => {
  if (!approverGroups) {
    return <SpinningIcon iconName="refresh" spin={approverGroups === undefined} />;
  }

  const groups = useMemo<QuackApproverGroup[]>(
    () => approverGroups.filter((g) => g.approvers.length > 0),
    [approverGroups]
  );

  const selectedUsernames = new Set<string>(selectedUsers?.map((u) => u.username));

  return (
    <div className={styles.listStyle}>
      {/* VSCode Tree */}
      <vscode-tree /* tweak behavior via props from docs (expandMode, indentGuides, etc.) */
        multi-select={false}
        indent-guides="onHover"
      >
        {groups.map((group, index) => (
          <ApproverGroupNode
            key={`quack_group_${group.roleName}_${index}`}
            group={group}
            initiallyExpanded={index === 0}
            selected={selectedUsernames}
            onSelectGroup={onUserGroupClick}
            onClickGroupLink={onClickGroupLink}
            renderLeaf={(approver, i) => (
              <ApproverLeaf
                key={`approver_${group.roleName}_${approver.username}_${i}`}
                approver={approver}
                isReviewerSelectable={isReviewerSelectable}
                isSelected={selectedUsernames.has(approver.username)}
                onToggle={(val, checked) => onUserClick?.(val, checked)}
              />
            )}
          />
        ))}
      </vscode-tree>
    </div>
  );
};

export default ApproversView;
