import { BaseTreeDataProvider, BaseTreeExplorerView } from './explorer';
import vscode from 'vscode';
import { shellApiClient } from './shellApiClient';

interface TreeViewRegistration {
    id: string;
    dataProvider: BaseTreeDataProvider;
    explorerView: BaseTreeExplorerView;
}

export interface ShellNodeData {
    id: string;
    label: string;
    hasChildren?: boolean;
    // ...additional fields that come back from your Shell API or DB
}

class ShellAPI {
    private static instance: ShellAPI;
    private registeredViews: Map<string, TreeViewRegistration> = new Map();

    private constructor() {}

    public static getInstance(): ShellAPI {
        if (!ShellAPI.instance) {
            ShellAPI.instance = new ShellAPI();
        }
        return ShellAPI.instance;
    }

    public registerTreeView(id: string, dataProvider: BaseTreeDataProvider, explorerView: BaseTreeExplorerView): void {
        if (this.registeredViews.has(id)) {
            throw new Error(`TreeView with id ${id} is already registered.`);
        }
        this.registeredViews.set(id, { id, dataProvider, explorerView });
    }

    public getRegisteredViews(): TreeViewRegistration[] {
        return Array.from(this.registeredViews.values());
    }

    public getTreeViewById(id: string): TreeViewRegistration | undefined {
        return this.registeredViews.get(id);
    }

    /**
     * Fetches the *root* data from your backend.
     */
    public async fetchRootData(): Promise<ShellNodeData[]> {
        try {
            const response = await shellApiClient.get('/rootNodes');
            return response.data;
        } catch (error) {
            console.error('Error fetching root data:', error);
            throw error;
        }
    }

    /**
     * Fetches the *child* data for a given node ID.
     */
    public async fetchChildNodes(parentId: string): Promise<ShellNodeData[]> {
        try {
            const response = await shellApiClient.get(`/childNodes/${parentId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching child nodes for parent ID ${parentId}:`, error);
            throw error;
        }
    }
}

export const shellAPI = ShellAPI.getInstance();
