import * as vscode from 'vscode';
import * as path from 'path';
import { exec } from 'child_process';

const outputChannel = vscode.window.createOutputChannel('Docker Logs');

const runDockerComposeTask = () => {
	const type: string = 'shell';
	const command: string = 'docker-compose up -d my-python-service my-python-service2';
	const problemMatcher: string[] = [];
	const executionOptions: vscode.ShellExecutionOptions = { cwd: __dirname };
	const dockerTask: vscode.Task = new vscode.Task({ type: type }, vscode.TaskScope.Workspace, 'docker-up', 'extension-source', new vscode.ShellExecution(command, executionOptions), problemMatcher);

	vscode.tasks.executeTask(dockerTask).then(() => {
			vscode.window.showInformationMessage('Docker container finished executing!');
			printDockerLogs('my-python-service');
			printDockerLogs('my-python-service2');
			printContainerStatus('my-python-service');
			printContainerStatus('my-python-service2');
	});
};

const printDockerLogs = (serviceName: string) => {
	exec(`docker-compose -f ${path.join(__dirname, '..', 'docker-compose.yml')} logs ${serviceName}`, (error, stdout, stderr) => {
			if (error) {
					outputChannel.appendLine(`exec error: ${error}`);
					return;
			}
			outputChannel.appendLine(`Docker logs for ${serviceName}: ${stdout}`);
	});
};

const printContainerStatus = (containerName: string) => {
	exec(`docker ps -a --filter "name=${containerName}"`, (error, stdout, stderr) => {
			if (error) {
					outputChannel.appendLine(`exec error: ${error}`);
					return;
			}
			outputChannel.appendLine(`Status for ${containerName}: ${stdout}`);
	});
};

const debounce = (func: () => void, delay: number) => {
    let timeoutId: NodeJS.Timeout | undefined;
    return () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(func, delay);
    };
};

const debouncedRunDockerComposeTask = debounce(runDockerComposeTask, 10000);

export function activate(context: vscode.ExtensionContext) {
    vscode.window.showInformationMessage('Congratulations, your extension "ch24-test-ext" is now active!');

    const watcher: vscode.FileSystemWatcher = vscode.workspace.createFileSystemWatcher('**', false, false, false);

    watcher.onDidChange(debouncedRunDockerComposeTask);

    context.subscriptions.push(watcher);

    const disposable: vscode.Disposable = vscode.commands.registerCommand('ch24-test-ext.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from ch24-test-ext!');
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}