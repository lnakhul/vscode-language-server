import React, { useMemo, useRef } from "react";
import "@vscode-elements/elements/dist/vscode-checkbox";
import "@vscode-elements/elements/dist/vscode-tree";
import "@vscode-elements/elements/dist/vscode-tree-item";
import FormLabel from "./FormLabel";
import { SpinningIcon } from "./SpinningIcon";
import styles from "../css/ApproversListView.module.css";
import { createCopyLink, userToLink } from "../reactFunctions";

/** Types (same as your file) */
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

/** ----- Leaf (Approver) as a vscode-tree-item ----- */
type ApproverItemProps = {
  approver: PathApprover;
  isApproverSelectable: boolean;
  isApproverSelected?: boolean;
  onApproverCheckClicked?: (val: PathApprover, checked: boolean) => void;
};

const ApproverTreeItem: React.FC<ApproverItemProps> = ({
  approver,
  isApproverSelectable,
  isApproverSelected,
  onApproverCheckClicked,
}) => {
  const checked = !!isApproverSelected;

  const onToggleChecked: React.MouseEventHandler = (e) => {
    e.stopPropagation(); // don’t toggle the branch when clicking the checkbox
    onApproverCheckClicked?.(approver, !checked);
  };

  return (
    <vscode-tree-item class={styles.approverItemStyle as any}>
      {isApproverSelectable && (
        <vscode-checkbox checked={checked} onClick={onToggleChecked} />
      )}
      <FormLabel style={{ display: "inline-block", marginLeft: "5px" }}>
        {approver.displayName} {userToLink(approver.username, approver.powwow)}{" "}
        {approver.powwow}
      </FormLabel>
    </vscode-tree-item>
  );
};

/** ----- Group (Branch) as a vscode-tree-item with children ----- */
type ApproverListProps = {
  group: QuackApproverGroup;
  selected: Set<string>;
  isExpanded?: boolean;
  onSelectGroup?: (group: QuackApproverGroup, checked: boolean) => void;
  render: (approver: PathApprover, index: number) => React.ReactNode;
  onClickGroupLink?: (group: QuackApproverGroup) => void;
};

const ApproverGroupTreeItem: React.FC<ApproverListProps> = ({
  group,
  selected,
  isExpanded,
  onSelectGroup,
  render,
  onClickGroupLink,
}) => {
  const { roleName, approvers } = group;
  const itemRef = useRef<any>(null);
  const allChecked = approvers.every((a) => selected.has(a.username));

  // Keep your current initials computation
  const initials = approvers.map((x) => x.displayName[0]).join(" | ");
  let tooltip = `Click on element to copy Quartz Chat Initiials to clipboard\n${initials}`;
  if (onSelectGroup) tooltip += ` and select all reviewers in ${roleName} quack group`;

  const onGroupCheckboxClick: React.MouseEventHandler = (e) => {
    e.stopPropagation();
    onSelectGroup?.(group, !allChecked);
    // mirror previous UX where checkbox toggled the expand/collapse state
    if (itemRef.current) {
      itemRef.current.open = !itemRef.current.open;
    }
  };

  const onGroupLinkClick: React.MouseEventHandler<HTMLSpanElement> = (e) => {
    // Don’t let the tree toggle; allow the <a> inside to fire its command URI
    e.stopPropagation();
    onClickGroupLink?.(group);
    // do not preventDefault() — we want the anchor’s command to run
    // also (optionally) ensure the branch is open after clicking
    if (itemRef.current) itemRef.current.open = true;
  };

  return (
    <vscode-tree-item ref={itemRef} open={isExpanded as any}>
      <div
        className={styles.groupHeader as any}
        style={{ display: "flex", alignItems: "center", gap: 8 }}
      >
        {onSelectGroup && (
          <vscode-checkbox checked={allChecked} onClick={onGroupCheckboxClick} />
        )}

        {/* Wrap the existing createCopyLink anchor so we can attach onClick without changing its implementation */}
        <FormLabel cssClassName={styles.groupHeader}>
          <span onClick={onGroupLinkClick}>
            {createCopyLink(roleName, initials, tooltip)}
          </span>
        </FormLabel>
      </div>

      {/* Children */}
      {approvers.map((a, i) => render(a, i))}
    </vscode-tree-item>
  );
};

