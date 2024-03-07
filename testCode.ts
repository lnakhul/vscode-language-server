    private async getRecentLogs(): Promise<string[]> {
        const recentDays = this.getRecentDays();
        const logFiles: string[] = [];
        const tempDir = os.tmpdir();
        const quartzDir = path.join(tempDir, 'quartz');
        const vscodeFiles = await util.promisify(fs.readdir)(quartzDir);
        for (const file of vscodeFiles) {
            if (file.startsWith('vscode_')) {
                const filePath = path.join(quartzDir, file);
                const fileStat = await util.promisify(fs.stat)(filePath);
                if (fileStat.isFile() && recentDays.includes(fileStat.birthtime.toISOString().split('T')[0])) {
                    logFiles.push(filePath);
                }
            }
        }
        const tempFiles = await util.promisify(fs.readdir)(tempDir);
        for (const file of tempFiles) {
            if (file.startsWith('quartz_vscode_extension')) {
                const filePath = path.join(tempDir, file);
                const fileStat = await util.promisify(fs.stat)(filePath);
                if (fileStat.isDirectory() && recentDays.includes(fileStat.birthtime.toISOString().split('T')[0])) {
                    const files = await util.promisify(fs.readdir)(filePath);
                    for (const file of files) {
                        if (file.startsWith('vscode_')) {
                            logFiles.push(path.join(filePath, file));
                        }
                    }
                }
            }
        }
        return logFiles;
    }


  private getRecentDays(): string[] {
        const recentDays: string[] = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            recentDays.push(`${month}/${day}/${date.getFullYear()}`);
        }
        return recentDays;
    }

private getRecentDays(): string[] {
    const recentDays: string[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        recentDays.push(`${date.getFullYear()}-${month}-${day}`);
    }
    return recentDays;
}


if (fileStat.isFile()) {
                    // Convert the file's birthtime to YYYY-MM-DD format
                    const birthTime = fileStat.birthtime;
                    const month = (birthTime.getMonth() + 1).toString().padStart(2, '0');
                    const day = birthTime.getDate().toString().padStart(2, '0');
                    const birthDate = `${birthTime.getFullYear()}-${month}-${day}`;
    
                    // Check if the birthdate is in the last 7 days
                    if (recentDays.includes(birthDate)) {
                        logFiles.push(filePath);
                    }
                }
