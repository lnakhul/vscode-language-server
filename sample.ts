async downloadKeybindings(): Promise<void> {
    try {
        const remoteKeybindings = await this.fetchRemoteKeybindings();
        const localKeybindings = await this.readLocalKeybindings();
        const mergedKeybindings = this.mergeKeybindings(localKeybindings, remoteKeybindings);
        await this.writeKeybindingsToFile(mergedKeybindings);
    } catch (error) {
        console.error(`Failed to download keybindings: ${error}`);
    }
}

private async fetchRemoteKeybindings(): Promise<any[]> {
    const remoteText = await this.proxyManager.sendRequest<string>(
        null,
        'file:downloadKeybindings'
    );

    try {
        const remote = JSON.parse(remoteText);
        if (!Array.isArray(remote)) throw new Error('Remote keybindings are not an array');
        return remote;
    } catch (e) {
        throw new Error(`Downloaded keybindings.json is invalid JSON: ${e}`);
    }
}

private async readLocalKeybindings(): Promise<any[]> {
    try {
        const localBytes = await vscode.workspace.fs.readFile(this.keybindingsPath);
        const localText = Buffer.from(localBytes).toString('utf8');
        const local = JSON.parse(localText);
        if (!Array.isArray(local)) throw new Error('Local keybindings are not an array');
        return local;
    } catch {
        // Missing file or parse error: start with an empty array
        return [];
    }
}

private mergeKeybindings(local: any[], remote: any[]): any[] {
    const merged = [...local];
    for (const entry of remote) {
        const duplicate = merged.find(
            x =>
                x.key === entry.key &&
                x.command === entry.command &&
                x.when === entry.when
        );
        if (!duplicate) merged.push(entry);
    }
    return merged;
}

private async writeKeybindingsToFile(keybindings: any[]): Promise<void> {
    const output = JSON.stringify(keybindings, null, 2);
    await vscode.workspace.fs.writeFile(
        this.keybindingsPath,
        Buffer.from(output, 'utf8')
    );
}
