import { createElement, useMemo } from "react";
import "@vscode-elements/elements/dist/vscode-checkbox";
import "@vscode-elements/elements/dist/vscode-tree";
import "@vscode-elements/elements/dist/vscode-tree-item";
import FormLabel from "./FormLabel";
import { SpinningIcon } from "./SpinningIcon";
import styles from "../css/ApproversListView.module.css";
import { userToLink } from "../reactFunctions";

function commandLink(command: string, ...args: string[]) {
    const encodedArgs = args.length > 0 ? `?${encodeURIComponent(JSON.stringify(args))}` : "";
    return `command:${command}${encodedArgs}`;
}

// keep this so clicking the group name can still copy to clipboard
function createCopyLink(label: string, text: string, tooltip: string) {
    return createElement(
        "a",
        {
            href: commandLink("quartz.internal.copyToClipboard", text),
            title: tooltip,
            onClick: (evt: MouseEvent) => {
                // don’t let the anchor navigation mess with the tree selection
                evt.preventDefault();
                evt.stopPropagation();
            }
        } as any,
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
    onUserGroupClick?: (group: QuackApproverGroup, checked: boolean) => void; // existing prop
    isReviewerSelectable: boolean;
    selectedUsers?: PathApprover[] | null;
    onClickGroupLink?: (group: QuackApproverGroup) => void; // from reviewSummary.tsx
};

type GroupTreeItemProps = {
    group: QuackApproverGroup;
    expanded?: boolean;
    selectedUsernames: Set<string>;
    isReviewerSelectable: boolean;
    onUserClick?: (approver: PathApprover, checked: boolean) => void;
    onClickGroupLink?: (group: QuackApproverGroup) => void;
    onUserGroupClick?: (group: QuackApproverGroup, checked: boolean) => void;
};

const GroupTreeItem: React.FC<GroupTreeItemProps> = ({
    group,
    expanded,
    selectedUsernames,
    isReviewerSelectable,
    onUserClick,
    onClickGroupLink,
    onUserGroupClick
}) => {
    const { roleName, approvers } = group;

    // this is what your reviewSummary.tsx code actually wants to add to the comments:
    const groupInitials = approvers.map(val => val.powwow).join(" | ");

    const tooltipBase = `Click to copy Quartz Chat initials to clipboard\n${groupInitials}`;

    // when user clicks the "label" area of the parent tree item
    const handleGroupClick = (evt: React.MouseEvent<HTMLElement>) => {
        // fire your existing callback so the comments tab gets updated
        onClickGroupLink?.(group);
        // if you still want “select all” behavior on group click, you can call this, but
        // I’m leaving it guarded so you can decide:
        // onUserGroupClick?.(group, true);
        evt.stopPropagation();
    };

    return (
        <vscode-tree-item expanded={expanded}>
            {/* parent label content */}
            <div className={styles.groupHeader} onClick={handleGroupClick}>
                {/* we wrap the role name with the copy-to-clipboard anchor like you had */}
                {createCopyLink(roleName, groupInitials, tooltipBase)}
            </div>

            {/* children as tree items */}
            {approvers.map((approver, index) => {
                const checked = selectedUsernames.has(approver.username);

                const handleApproverCheckbox = (evt: React.MouseEvent<HTMLElement>) => {
                    evt.stopPropagation();
                    onUserClick?.(approver, !checked);
                };

                // make the leaf “clickable to copy” too, like you said you wanted
                const approverInitials = approver.powwow;
                const approverTooltip = `Click to copy ${approverInitials} to clipboard`;

                const handleLeafClick = (evt: React.MouseEvent<HTMLElement>) => {
                    // if you also want to push this to comments, route through onClickGroupLink
                    // but with a single-user wrapper — depends on your UX.
                    evt.stopPropagation();
                };

                return (
                    <vscode-tree-item key={`approver_${group.roleName}_${approver.username}_${index}`} slot="child">
                        <div className={styles.approverItemStyle} onClick={handleLeafClick}>
                            {isReviewerSelectable && (
                                <vscode-checkbox checked={checked} onClick={handleApproverCheckbox}></vscode-checkbox>
                            )}
                            <FormLabel style={{ display: "inline-block", marginLeft: "5px" }}>
                                {/* keep userToLink etc. */}
                                {approver.displayName} {userToLink(approver.username, approver.powwow)}{" "}
                                {createCopyLink(approver.powwow, approver.powwow, approverTooltip)}
                            </FormLabel>
                        </div>
                    </vscode-tree-item>
                );
            })}
        </vscode-tree-item>
    );
};

/*** Approver View ***/
export const ApproversView: React.FC<ApproverViewProp> = ({
    approverGroups,
    selectedUsers,
    isReviewerSelectable,
    onUserClick,
    onUserGroupClick,
    onClickGroupLink
}) => {
    if (!approverGroups) {
        return <SpinningIcon iconName="refresh" spin={approverGroups === undefined} />;
    }

    const groups = useMemo<QuackApproverGroup[]>(
        () => approverGroups.filter(val => val.approvers.length > 0),
        [approverGroups]
    );
    const selectedUsernames = new Set<string>(selectedUsers?.map(val => val.username));

    return (
        <div className={styles.listStyle}>
            <vscode-tree>
                {groups.map((group, index) => (
                    <GroupTreeItem
                        key={`quack_approver_${index}`}
                        group={group}
                        expanded={index === 0}
                        selectedUsernames={selectedUsernames}
                        isReviewerSelectable={isReviewerSelectable}
                        onUserClick={onUserClick}
                        onClickGroupLink={onClickGroupLink}
                        onUserGroupClick={onUserGroupClick}
                    />
                ))}
            </vscode-tree>
        </div>
    );
};

export default ApproversView;
