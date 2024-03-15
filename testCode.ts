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

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as util from 'util';
import { LogHelper } from '../logHelper';
import { MockProxyManager } from '../mocks/proxyManager';
import { SourceCache } from './sourceCache';
import { mock } from 'jest-mock-extended';
import { expect, test } from '@jest/globals';
import { MockInstanceStore } from '../utils';
import { container, cleanupTestContainer, prepareTestContainers } from '../testDi';

jest.mock("../../logging");

jest.mock('vscode', () => ({
    commands : {
       registerCommand: jest.fn(),
    },
    workspace : {
        registerTextDocumentContentProvider: jest.fn(),
        openTextDocument: jest.fn().mockResolvedValue({}),
    },
    window : {
        showTextDocument: jest.fn().mockResolvedValue({}),
        showInputBox: jest.fn().mockResolvedValue(''),
        showInformationMessage: jest.fn().mockResolvedValue({}),
        showErrorMessage: jest.fn().mockResolvedValue({}),
    },
    Uri : {
        parse: jest.fn().mockReturnValue({ }),
        file: jest.fn().mockReturnValue({}),
    },
    env : {
        openExternal: jest.fn().mockResolvedValue(undefined),
    },

}));

jest.mock('fs', () => ({
    readdir : jest.fn(),
    stat : jest.fn(),
    readFile : jest.fn(),
}));
jest.mock('os');
jest.mock('path');
jest.mock('util', () => ({
    ...jest.requireActual('util'),
    promisify: jest.fn().mockImplementation((fn) => fn),
}));