/** ----- Top-level View: a single <vscode-tree> containing all groups/items ----- */
export const ApproversView: React.FC<ApproverViewProp> = ({
  approverGroups,
  selectedUsers,
  isReviewerSelectable,
  onUserClick,
  onUserGroupClick,
  onClickGroupLink,
}) => {
  if (!approverGroups)
    return (
      <SpinningIcon
        iconName="refresh"
        spin={approverGroups === undefined}
      />
    );

  const groups = useMemo<QuackApproverGroup[]>(
    () => approverGroups.filter((g) => g.approvers.length > 0),
    [approverGroups]
  );
  const selectedUsernames = new Set<string>(
    selectedUsers?.map((u) => u.username)
  );

  return (
    <vscode-tree class={styles.listStyle as any}>
      {groups.map((group, index) => (
        <ApproverGroupTreeItem
          key={`quack_approver_${index}`}
          group={group}
          selected={selectedUsernames}
          onSelectGroup={onUserGroupClick}
          onClickGroupLink={onClickGroupLink}
          isExpanded={index === 0} // first group open
          render={(approver, i) => (
            <ApproverTreeItem
              key={`approver_item_${group.roleName}_${approver.username}_${i}`}
              approver={approver}
              isApproverSelectable={isReviewerSelectable}
              isApproverSelected={selectedUsernames.has(approver.username)}
              onApproverCheckClicked={onUserClick}
            />
          )}
        />
      ))}
    </vscode-tree>
  );
};

export default ApproversView;


==========================================================================================
import React, { useMemo, useRef, useEffect } from "react";
// …your existing imports…

const ApproverGroupTreeItem: React.FC<ApproverListProps> = ({
  group,
  selected,
  isExpanded,
  onSelectGroup,
  render,
  onClickGroupLink,
}) => {
  const { roleName, approvers } = group;
  const itemRef = useRef<any>(null);
  const linkHostRef = useRef<HTMLSpanElement | null>(null);

  const allChecked = approvers.every((a) => selected.has(a.userName));

  // Use the same initials you rely on elsewhere (powwow) so copy/insert stays identical
  const initials = approvers.map((x) => x.powwow).join(" | ");

  let tooltip = `Click on element to copy Quartz Chat Initiials to clipboard\n${initials}`;
  if (onSelectGroup) tooltip += ` and select all reviewers in ${roleName} quack group`;

  const onGroupCheckboxClick: React.MouseEventHandler = (e) => {
    e.stopPropagation();
    onSelectGroup?.(group, !allChecked);
    if (itemRef.current) itemRef.current.open = !itemRef.current.open;
  };

  // Normalize the <a> returned by createCopyLink so it never opens a new frame
  useEffect(() => {
    const host = linkHostRef.current;
    if (!host) return;
    const anchor = host.querySelector<HTMLAnchorElement>("a");
    if (!anchor) return;

    // Force in-document nav to avoid CSP “frame-src” block
    anchor.setAttribute("target", "_self");
    anchor.removeAttribute("rel");

    const onAnchorClick = (ev: MouseEvent) => {
      // Keep tree from toggling / swallowing the event:
      ev.stopPropagation();
      // Prevent default browser/webview nav route that triggered CSP:
      ev.preventDefault();

      // Preserve your behavior: append initials to Comments:
      onClickGroupLink?.(group);

      // Keep branch open:
      if (itemRef.current) itemRef.current.open = true;

      // Hand off to VS Code by navigating the webview to the command: URI
      // (VS Code will intercept if enableCommandUris is true)
      (window as any).location.href = anchor.href;
    };

    // Use capture to win over internal handlers
    anchor.addEventListener("click", onAnchorClick, { capture: true });
    return () => anchor.removeEventListener("click", onAnchorClick, { capture: true } as any);
  }, [group, onClickGroupLink, initials]);

  return (
    <vscode-tree-item ref={itemRef} open={isExpanded as any}>
      <div className={styles.groupHeader as any} style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {onSelectGroup && (
          <vscode-checkbox checked={allChecked} onClick={onGroupCheckboxClick} />
        )}

        <FormLabel cssClassName={styles.groupHeader}>
          {/* Wrap createCopyLink so we can normalize the inner <a> */}
          <span ref={linkHostRef} onMouseDown={(e) => e.stopPropagation()}>
            {createCopyLink(roleName, initials, tooltip)}
          </span>
        </FormLabel>
      </div>

      {approvers.map((a, i) => render(a, i))}
    </vscode-tree-item>
  );
};


=============================================================

// once, at module scope
const vscodeApi = typeof acquireVsCodeApi === "function" ? acquireVsCodeApi() : null;

