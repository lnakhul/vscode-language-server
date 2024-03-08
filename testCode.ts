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


private async getRecentLogs(): Promise<string[]> {
    const logFiles: string[] = [];
    const tempDir = os.tmpdir();
    const quartzDir = path.join(tempDir, 'quartz');
    const vscodeFiles = await util.promisify(fs.readdir)(quartzDir);
    const filteredFiles = vscodeFiles.filter(file => file.startsWith('vscode_')).sort().reverse().slice(0, 5);
    for (const file of filteredFiles) {
        const filePath = path.join(quartzDir, file);
        const fileStat = await util.promisify(fs.stat)(filePath);
        if (fileStat.isFile()) {
            logFiles.push(filePath);
        }
    }
    return logFiles;
}

def retrieve_logs(self) -> List[Dict]:
        """Retrieves all logs from Sandra and returns their information."""
        try:
            logs_container = self.db.read_or_new("Container", self.logSourceDir)
            logs_info = []
            for log_obj in logs_container.contents.get('containers', []):
                log_info = {
                    "fileName": log_obj['name'],
                    "url": self.generate_url(log_obj['name'])
                }
                logs_info.append(log_info)
            return logs_info
        except Exception as e:
            logger.error(f"Failed to retrieve logs: {e}")
            return []

private async retrieveAndSendLogsEmail(): Promise<void> {
        try {
            // Call the Python method to retrieve logs
            const logsInfo: LogFileContent[] = await this.proxyManager.sendRequest('log:retrieveLogs');
            if (logsInfo.length === 0) {
                vscode.window.showInformationMessage('No logs to send.');
                return;
            }

            // Generate email body with links to open logs in VSCode
            const logLinks = logsInfo.map(log => `[${log.fileName}](${log.url})`).join('\n');
            const emailBody = `Logs are available for review:\n\n${logLinks}`;

            // Open default email client with pre-filled subject and body
            const mailtoLink = `mailto:?subject=Logs from VSCode&body=${encodeURIComponent(emailBody)}`;
            vscode.env.openExternal(vscode.Uri.parse(mailtoLink));

            vscode.window.showInformationMessage('Email prepared with logs.');
        } catch (error) {
            Logger.error(`Failed to send logs email: ${error}`);
            vscode.window.showErrorMessage('Failed to prepare email with logs.');
        }
    }


def handle_retrieveLogs(self, ctx) -> List[Dict]:
    """Retrieves all logs stored in Sandra"""
    try:
        logs_info = []
        for file_path in sandra.walk(self.logSourceDir, db=self.db, returnDirs=False):
            log_obj = self.db.read("Container", file_path)
            log_info = {
                "fileName": os.path.basename(file_path),
                "logContent": log_obj.contents.get('logContent', ''),
                "url": self.generate_url(file_path)
            }
            logs_info.append(log_info)
        return logs_info
    except Exception as e:
        logger.error(f"Failed to retrieve logs: {e}")
        return []
