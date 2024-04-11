import * as vscode from 'vscode';
import * as path from 'path';
import { exec } from 'child_process';
import { calculateRadonScore, calculateCpdScore, calculateBanditScore } from '@grnsft/if-unofficial-plugins';

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

			// New code: calculate and print the aggregated score
			calculateAndPrintAggregateScore();
	});
};

const printDockerLogs = (serviceName: string) => {
	exec(`docker-compose -f ${path.join(__dirname, '..', 'docker-compose.yml')} logs ${serviceName}`, (error, stdout, stderr) => {
		if (error) {
			outputChannel.appendLine(`exec error: ${error}`);
			return;
		}

		if (serviceName === 'my-iso-radon-service') {
			const score = calculateRadonScore(stdout);
			outputChannel.appendLine(`Simplicity score: ${score}`);
			// vscode.window.showInformationMessage(`Simplicity score: ${score}`);
		} else if (serviceName === 'my-iso-cpd-service') {
			const score = calculateCpdScore(stdout);
			outputChannel.appendLine(`Duplication score: ${score}`);
			// vscode.window.showInformationMessage(`Duplication score: ${score}`);
		} else if (serviceName === 'my-iso-bandit-service') {
			const score = calculateBanditScore(stdout);
			outputChannel.appendLine(`Security score: ${score}`);
			// vscode.window.showInformationMessage(`Security score: ${score}`);
		} else {
			outputChannel.appendLine(`Service ${serviceName} stdout: ${stdout}`);
			// outputChannel.appendLine(`Service ${serviceName} stderr: ${stderr}`);
		}
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

const calculateAndPrintAggregateScore = () => {

	const services: string[] = [
			'my-iso-radon-service',
			'my-iso-cpd-service',
			'my-iso-bandit-service'
	];

	// Map each service to a Promise
	const servicePromises: Promise<number>[] = services.map((serviceName: string) => {
			return new Promise<number>((resolve, reject) => {
					exec(`docker-compose -f ${path.join(__dirname, '..', 'docker-compose.yml')} logs ${serviceName}`, (error: Error | null, stdout: string, stderr: string) => {
							if (error) {
									outputChannel.appendLine(`exec error: ${error}`);
									reject(error);
									return;
							}

							let score: number = 0;
							if (serviceName === 'my-iso-radon-service') {
									score = calculateRadonScore(stdout);
							} else if (serviceName === 'my-iso-cpd-service') {
									score = calculateCpdScore(stdout);
							} else if (serviceName === 'my-iso-bandit-service') {
									score = calculateBanditScore(stdout);
							}

							// Check if score is a number before resolving
							if (typeof score === "number") {
									resolve(score);
							} else {
									reject(new Error(`Score for ${serviceName} is not a number: ${score}`));
							}
					});
			});
	});

	// Wait for all services to finish executing
	Promise.all(servicePromises).then((scores: number[]) => {
			const totalScore: number = scores.reduce((a: number, b: number) => a + b, 0); // Sum all scores
			const sustainabilityScore: number = totalScore / services.length; // Calculate average
			outputChannel.appendLine(`Sustainability score: ${sustainabilityScore}`);
			vscode.window.showInformationMessage(`Sustainability score: ${sustainabilityScore}`);
	}).catch((err: Error) => {
			outputChannel.appendLine(`Error calculating aggregate score: ${err}`);
	});
};

export function deactivate() {}