import React, { useEffect, useMemo, useRef } from "react";
import { SlickgridReact, Column, GridOption } from "slickgrid-react";
import { v4 as uuidv4 } from 'uuid';
import { SpinningIcon } from "./SpinningIcon";
import { PathApprover, QuackApproverGroup } from "./interfaces/interfaces";

// Define the interface for the SlickGrid row data
interface ApproverGridRowData {
    id: string;
    parent: string | null; // Parent ID for tree structure
    roleName?: string;
    displayName?: string;
    powwow?: string;
    userName?: string;
    canApprove?: boolean;
    isGroup: boolean; // Distinguishes between groups and individual approvers
}

// Function to transform approver data into the SlickGrid format
const convertApproversToGridData = (approverGroups: QuackApproverGroup[]): ApproverGridRowData[] => {
    const data: ApproverGridRowData[] = [];
    approverGroups.forEach(group => {
        const groupId = uuidv4();
        data.push({
            id: groupId,
            parent: null,
            roleName: group.roleName,
            isGroup: true
        });
        group.approvers.forEach(approver => {
            data.push({
                id: uuidv4(),
                parent: groupId,
                displayName: approver.displayName,
                powwow: approver.powwow,
                userName: approver.userName,
                canApprove: approver.canApprove,
                isGroup: false
            });
        });
    });
    return data;
};

type ApproversViewProps = {
    approverGroups?: QuackApproverGroup[];
    isReviewerSelectable: boolean;
    selectedUsers?: Set<string>;
    onUserClick?: (approver: PathApprover, checked: boolean) => void;
    onUserGroupClick?: (group: QuackApproverGroup) => void;
};

const ApproversView: React.FC<ApproversViewProps> = ({ 
    approverGroups, 
    isReviewerSelectable, 
    selectedUsers, 
    onUserClick, 
    onUserGroupClick 
}) => {
    const gridRef = useRef<SlickgridReact | null>(null);

    // Use a spinner if approver groups are not yet available
    if (!approverGroups) return <SpinningIcon iconName="refresh" spin={true} />;

    const data = useMemo(() => convertApproversToGridData(approverGroups), [approverGroups]);

    // Define the SlickGrid columns
    const columns: Column<ApproverGridRowData>[] = [
        {
            id: 'roleName',
            name: 'Group/Approver',
            field: 'roleName',
            formatter: (_row, _cell, value, columnDef, dataContext) => {
                if (dataContext.isGroup) {
                    // Group Header
                    return `<span class="slickgroup-header">${value}</span>`;
                } else {
                    // Individual Approver
                    return `<span class="slickgroup-approver">${dataContext.displayName} (${dataContext.powwow})</span>`;
                }
            },
            cssClass: 'slick-cell',
            width: 200
        },
        ...(isReviewerSelectable ? [{
            id: 'select',
            name: 'Select',
            field: 'canApprove',
            formatter: (_row, _cell, value, columnDef, dataContext) => {
                if (!dataContext.isGroup) {
                    return `<input type="checkbox" ${value ? "checked" : ""} ${dataContext.canApprove ? "" : "disabled"}/>`;
                }
                return '';
            },
            cssClass: 'slick-cell',
            width: 50
        }] : [])
    ];

    const options: GridOption = {
        enableTreeData: true,
        treeDataOptions: {
            columnId: 'roleName',
            parentPropName: 'parent',
            childrenPropName: 'children',
            collapsed: true
        },
        enableCellNavigation: true,
        enableColumnReorder: false,
        forceFitColumns: true
    };

    // Resize grid when it becomes visible
    useEffect(() => {
        const observer = new MutationObserver(() => {
            if (gridRef.current) {
                window.dispatchEvent(new Event("resize"));
            }
        });
        observer.observe(document.body, { attributes: true, childList: true, subtree: true });
        return () => observer.disconnect();
    }, []);

    return (
        <SlickgridReact
            ref={gridRef}
            gridId="approversGrid"
            columnDefinitions={columns}
            gridOptions={options}
            dataset={data}
        />
    );
};

export default ApproversView;
