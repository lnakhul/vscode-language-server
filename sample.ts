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

/**
 * NEW: Manual JSX rendering of <vscode-tree-item> children
 * -------------------------------------------------------
 * Some bundlers/React setups delay the custom element upgrade which can cause
 * the `.data`-driven API to render nothing until the element upgrades.
 * This version renders children explicitly so you immediately see your tree.
 *
 * We still listen to the `vsc-tree-select` event to keep your original behavior:
 *  - Clicking a group label expands it and calls onClickGroupLink(group)
 */
export const ApproversView: React.FC<ApproverViewProp> = ({
  approverGroups,
  selectedUsers,
  isReviewerSelectable,
  onUserClick,
  onUserGroupClick,
  onClickGroupLink,
}) => {
  if (approverGroups === undefined) {
    return <SpinningIcon iconName="refresh" spin={true} />;
  }

  const groups = useMemo(() => (approverGroups ?? []).filter(g => (g?.approvers?.length ?? 0) > 0), [approverGroups]);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(groups.length ? [groups[0].roleName] : []));
  const selectedUsernames = useMemo(() => new Set<string>(selectedUsers?.map(u => u.username)), [selectedUsers]);

  const treeRef = useRef<any>(null);

  // Attach native custom-event listeners (React doesn't know dash-cased events)
  useEffect(() => {
    const el = treeRef.current as HTMLElement | null;
    if (!el) return;

    const onSelect = (ev: Event) => {
      // @ts-ignore – custom event detail
      const detail = (ev as CustomEvent).detail;
      const item = Array.isArray(detail) ? detail[0] : detail;
      if (!item) return;
      const payloadRaw = item?.el?.dataset?.payload;
      if (!payloadRaw) return;
      try {
        const payload = JSON.parse(payloadRaw);
        if (payload.type === "group") {
          setOpenGroups(prev => new Set(prev).add(payload.roleName));
          const group = groups.find(g => g.roleName === payload.roleName);
          if (group && onClickGroupLink) onClickGroupLink(group);
        }
      } catch {/* ignore */}
    };

    el.addEventListener("vsc-tree-select", onSelect);
    return () => {
      el.removeEventListener("vsc-tree-select", onSelect);
    };
  }, [groups, onClickGroupLink]);

  // Render helpers
  const renderApprover = (a: PathApprover) => (
    <vscode-tree-item
      key={a.username}
      data-payload={JSON.stringify({ type: "approver", username: a.username })}
    >
      {`${a.displayName} ${userToLink(a.username, a.powwow)}`}
    </vscode-tree-item>
  );

  const renderGroup = (g: QuackApproverGroup) => {
    const initials = g.approvers.map(a => a.powwow).join(" | ");
    return (
      <vscode-tree-item
        key={g.roleName}
        open={openGroups.has(g.roleName) as any}
        data-payload={JSON.stringify({ type: "group", roleName: g.roleName, initials })}
      >
        {g.roleName}
        {g.approvers.map(renderApprover)}
      </vscode-tree-item>
    );
  };

  return (
    <div className={styles.listStyle}>
      <FormLabel cssClassName={styles.groupHeader}>Recommended Approver Groups</FormLabel>

      <vscode-tree
        ref={treeRef}
        indent-guides
        arrows
        style={{ display: "block", minHeight: 160, maxHeight: 360, overflow: "auto" }}
      >
        {groups.map(renderGroup)}
      </vscode-tree>

      {groups.length === 0 && (
        <div className={styles.empty}>No approver groups available.</div>
      )}
    </div>
  );
};

export default ApproversView;
