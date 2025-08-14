import React, { useEffect, useMemo, useRef, useState } from "react";
import "@vscode-elements/elements/dist/vscode-tree";
import "@vscode-elements/elements/dist/vscode-tree-item";
import "@vscode-elements/elements/dist/vscode-checkbox";
import { SpinningIcon } from "./SpinningIcon";
import FormLabel from "./FormLabel";
import styles from "../css/ApproversListView.module.css";
import { userToLink } from "../reactFunctions";

/** Types copied from existing implementation for compatibility */
export type PathApprover = {
  displayName: string;
  powwow: string;
  username: string;
  nbkid: string;
  canApprove: boolean;
};

export type QuackApproverGroup = {
  roleName: string;
  approvers: PathApprover[];
};

type ApproverViewProp = {
  approverGroups?: QuackApproverGroup[];
  isReviewerSelectable: boolean;
  selectedUsers?: PathApprover[] | null;
  /** Fires when a single approver's checkbox is toggled */
  onUserClick?: (approver: PathApprover, checked: boolean) => void;
  /** Fires when a whole group's checkbox is toggled */
  onUserGroupClick?: (group: QuackApproverGroup, checked: boolean) => void;
  /** Your existing callback that appends initials to the comment field */
  onClickGroupLink?: (group: QuackApproverGroup) => void;
};

// Helper to find an approver by username in a group
function findApprover(groups: QuackApproverGroup[], username: string): { group: QuackApproverGroup; approver: PathApprover } | null {
  for (const g of groups) {
    const a = g.approvers.find(x => x.username === username);
    if (a) return { group: g, approver: a };
  }
  return null;
}

// Convert a group into a tree node that vscode-tree understands
function groupToTreeNode(
  group: QuackApproverGroup,
  opts: {
    isReviewerSelectable: boolean;
    selectedUsernames: Set<string>;
    open?: boolean;
  }
) {
  const selectedCount = group.approvers.filter(a => opts.selectedUsernames.has(a.username)).length;
  const initials = group.approvers.map(a => a.displayName?.[0]).filter(Boolean).join(" | ");

  return {
    // basic node data
    label: group.roleName,
    value: JSON.stringify({ type: "group", roleName: group.roleName, initials }),
    open: !!opts.open,
    icons: true as const,

    // actions appear as icon buttons on the right of the item
    actions: [
      // copy initials to clipboard – handle in vsc-tree-action below
      { icon: "copy", actionId: "copy-initials", tooltip: `Copy initials ( ${initials} )` },
      // select-all checkbox UX – toggles the entire group selection
      { icon: selectedCount === group.approvers.length ? "check" : "circle-outline", actionId: "toggle-group", tooltip: selectedCount === group.approvers.length ? "Unselect all" : "Select all" },
    ],

    // small counter on the right showing how many are selected in this group
    decorations: selectedCount > 0 ? [{ appearance: "counter-badge", content: String(selectedCount) }] : undefined,

    // leaf nodes = approvers
    subItems: group.approvers.map(a => ({
      label: `${a.displayName} ${userToLink(a.username, a.powwow)}`,
      value: JSON.stringify({ type: "approver", username: a.username }),
      icons: true as const,
      // When reviewer selection is enabled, show a check/circle action to toggle
      actions: opts.isReviewerSelectable ? [
        { icon: opts.selectedUsernames.has(a.username) ? "check" : "circle-outline", actionId: "toggle-approver", tooltip: opts.selectedUsernames.has(a.username) ? "Unselect" : "Select" },
      ] : undefined,
    })),
  };
}

/**
 * ApproversView – drop-in replacement built on <vscode-tree>
 *
 * Keeps existing props/exports so Review Summary can continue to do:
 *   <ApproversView approverGroups={...} onClickGroupLink={onUserGroupClick} ... />
 */
export const ApproversView: React.FC<ApproverViewProp> = ({
  approverGroups,
  selectedUsers,
  isReviewerSelectable,
  onUserClick,
  onUserGroupClick,
  onClickGroupLink,
}) => {
  // loading state preserved from old component
  if (!approverGroups) return <SpinningIcon iconName="refresh" spin={approverGroups === undefined} />;

  const groups = useMemo(() => approverGroups.filter(g => g.approvers.length > 0), [approverGroups]);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(groups.length ? [groups[0].roleName] : []));
  const selectedUsernames = useMemo(() => new Set<string>(selectedUsers?.map(u => u.username)), [selectedUsers]);

  const treeRef = useRef<any>(null);

  // Translate our data model to vscode-tree data whenever state changes
  const data = useMemo(() => {
    return groups.map(g => groupToTreeNode(g, { isReviewerSelectable, selectedUsernames, open: openGroups.has(g.roleName) }));
  }, [groups, isReviewerSelectable, selectedUsernames, openGroups]);

  useEffect(() => {
    if (treeRef.current) {
      (treeRef.current as any).data = data;
    }
  }, [data]);

  // Handle item selection (clicking on the label area)
  const onTreeSelect = (ev: any) => {
    const detail = ev?.detail;
    // detail can be an array (multi-select disabled by default) – normalize
    const item = Array.isArray(detail) ? detail[0] : detail;
    if (!item?.value) return;
    try {
      const payload = JSON.parse(item.value);
      if (payload.type === "group") {
        // 1) Expand on select
        setOpenGroups(prev => new Set(prev).add(item.label));
        // 2) Keep existing behavior: clicking group adds initials to the comment field
        //    via the provided callback
        const group = groups.find(g => g.roleName === item.label);
        if (group && onClickGroupLink) onClickGroupLink(group);
      }
    } catch {
      // ignore
    }
  };

  // Handle action buttons (copy, toggle-group, toggle-approver)
  const onTreeAction = (ev: any) => {
    const { actionId, value } = ev?.detail || {};
    if (!actionId || !value) return;

    const payload = JSON.parse(value);

    if (actionId === "copy-initials" && payload.type === "group") {
      // Copy initials using VS Code "command:" link behavior via hidden anchor
      const a = document.createElement("a");
      a.href = `command:quartz.internal.copyToClipboard?${encodeURIComponent(JSON.stringify([payload.initials]))}`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => a.remove(), 0);
      return;
    }

    if (actionId === "toggle-group" && payload.type === "group") {
      const group = groups.find(g => g.roleName === payload.roleName);
      if (!group) return;
      const allSelected = group.approvers.every(a => selectedUsernames.has(a.username));
      onUserGroupClick?.(group, !allSelected);
      // Opening/closing mirrors old UX when ticking the group
      setOpenGroups(prev => {
        const next = new Set(prev);
        if (!next.has(group.roleName)) next.add(group.roleName);
        return next;
      });
      return;
    }

    if (actionId === "toggle-approver" && payload.type === "approver") {
      const found = findApprover(groups, payload.username);
      if (!found) return;
      const isSelected = selectedUsernames.has(found.approver.username);
      onUserClick?.(found.approver, !isSelected);
      return;
    }
  };

  return (
    <div className={styles.listStyle}>
      {/* Optional header – mirrors prior UI styling; safe to remove */}
      <FormLabel cssClassName={styles.groupHeader}>Recommended Approver Groups</FormLabel>

      {/*
        Note: the tree web component is controlled by assigning `.data` (see useEffect above).
        We still listen to events through React to trigger the same behaviors you previously had.
      */}
      <vscode-tree
        ref={treeRef}
        indent-guides
        arrows
        onVsc-tree-select={onTreeSelect as any}
        onVsc-tree-action={onTreeAction as any}
      ></vscode-tree>
    </div>
  );
};

export default ApproversView;
