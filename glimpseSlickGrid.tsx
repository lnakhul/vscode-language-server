import React, { useEffect, useMemo, useRef } from "react";
import { SlickgridReact, Column, GridOption } from "slickgrid-react";
import { PathApprover, QuackApproverGroup } from "./interfaces/interfaces";
import { createCopyLink, userToLink } from "../shared/sre/reactFunctions";
import { SpinningIcon } from "./SpinningIcon";
import { v4 as uuidv4 } from 'uuid';

// Interface for the new grid row data
interface ApproverGridRowData {
    id: string;
    groupName: string;
    approverName: string;
    initials: string;
    checked: boolean;
}

type ApproverViewProp = {
    approverGroups?: QuackApproverGroup[];
    onUserClick?: (approver: PathApprover, checked: boolean) => void;
    onUserGroupClick?: (group: QuackApproverGroup, checked: boolean) => void;
    isReviewerSelectable: boolean;
    selectedUsers?: PathApprover[] | null;
    onClickGroupLink?: (group: QuackApproverGroup) => void;
};

const ApproversView: React.FC<ApproverViewProp> = ({
    approverGroups,
    selectedUsers,
    isReviewerSelectable,
    onUserClick,
    onUserGroupClick,
    onClickGroupLink
}) => {
    const gridRef = useRef<SlickgridReact | null>(null);

    // If no approver groups, return spinning icon
    if (!approverGroups) {
        return <SpinningIcon iconName="refresh" spin={approverGroups === undefined} />;
    }

    // Prepare the rows for SlickGrid
    const selectedUserNames = useMemo(() => new Set<string>(selectedUsers?.map(val => val.userName)), [selectedUsers]);

    const rows: ApproverGridRowData[] = useMemo(() => {
        return approverGroups.flatMap(group => 
            group.approvers.map(approver => ({
                id: uuidv4(),
                groupName: group.roleName,
                approverName: approver.userName,
                initials: approver.powwow,
                checked: selectedUserNames.has(approver.userName)
            }))
        );
    }, [approverGroups, selectedUserNames]);

    // Grid columns
    const columns: Column[] = [
        {
            id: "groupName",
            name: "Group",
            field: "groupName",
            width: 150,
            formatter: (row, cell, value, columnDef, dataContext) => {
                const div = document.createElement("div");
                const link = document.createElement("a");
                link.textContent = value;
                link.href = "#";
                link.onclick = (e) => {
                    e.preventDefault();
                    onClickGroupLink?.(approverGroups.find(g => g.roleName === value)!);
                };
                div.appendChild(link);
                return div;
            }
        },
        {
            id: "approverName",
            name: "Approver",
            field: "approverName",
            width: 150,
            formatter: (row, cell, value, columnDef, dataContext) => {
                const div = document.createElement("div");
                div.innerHTML = userToLink(value, { userName: value } as PathApprover);
                return div;
            }
        },
        {
            id: "initials",
            name: "Initials",
            field: "initials",
            width: 100
        },
        {
            id: "checked",
            name: "Selected",
            field: "checked",
            width: 100,
            formatter: (_row, _cell, value) => {
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.checked = value;
                checkbox.disabled = !isReviewerSelectable;
                checkbox.onclick = () => {
                    const approver = rows[_row].approverName;
                    const group = rows[_row].groupName;
                    onUserClick?.({ userName: approver } as PathApprover, checkbox.checked);
                };
                return checkbox;
            }
        }
    ];

    const options: GridOption = {
        enableCellNavigation: true,
        enableColumnReorder: true,
        forceFitColumns: true
    };

    useEffect(() => {
        if (gridRef.current) {
            gridRef.current.dataset = rows;
        }
    }, [rows]);

    return (
        <SlickgridReact
            ref={gridRef}
            columnDefinitions={columns}
            gridOptions={options}
            dataset={rows}
            gridId={`approver_groups_grid`}
        />
    );
};

export default ApproversView;
