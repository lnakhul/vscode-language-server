import { createElement, useMemo, useState } from "react";
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

function createCopyLink(label: string, text: string, tooltip: string) {
    return createElement("a", {
        href: commandLink('quartz.internal.copyToClipboard', text), 
        title: tooltip,
        style: { cursor: 'pointer', textDecoration: 'none' }
    }, label);
}

type PathApprover = {
    displayName: string;
    powwow: string;
    username: string;
    nbkid: string;
    canApprove: boolean;
}

type QuackApproverGroup = {
    roleName: string;
    approvers: PathApprover[];
};

type ApproverViewProp = {
    approverGroups?: QuackApproverGroup[];
    onUserClick?: (approver: PathApprover, checked: boolean) => void;
    onUserGroupClick?: (group: QuackApproverGroup) => void;
    isReviewerSelectable: boolean;
    selectedUsers?: PathApprover[] | null;
    onClickGroupLink?: (group: QuackApproverGroup) => void;
};

export type ApproverListProps = {
    group: QuackApproverGroup;
    selected: Set<string>;
    isExpanded?: boolean;
    onSelectGroup?: (group: QuackApproverGroup, checked: boolean) => void;
    onClickGroupLink?: (group: QuackApproverGroup) => void;
};

export type ApproverItemProps = {
    approver: PathApprover;
    isApproverSelectable: boolean;
    isApproverSelected?: boolean;
    onApproverCheckClicked?: (val: PathApprover, checked: boolean) => void;
};

const ApproverTreeItem: React.FC<ApproverItemProps> = ({ 
    approver, 
    isApproverSelectable, 
    isApproverSelected, 
    onApproverCheckClicked 
}) => {
    const checked = !!isApproverSelected;
    const onToggleChecked = (evt: React.MouseEvent<HTMLElement>) => {
        evt.stopPropagation();
        onApproverCheckClicked?.(approver, !checked);
    };

    return (
        <vscode-tree-item>
            <div style={{ display: 'flex', alignItems: 'center', padding: '2px 0' }}>
                {isApproverSelectable && (
                    <vscode-checkbox 
                        checked={checked} 
                        onClick={onToggleChecked}
                        style={{ marginRight: '8px' }}
                    />
                )}
                <span>
                    {approver.displayName} {userToLink(approver.username, approver.powwow)} {approver.powwow}
                </span>
            </div>
        </vscode-tree-item>
    );
};

const ApproverGroupTree: React.FC<ApproverListProps> = ({ 
    group, 
    onSelectGroup, 
    selected, 
    onClickGroupLink, 
    isExpanded: initialIsExpanded 
}) => {
    const { roleName, approvers } = group;
    const [isExpanded, setIsExpanded] = useState(initialIsExpanded ?? false);
    const checked = approvers.every(val => selected.has(val.username));
    const initials = approvers.map(x => x.displayName[0]).join(" | ");
    const tooltip = `Click to copy Quartz Chat Initials to clipboard\n${initials}`;

    const onToggleGroupChecked = (evt: React.MouseEvent<HTMLElement>) => {
        evt.stopPropagation();
        onSelectGroup?.(group, !checked);
    };

    const handleLabelClick = (evt: React.MouseEvent) => {
        evt.stopPropagation();
        const target = evt.target as HTMLElement;
        // If clicking the link itself, trigger the group click
        if (target.tagName === 'A' || target.closest('a')) {
            onClickGroupLink?.(group);
        } else {
            // Otherwise toggle expansion
            setIsExpanded(!isExpanded);
        }
    };

    // Create label element with slot attribute using createElement
    const labelElement = createElement(
        'div',
        {
            slot: 'label',
            style: { display: 'flex', alignItems: 'center', cursor: 'pointer' },
            onClick: handleLabelClick
        },
        onSelectGroup && createElement('vscode-checkbox', {
            checked: checked,
            onClick: onToggleGroupChecked,
            style: { marginRight: '8px' }
        }),
        createCopyLink(roleName, initials, tooltip)
    );

    return createElement(
        'vscode-tree-item',
        { open: isExpanded },
        labelElement,
        ...approvers.map((approver, index) => 
            createElement(ApproverTreeItem, {
                key: `approver_item_${group.roleName}_${approver.username}_${index}`,
                approver: approver,
                isApproverSelectable: false,
                isApproverSelected: selected.has(approver.username)
            })
        )
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
        <vscode-tree class={styles.listStyle}>
            {groups.map((group, index) => (
                <ApproverGroupTree
                    key={`quack_approver_${index}`}
                    group={group}
                    onSelectGroup={onUserGroupClick}
                    selected={selectedUsernames}
                    onClickGroupLink={onClickGroupLink}
                    isExpanded={index === 0}
                />
            ))}
        </vscode-tree>
    );
};

export default ApproversView;