describe('LogHelper test Test', () => {
    let logHelper: LogHelper;
    let mockProxyManager: ProxyManager;
    let mockSourceCache: SourceCache;

    const mockInstanceStore = new MockInstanceStore();

    beforeAll(() => {
        prepareTestContainers();
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    beforeEach(() => {
        mockSourceCache = mock<SourceCache>();
        logHelper = new LogHelper(mockSourceCache, mockProxyManager);
    });

    afterEach(() => {
        mockInstanceStore.restore();
        jest.clearAllMocks();
    });

    test('should handle URI', async () => {
        const mockUri = logHelper.handleUri(vscode.Uri.parse('quartz-extension-log://authority/path?path=test'));
        await logHelper.handleUri(mockUri);

        expect(vscode.window.openTextDocument).toHaveBeenCalled();
        expect(vscode.window.showTextDocument).toHaveBeenCalled();

    });

    test('should provide text document content', async () => {
        const testPath = 'test';
        logHelper.cacheResults.set(testPath, 'Test log content');
        const content = await logHelper.provideTextDocumentContent(vscode.Uri.parse('quartz-extension-log://authority/path?path=test'));

        expect(content).toBe('Test log content');
    });

    test('should open log handler', async () => {
        await logHelper.openLogHandler(vscode.Uri.parse('quartz-extension-log://authority/path?path=test'));

        expect(vscode.env.openExternal).toHaveBeenCalled();
    });

    test('should send logs handler', async () => {
        logHelper.getRecentLogs = jest.fn().mockResolvedValue(['test']);
        logHelper.uploadLogsToSandra = jest.fn().mockResolvedValue([{ fileName: 'test', logContent: 'content', url: 'test' }]);
        logHelper.retrieveAndSendLogsEmail = jest.fn().mockResolvedValue(undefined);
        vscode.window.showInformationMessage = jest.fn().mockResolvedValue(undefined);

        await logHelper.sendLogsHandler();

        expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('Log files uploaded successfully.');
    });

    test('should get recent logs', async () => {
        const readdirMock = fs.readdir as jest.MockedFunction<typeof fs.readdir>;
        const statMock = fs.stat as jest.MockedFunction<typeof fs.stat>;
        const promisifyMock = util.promisify as jest.MockedFunction<typeof util.promisify>;
        const tmpdirMock = os.tmpdir as jest.MockedFunction<typeof os.tmpdir>;

        tmpdirMock.mockReturnValue('/tmp');
        readdirMock.mockImplementation(() => Promise.resolve(['vscode_test']));
        statMock.mockImplementation(() => Promise.resolve({ isFile: () => true, birthtime: new Date() }));
        promisifyMock.mockImplementation((fn) => fn);

        const logs = await logHelper.getRecentLogs();

        expect(logs).toEqual(['/tmp/quartz/vscode_test']);
    });

    test('should upload logs to Sandra', async () => {
        const promisifyMock = util.promisify as jest.MockedFunction<typeof util.promisify>;
        promisifyMock.mockImplementation(() => () => Promise.resolve(Buffer.from('test')));
        mockProxyManager.sendRequest = jest.fn().mockResolvedValue([{ fileName: 'test', logContent: 'content', url: 'test' }]);

        const logs = await logHelper.uploadLogsToSandra(['test']);

        expect(logs).toEqual([{ fileName: 'test', logContent: 'content', url: 'test' }]);
    });

    test('should retrieve and send logs email', async () => {
        mockProxyManager.sendRequest = jest.fn().mockResolvedValue([{ fileName: 'test', logContent: 'content', url: 'test' }]);

        await logHelper.retrieveAndSendLogsEmail();

        expect(mockProxyManager.sendRequest).toHaveBeenCalledTimes(2);
    });

    describe('dispose', () => {
        test('should dispose of trash', () => {
            logHelper.dispose();
        });
    });
});


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


import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as zlib from 'zlib';
import * as util from 'util';
import { LogHelper } from './logHelper';
import { ProxyManager } from './proxyManager';
import { SourceCache } from './sourceCache';

jest.mock('vscode');
jest.mock('fs');
jest.mock('os');
jest.mock('path');
jest.mock('zlib');
jest.mock('util');
jest.mock('./proxyManager');
jest.mock('./sourceCache');

describe('LogHelper', () => {
    let logHelper: LogHelper;
    let proxyManager: ProxyManager;
    let sourceCache: SourceCache;

    beforeEach(() => {
        proxyManager = new ProxyManager();
        sourceCache = new SourceCache();
        logHelper = new LogHelper(proxyManager, sourceCache);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should handle URI', async () => {
        // Mock methods
        vscode.Uri.parse = jest.fn().mockReturnValue({ scheme: 'quartz-extension-log', query: 'path=test' });
        vscode.workspace.openTextDocument = jest.fn().mockResolvedValue({});
        vscode.window.showTextDocument = jest.fn().mockResolvedValue({});
        proxyManager.sendRequest = jest.fn().mockResolvedValue([{ url: 'test', logContent: 'content' }]);

        await logHelper.handleUri(vscode.Uri.parse('quartz-extension-log://authority/path?path=test'));

        expect(vscode.workspace.openTextDocument).toHaveBeenCalled();
        expect(vscode.window.showTextDocument).toHaveBeenCalled();
    });

    it('should provide text document content', async () => {
        const content = await logHelper.provideTextDocumentContent(vscode.Uri.parse('quartz-extension-log://authority/path?path=test'));
        expect(content).toBeUndefined();
    });

    it('should open log handler', async () => {
        vscode.window.showInputBox = jest.fn().mockResolvedValue('quartz-extension-log://authority/path?path=test');
        vscode.env.openExternal = jest.fn().mockResolvedValue(undefined);

        await logHelper.openLogHandler();

        expect(vscode.env.openExternal).toHaveBeenCalled();
    });

    it('should send logs handler', async () => {
        logHelper.getRecentLogs = jest.fn().mockResolvedValue(['test']);
        logHelper.uploadLogsToSandra = jest.fn().mockResolvedValue([{ fileName: 'test', logContent: 'content', url: 'test' }]);
        logHelper.retrieveAndSendLogsEmail = jest.fn().mockResolvedValue(undefined);
        vscode.window.showInformationMessage = jest.fn().mockResolvedValue(undefined);

        await logHelper.sendLogsHandler();

        expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('Log files uploaded successfully.');
    });

    it('should get recent logs', async () => {
        os.tmpdir = jest.fn().mockReturnValue('/tmp');
        util.promisify = jest.fn().mockImplementation(() => () => Promise.resolve(['vscode_test']));
        fs.stat = jest.fn().mockResolvedValue({ isFile: () => true, birthtime: new Date() });

        const logs = await logHelper.getRecentLogs();

        expect(logs).toEqual(['/tmp/quartz/vscode_test']);
    });

    it('should upload logs to Sandra', async () => {
        util.promisify = jest.fn().mockImplementation(() => () => Promise.resolve(Buffer.from('test')));
        proxyManager.sendRequest = jest.fn().mockResolvedValue([{ fileName: 'test', logContent: 'content', url: 'test' }]);

        const logs = await logHelper.uploadLogsToSandra(['test']);

        expect(logs).toEqual([{ fileName: 'test', logContent: 'content', url: 'test' }]);
    });

    it('should retrieve and send logs email', async () => {
        proxyManager.sendRequest = jest.fn().mockResolvedValue([{ fileName: 'test', logContent: 'content', url: 'test' }]);

        await logHelper.retrieveAndSendLogsEmail();

        expect(proxyManager.sendRequest).toHaveBeenCalledTimes(2);
    });
});

import { subDays, format } from 'date-fns';

// ...

public async getRecentLogs(): Promise<string[]> {
    const recentDays = Array.from({ length: this._numberOfDays }, (_, i) => format(subDays(new Date(), i), 'MM/dd/yyyy'));
    // ...
}


import { format } from 'date-fns';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as util from 'util';

public async getRecentLogs(): Promise<string[]> {
    const recentDays = this.getRecentDays(); // Ensure this is an array of strings in 'MM/dd/yyyy' format
    const logFiles: string[] = [];
    const tempDir = os.tmpdir();

    // Function to process and filter files by prefix and creation date
    const processFiles = async (directory: string, prefix: string, checkDate: boolean = true) => {
        try {
            const files = await util.promisify(fs.readdir)(directory);
            for (const file of files) {
                if (file.startsWith(prefix)) {
                    const filePath = path.join(directory, file);
                    const fileStat = await util.promisify(fs.stat)(filePath);
                    if (fileStat.isFile()) {
                        // If checkDate is true, filter files by their creation dates
                        if (checkDate) {
                            const birthDateFormatted = format(fileStat.birthtime, "MM/dd/yyyy");
                            if (recentDays.includes(birthDateFormatted)) {
                                logFiles.push(filePath);
                            }
                        } else {
                            logFiles.push(filePath);
                        }
                    } else if (fileStat.isDirectory()) {
                        // Recursively process nested directories
                        await processFiles(filePath, "vscode_", checkDate);
                    }
                }
            }
        } catch (err) {
            console.error(`Error processing files in directory ${directory}:`, err);
        }
    };

    // Process files directly under 'quartz' directory
    const quartzDir = path.join(tempDir, 'quartz');
    await processFiles(quartzDir, "vscode_");

    // Process files within directories starting with 'quartz_vscode_extension'
    const tempFiles = await util.promisify(fs.readdir)(tempDir);
    for (const tempFile of tempFiles) {
        if (tempFile.startsWith('quartz_vscode_extension')) {
            const dirPath = path.join(tempDir, tempFile);
            // For directories, no need to check the date, as the requirement seems to fetch all nested files
            await processFiles(dirPath, "vscode_", false);
        }
    }

    return logFiles;
}




import { format } from 'date-fns';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as util from 'util';

public async getRecentLogs(): Promise<string[]> {
    const recentDays = this.getRecentDays(); // Ensure this is an array of strings in 'MM/dd/yyyy' format
    const logFiles: string[] = [];
    const tempDir = os.tmpdir();

    const processQuartzFiles = async (directory: string) => {
        const files = await util.promisify(fs.readdir)(directory);
        for (const file of files) {
            if (file.startsWith('vscode_')) {
                const filePath = path.join(directory, file);
                const fileStat = await util.promisify(fs.stat)(filePath);
                if (fileStat.isFile()) {
                    const birthDateFormatted = format(fileStat.birthtime, "MM/dd/yyyy");
                    if (recentDays.includes(birthDateFormatted)) {
                        logFiles.push(filePath);
                    }
                }
            }
        }
    };

    const processExtensionFiles = async (directory: string) => {
        const items = await util.promisify(fs.readdir)(directory, { withFileTypes: true });
        for (const item of items) {
            const filePath = path.join(directory, item.name);
            const fileStat = await util.promisify(fs.stat)(filePath);
            // Check the directory's creation date
            if (item.isDirectory() && item.name.startsWith('quartz_vscode_extension')) {
                const dirBirthDateFormatted = format(fileStat.birthtime, "MM/dd/yyyy");
                if (recentDays.includes(dirBirthDateFormatted)) {
                    // Process all files within this directory
                    const nestedFiles = await util.promisify(fs.readdir)(filePath);
                    for (const nestedFile of nestedFiles) {
                        logFiles.push(path.join(filePath, nestedFile)); // Add without date check
                    }
                }
            }
        }
    };

    // Process files in "quartz" directory with date filtering
    const quartzDir = path.join(tempDir, 'quartz');
    await processQuartzFiles(quartzDir);

    // Process all files in directories starting with "quartz_vscode_extension" with date filtering
    const tempFiles = await util.promisify(fs.readdir)(tempDir);
    for (const tempFile of tempFiles) {
        if (tempFile.startsWith('quartz_vscode_extension')) {
            const dirPath = path.join(tempDir, tempFile);
            await processExtensionFiles(dirPath); // Apply date filter based on directory's date
        }
    }

    return logFiles;
}
