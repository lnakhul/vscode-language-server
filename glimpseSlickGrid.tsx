import React, { useCallback, useEffect, useMemo, useState } from "react";
import { css, StyleSheet } from "aphrodite";
import { PathApprover, QuackApproverGroup } from "./interfaces/interfaces";
import { createCopyLink, userToLink } from "../shared/sre/reactFunctions";
import FormLabel from "./FormLabel";
import { SpinningIcon } from "./SpinningIcon";
import { VSCodeCheckbox } from "@vscode/webview-ui-toolkit/react";

const styles = StyleSheet.create({
  listStyle: {
    display: 'block',
    width: "100%"
  },
  groupHeader: {
    fontSize: 'calc(1.2 * var(--vscode-font-size))',
    margin: "7px 5px 2px",
    display: "inline-block",
    cursor: "pointer"
  },
  approverItemStyle: {
    marginTop: "5px",
    minWidth: "max-content"
  },
  approverLabelStyle: {
    display: "inline-block",
    marginLeft: "5px"
  },
  approverListStyle: {
    listStyle: "none",
    paddingLeft: "20px"
  }
});

type QuackApproverGroup = {
    roleName: string;
    approvers: PathApprover[];
};

type PathApprover = {
    displayName: string;
    powwow: string;
    userName: string;
    nbkid: string;
    canApprove: boolean;
};

type ApproverViewProp = {
  approverGroups?: QuackApproverGroup[];
  onUserClick?: (approver: PathApprover, checked: boolean) => void;
  onUserGroupClick?: (group: QuackApproverGroup, checked: boolean) => void;
  isReviewerSelectable: boolean;
  selectedUsers?: PathApprover[] | null;
  onClickGroupLink?: (group: QuackApproverGroup) => void;
};

export type ApproverListProp = {
  group: QuackApproverGroup;
  selected: Set<string>;
  onSelectGroup?: (group: QuackApproverGroup, checked: boolean) => void;
  render: (approver: PathApprover, index: number) => React.ReactElement;
  onClickGroupLink?: (group: QuackApproverGroup) => void;
};

export type ApproverItemProp = {
  approver: PathApprover;
  isApproverSelectable: boolean;
  isApproverSelected?: boolean;
  onApproverCheckClicked?: (val: PathApprover, checked: boolean) => void;
};

const ApproverListItem: React.FC<ApproverItemProp> = ({ approver, isApproverSelectable, isApproverSelected, onApproverCheckClicked }) => {
    const checked = !!isApproverSelected;
    const onToggleChecked = (evt: React.MouseEvent<HTMLElement>) => {
      onApproverCheckClicked?.(approver, !checked);
    };
  
    return (
      <li className={itemStyle}>
        {isApproverSelectable && <VSCodeCheckbox checked={checked} onClick={onToggleChecked} /> }<FormLabel style={styles.approverLabelStyle}>{`${approver.displayName}`} {userToLink(approver.userName, approver.powwow)} {approver.powwow}</FormLabel>
      </li>
    );
};
  
const ApproverListView: React.FC<ApproverListProp> = ({ group, render, onSelectGroup, selected, onClickGroupLink }) => {
  const { roleName, approvers } = group;
  const [isExpanded, setIsExpanded] = useState(false);
  const checked = group.approvers.every(val => selected.has(val.userName));
  const initials = approvers.map(x => x.powwow).join('|');
  let tooltip = `Click on element to copy Quartz Chat Initials to clipboard\n${initials}`;
  if (onSelectGroup) tooltip += ` and select all reviewers in ${roleName} quack group.`;

  const onToggleGroupChecked = (evt: React.MouseEvent<HTMLElement>) => {
      onSelectGroup?.(group, !checked);
  };

  const onGroupClick = (evt: React.MouseEvent<HTMLDivElement>) => {
      onClickGroupLink?.(group);
      setIsExpanded(!isExpanded);
  };

  return (
      <div>
        <span>{onSelectGroup && <VSCodeCheckbox checked={checked} onClick={onToggleGroupChecked} />}<FormLabel style={styles.groupHeader} onClick={onGroupClick}>{createCopyLink(roleName, initials, tooltip)}</FormLabel></span>
        {isExpanded && (
          <ul className={css(styles.approverListStyle)}>
              {approvers.map(render)}
          </ul>
        )}
      </div>
    );
};
  
/*** Approver View */
const itemStyle = css(styles.approverItemStyle);
export const ApproversView: React.FC<ApproverViewProp> = ({ approverGroups, selectedUsers, isReviewerSelectable, onUserClick, onUserGroupClick, onClickGroupLink}) => {
    if (!approverGroups) return <SpinningIcon iconName="refresh" spin={approverGroups === undefined} />;
    const groups = useMemo<QuackApproverGroup[]>(() => approverGroups.filter(val => val.approvers.length > 0), [approverGroups]);
    const selectedUserNames = new Set<string>(selectedUsers?.map(val => val.userName));
    return (
        <div className={css(styles.listStyle)}>
            {
                groups.map((group, index) => (
                    <ApproverListView key={`quack_approver_${index}`} group={group} onSelectGroup={onUserGroupClick} selected={selectedUserNames} onClickGroupLink={onClickGroupLink} 
                        render={(approver, index) => (
                            <ApproverListItem key={`approver_item_${group.roleName}_${approver.userName}_${index}`} approver={approver} isApproverSelectable={isReviewerSelectable} isApproverSelected={selectedUserNames.has(approver.userName)} onApproverCheckClicked={onUserClick} />
                        )}
                    />
                ))}
        </div>
    );
};

export default ApproversView;
