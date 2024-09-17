 private async extractErrorDetails(logFiles: ExtensionLog[]): Promise<string> {
        const errorDetails: string[] = [];
        for (const logFile of logFiles) {
            const content = await vscode.workspace.fs.readFile(vscode.Uri.file(logFile.path));
            const logContent = content.toString();
            const errors = logContent.match(/ERROR.*$/gm);
            if (errors) {
                errors.slice(0, 5).forEach(error => {
                    const timestamp = error.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
                    errorDetails.push(`Timestamp: ${timestamp ? timestamp[0] : 'N/A'}\nError: ${error}`);
                });
            }
        }
        return errorDetails.length > 0 ? errorDetails.join('\n\n') : 'No errors found in the attached log files.';
    }