// inside ApproverGroupTreeItem
const linkHostRef = useRef<HTMLSpanElement | null>(null);

useEffect(() => {
  const host = linkHostRef.current;
  if (!host) return;

  const a = host.querySelector<HTMLAnchorElement>("a");
  if (!a) return;

  // keep look & tooltip but prevent native nav
  const href = a.getAttribute("href") || "";
  a.setAttribute("data-href", href);
  a.removeAttribute("href");
  a.setAttribute("role", "button");
  a.setAttribute("tabindex", "0");

  // capture early, and block every route to navigation
  const handler = (ev: Event) => {
    // block <vscode-tree> and the browser
    (ev as any).stopImmediatePropagation?.();
    ev.stopPropagation();
    ev.preventDefault();

    // your existing “append to Comments” path
    onClickGroupLink?.(group);
    if (itemRef.current) itemRef.current.open = true;

    // hand the command: URI to VS Code (enableCommandUris must be true)
    try {
      const cmd = a.getAttribute("data-href")!;
      // direct nav causes VS Code to intercept the command:
      (window as any).location.href = cmd;
    } catch (e) {
      // (optional) fallback if command URIs are disabled
      console.error("command nav failed", e);
    }
  };

  // capture phase = true; listen to multiple events to preempt synthetic clicks
  a.addEventListener("click", handler, { capture: true });
  a.addEventListener("pointerdown", handler, { capture: true });
  a.addEventListener("mousedown", handler, { capture: true });

  return () => {
    a.removeEventListener("click", handler, { capture: true } as any);
    a.removeEventListener("pointerdown", handler, { capture: true } as any);
    a.removeEventListener("mousedown", handler, { capture: true } as any);
  };
}, [group, onClickGroupLink]);


========================================================================================================================

// once per module
const vscodeApi = typeof acquireVsCodeApi === "function" ? acquireVsCodeApi() : null;

function ApproverGroupTreeItem({ group, selected, isExpanded, onSelectGroup, onClickGroupLink, render }) {
  const itemRef = React.useRef<any>(null);
  const linkHostRef = React.useRef<HTMLSpanElement | null>(null);

  const allChecked = group.approvers.every(a => selected.has(a.username));
  const initials = React.useMemo(() => group.approvers.map(x => x.powwow).join(" | "), [group.approvers]);

  React.useEffect(() => {
    const host = linkHostRef.current;
    if (!host) return;
    const a = host.querySelector<HTMLAnchorElement>("a");
    if (!a) return;

    // 1) Keep look/tooltip, but prevent ANY navigation (the CSP culprit)
    const href = a.getAttribute("href") || "";
    a.setAttribute("data-href", href);
    a.removeAttribute("href");              // <- critical: no navigation target
    a.setAttribute("role", "button");
    a.setAttribute("tabindex", "0");

    // 2) Click handler in CAPTURE phase so tree can’t hijack it
    const onClick = (ev: Event) => {
      (ev as any).stopImmediatePropagation?.();
      ev.stopPropagation();
      ev.preventDefault();

      // Append initials to Comments (your existing behavior)
      onClickGroupLink?.(group);

      // Keep the branch open
      if (itemRef.current) itemRef.current.open = true;

      // Ask extension to copy to clipboard using your existing command
      vscodeApi?.postMessage({ type: "copyInitials", text: initials });
    };

    a.addEventListener("click", onClick, { capture: true });
    a.addEventListener("pointerdown", onClick, { capture: true }); // belt & suspenders
    return () => {
      a.removeEventListener("click", onClick, { capture: true } as any);
      a.removeEventListener("pointerdown", onClick, { capture: true } as any);
    };
  }, [group, onClickGroupLink, initials]);

  return (
    <vscode-tree-item ref={itemRef} open={isExpanded as any}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {onSelectGroup && (
          <vscode-checkbox
            checked={allChecked}
            onClick={(e) => { e.stopPropagation(); onSelectGroup(group, !allChecked); }}
          />
        )}
        <FormLabel>
          {/* Use your same helper for visuals/tooltip; we neutralize it above */}
          <span ref={linkHostRef} onMouseDown={(e) => e.stopPropagation()}>
            {createCopyLink(group.roleName, initials, `Click to copy initials\n${initials}`)}
          </span>
        </FormLabel>
      </div>

      {group.approvers.map((a, i) => render(a, i))}
    </vscode-tree-item>
  );
}



