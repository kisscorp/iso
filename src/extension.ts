import * as vscode from 'vscode';
import * as path from 'path';

let timeout: NodeJS.Timeout | undefined = undefined;
let changedFiles: Set<string> = new Set();

export function activate(context: vscode.ExtensionContext) {
		vscode.window.showInformationMessage('Congratulations, your extension "ch24-test-ext" is now active!');

    const watcher = vscode.workspace.createFileSystemWatcher('**', false, false, false);

    watcher.onDidChange(e => {
        changedFiles.add(path.basename(e.fsPath));

        if (timeout) {
            clearTimeout(timeout);
        }

        timeout = setTimeout(() => {
						vscode.window.showInformationMessage(`Files changed in the last 10 seconds: ${Array.from(changedFiles).join(", ")}`);
            changedFiles.clear();
        }, 10000);
    });

    context.subscriptions.push(watcher);

    let disposable = vscode.commands.registerCommand('ch24-test-ext.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from ch24-test-ext!');
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}