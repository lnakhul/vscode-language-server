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


private async openLogHandler(uri: vscode.Uri) {
        const logFile = uri.query;
        if (!logFile) {
            vscode.window.showErrorMessage('No log file found.');
            return;
        }
        const logUri = vscode.Uri.parse(logFile);
        const logContent = await this.proxyManager.sendRequest<string>('retrieveLog', logUri.toString());
        if (!logContent) {
            vscode.window.showErrorMessage('Failed to retrieve log content.');
            return;
        }
        const logFileName = path.basename(logFile);
        const logUriStr = GlobalUriHandler.asUrl('logs', { path: logFile }).toString();
        const logDoc = await vscode.workspace.openTextDocument({ language: 'log', content: logContent });
        const logEditor = await vscode.window.showTextDocument(logDoc, { viewColumn: vscode.ViewColumn.Beside });
        logEditor.title = logFileName;
        logEditor.description = logUriStr;
    }

private async openLogHandler(uri: vscode.Uri) {
    const { query } = uri;
    const params = querystring.parse(query);
    if (params.path) {
        const logUri = vscode.Uri.parse(`vscode://${GlobalUriHandler.extensionName}/${params.path as string}`);
        const doc = await vscode.workspace.openTextDocument(logUri);
        await vscode.window.showTextDocument(doc);
    } else {
        vscode.window.showErrorMessage('Invalid URI. The "path" parameter is missing.');
    }
}

private async openLogHandler(uri?: vscode.Uri) {
    if (!uri) {
        const input = await vscode.window.showInputBox({ prompt: 'Enter the URI to open' });
        if (input) {
            uri = vscode.Uri.parse(input);
        } else {
            return;
        }
    }

    const { query } = uri;
    const params = querystring.parse(query);
    if (params.path) {
        const logUri = vscode.Uri.parse(`vscode://${GlobalUriHandler.extensionName}/${params.path as string}`);
        await vscode.env.openExternal(logUri);
    } else {
        vscode.window.showErrorMessage('Invalid URI. The "path" parameter is missing.');
    }
}

private async retrieveAndSendLogsEmail(): Promise<void> {
    try {
        // Call the Python method to retrieve logs
        const logsInfo: LogFileContent[] = await this.proxyManager.sendRequest<LogFileContent[]>('retrieveLogs');
        if (logsInfo.length === 0) {
            vscode.window.showInformationMessage('No logs to send.');
            return;
        }

        // Generate HTML page with links to open logs in VSCode
        const logLinks = logsInfo.map(log => {
            const logUri = GlobalUriHandler.asUrl('logs', { path: log.url });
            return `<a href="${logUri.toString()}">${logUri.toString()}</a>`;
        }).join('<br>');
        const htmlContent = `<!DOCTYPE html>
<html>
<body>
<p>Logs are available for review. Please click on the following links to open them in VS Code:</p>
${logLinks}
</body>
</html>`;
        const htmlFilePath = path.join(os.tmpdir(), 'logs.html');
        await fs.promises.writeFile(htmlFilePath, htmlContent);

        // Open default email client with pre-filled subject and body
        const emailBody = `Logs are available for review. Please visit the following page to view them: file://${htmlFilePath}`;
        const mailtoLink = `mailto:?subject=Logs from VSCode&body=${encodeURIComponent(emailBody)}`;
        vscode.env.openExternal(vscode.Uri.parse(mailtoLink));

        vscode.window.showInformationMessage('Email prepared with logs.');
    } catch (error) {
        Logger.error(`Failed to send logs email: ${error}`);
        vscode.window.showErrorMessage('Failed to prepare email with logs.');
    }
}

def getVSCodeLogHtmlCode(log_url):
    """
    Generate a hyperlink that opens a log file in VS Code.

    :param log_url: The URL of the log file.
    :return: An HTML string that represents a hyperlink.
    """
    vscode_url = f"vscode://quartz/logs?path={log_url}"
    return f'<a href="{vscode_url}">{log_url}</a>'

private async retrieveAndSendLogsEmail(): Promise<void> {
    try {
        // Call the Python method to retrieve logs
        const logsInfo: LogFileContent[] = await this.proxyManager.sendRequest<LogFileContent[]>('retrieveLogs');
        if (logsInfo.length === 0) {
            vscode.window.showInformationMessage('No logs to send.');
            return;
        }

        // Generate email body with links to open logs in VSCode
        const logLinks = logsInfo.map(log => {
            const logUri = getVSCodeLogHtmlCode(log.url);
            return logUri;
        }).join('<br>');
        const emailBody = `Logs are available for review. Please click on the following links to open them in VS Code:<br><br>${logLinks}`;

        // Open default email client with pre-filled subject and body
        const mailtoLink = `mailto:?subject=Logs from VSCode&body=${encodeURIComponent(emailBody)}`;
        vscode.env.openExternal(vscode.Uri.parse(mailtoLink));

        vscode.window.showInformationMessage('Email prepared with logs.');
    } catch (error) {
        Logger.error(`Failed to send logs email: ${error}`);
        vscode.window.showErrorMessage('Failed to prepare email with logs.');
    }
}


import qz.lib.mail

def postLogNotificationEmail(self, logFiles, requestedBy, additionalNotifyees=[]):
    """
    Send an email with links to log files.

    :param logFiles: A list of dictionaries with 'fileName', 'logContent', and 'url' keys.
    :param requestedBy: A string represents the original requester.
    :param additionalNotifyees: A list of additional notifyees with usernames.
    """
    if not logFiles:
        logger.info("No log files to send.")
        return

    usernames = list(set([requestedBy] + (additionalNotifyees or [])))
    emails = [email for email in (lookupEmailAddress(u) for u in usernames if u) if email]

    # Generate HTML links for each log file
    logLinks = ''.join([f'<a href="{log["url"]}">{log["fileName"]}</a><br>' for log in logFiles])
    html = f"<html><body><p>Log files are available for review:</p>{logLinks}</body></html>"

    subject = "Log Files Notification"

    if emails:
        try:
            logger.info(f"Sending log notification email to {', '.join(emails)}")
            qz.lib.mail.sendmail(
                sender=lookupEmailAddress(requestedBy),
                addrs=emails,
                subject=subject,
                body=html,
                format='html')
        except Exception as e:
            logger.error(f"Email notification failure: {repr(e)}", exc_info=True)
            return None

private async retrieveAndSendLogsEmail(): Promise<void> {
    try {
        // Assume logsInfo already contains the necessary log file information
        const logsInfo: LogFileContent[] = await this.proxyManager.sendRequest<LogFileContent[]>('retrieveLogs');
        if (logsInfo.length === 0) {
            vscode.window.showInformationMessage('No logs to send.');
            return;
        }

        // Call the Python service to send the email
        // This assumes you have a mechanism to call Python functions from TypeScript
        await this.proxyManager.sendRequest('postLogNotificationEmail', logsInfo, 'requestedByEmail', ['additionalNotifyee1', 'additionalNotifyee2']);
        vscode.window.showInformationMessage('Email with log file links sent.');
    } catch (error) {
        Logger.error(`Failed to send logs email: ${error}`);
        vscode.window.showErrorMessage('Failed to send email with log file links.');
    }
}
