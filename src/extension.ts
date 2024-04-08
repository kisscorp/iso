import * as vscode from 'vscode';
import * as path from 'path';
import { exec } from 'child_process';

const outputChannel = vscode.window.createOutputChannel('Docker Logs');

const runDockerComposeTask = () => {
	const type: string = 'shell';
	const command: string = 'docker-compose up my-iso-radon-service my-iso-cpd-service my-iso-bandit-service';
	const problemMatcher: string[] = [];

  if (vscode.workspace.workspaceFolders !== undefined) {
		process.env['WORKSPACE_PATH'] = vscode.workspace.workspaceFolders[0].uri.fsPath;
	}

	const env: any = {};
	for (let key in process.env) {
			if (process.env[key] !== undefined) {
					env[key] = process.env[key];
			}
	}

	const executionOptions: vscode.ShellExecutionOptions = { 
			cwd: __dirname,
			env: process.env as any
	};

	const dockerTask: vscode.Task = new vscode.Task({ type: type }, vscode.TaskScope.Workspace, 'docker-up', 'extension-source', new vscode.ShellExecution(command, executionOptions), problemMatcher);

	if (vscode.workspace.workspaceFolders !== undefined) {
      process.env['WORKSPACE_PATH'] = vscode.workspace.workspaceFolders[0].uri.fsPath;
  }

	vscode.tasks.executeTask(dockerTask).then(() => {
			vscode.window.showInformationMessage('Docker container finished executing!');
			printDockerLogs('my-python-service');
			printDockerLogs('my-python-service2');
			printDockerLogs('my-iso-radon-service');
			printDockerLogs('my-iso-cpd-service');
			printDockerLogs('my-iso-bandit-service');
			printContainerStatus('my-python-service');
			printContainerStatus('my-python-service2');
			printContainerStatus('my-iso-radon-service');
			printContainerStatus('my-iso-cpd-service');
			printContainerStatus('my-iso-bandit-service');
	});
};

const printDockerLogs = (serviceName: string) => {
	exec(`docker-compose -f ${path.join(__dirname, '..', 'docker-compose.yml')} logs ${serviceName}`, (error, stdout, stderr) => {
		if (error) {
			outputChannel.appendLine(`exec error: ${error}`);
			return;
		}
		outputChannel.appendLine(`Service ${serviceName} stdout: ${stdout}`);
		outputChannel.appendLine(`Service ${serviceName} stderr: ${stderr}`);
		if (stdout.includes("Application completed successfully")) {
			outputChannel.appendLine(`Service ${serviceName} completed successfully`);
		} else {
			outputChannel.appendLine(`Service ${serviceName} failed to complete successfully`);
		}
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