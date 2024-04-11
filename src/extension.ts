import * as vscode from 'vscode';
import * as path from 'path';
import { spawn } from 'child_process';
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
    const command = spawn('docker-compose', ['-f', path.join(__dirname, '..', 'docker-compose.yml'), 'logs', serviceName]);

    let stdout = '';
    let stderr = '';

    command.stdout.on('data', (data) => {
        stdout += data.toString();
    });

    command.stderr.on('data', (data) => {
        stderr += data.toString();
    });

    command.on('close', (code) => {
        if (code !== 0) {
            outputChannel.appendLine(`exec error: Command exited with code ${code}`);
            return;
        }

        if (serviceName === 'my-iso-radon-service') {
            const score = calculateRadonScore(stdout);
            outputChannel.appendLine(`Simplicity score: ${score}`);
        } else if (serviceName === 'my-iso-cpd-service') {
            const score = calculateCpdScore(stdout);
            outputChannel.appendLine(`Duplication score: ${score}`);
        } else if (serviceName === 'my-iso-bandit-service') {
            const score = calculateBanditScore(stdout);
            outputChannel.appendLine(`Security score: ${score}`);
        } else {
            outputChannel.appendLine(`Service ${serviceName} stdout: ${stdout}`);
        }

        if (stdout.includes("Application completed successfully")) {
            outputChannel.appendLine(`Service ${serviceName} completed successfully`);
        } else {
            outputChannel.appendLine(`Service ${serviceName} failed to complete successfully`);
					}
				});
		};
		
		const printContainerStatus = (containerName: string) => {
				const command = spawn('docker', ['ps', '-a', '--filter', `name=${containerName}`]);
		
				let stdout = '';
				let stderr = '';
		
				command.stdout.on('data', (data) => {
						stdout += data.toString();
				});
		
				command.stderr.on('data', (data) => {
						stderr += data.toString();
				});
		
				command.on('close', (code) => {
						if (code !== 0) {
								outputChannel.appendLine(`exec error: Command exited with code ${code}`);
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
				vscode.window.showInformationMessage('Congratulations, your extension "iso" is now active!');
		
				const watcher: vscode.FileSystemWatcher = vscode.workspace.createFileSystemWatcher('**', false, false, false);
		
				watcher.onDidChange(debouncedRunDockerComposeTask);
		
				context.subscriptions.push(watcher);
		
				const disposable: vscode.Disposable = vscode.commands.registerCommand('ch24-test-ext.helloWorld', () => {
						vscode.window.showInformationMessage('Hello World from iso!');
				});
		
				context.subscriptions.push(disposable);
		}

		const calculateAndPrintAggregateScore = (weights = { radon: 0.3, cpd: 0.3, bandit: 0.4 }) => {
			const services: string[] = [
					'my-iso-radon-service',
					'my-iso-cpd-service',
					'my-iso-bandit-service'
			];
	
			// Map each service to a Promise
			const servicePromises: Promise<{ name: string, score: number }>[] = services.map((serviceName: string) => {
					return new Promise<{ name: string, score: number }>((resolve, reject) => {
							const command = spawn('docker-compose', ['-f', path.join(__dirname, '..', 'docker-compose.yml'), 'logs', serviceName]);
	
							let stdout = '';
							let stderr = '';
	
							command.stdout.on('data', (data) => {
									stdout += data.toString();
							});
	
							command.stderr.on('data', (data) => {
									stderr += data.toString();
							});
	
							command.on('close', (code) => {
									if (code !== 0) {
											outputChannel.appendLine(`exec error: Command exited with code ${code}`);
											reject(new Error(`Command exited with code ${code}`));
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
											resolve({ name: serviceName, score: score });
									} else {
											reject(new Error(`Score for ${serviceName} is not a number: ${score}`));
									}
							});
					});
			});
	
			// Wait for all services to finish executing
			Promise.all(servicePromises).then((scores: { name: string, score: number }[]) => {
					let totalScore: number = 0;
					let grade: string;
					for (let score of scores) {
							if (score.name === 'my-iso-radon-service') {
									totalScore += weights.radon * score.score;
							} else if (score.name === 'my-iso-cpd-service') {
									totalScore += weights.cpd * score.score;
							} else if (score.name === 'my-iso-bandit-service') {
									totalScore += weights.bandit * score.score;
							}
					}
					if (totalScore >= 93) {
							grade = 'A';
					} else if (totalScore >= 90) {
							grade = 'A-';
					} else if (totalScore >= 87) {
							grade = 'B+';
					} else if (totalScore >= 83) {
							grade = 'B';
					} else if (totalScore >= 80) {
							grade = 'B-';
					} else if (totalScore >= 77) {
							grade = 'C+';
					} else if (totalScore >= 73) {
							grade = 'C';
					} else if (totalScore >= 70) {
							grade = 'C-';
					} else if (totalScore >= 67) {
							grade = 'D+';
					} else if (totalScore >= 63) {
							grade = 'D';
					} else if (totalScore >= 60) {
							grade = 'D-';
					} else {
							grade = 'F';
					}
					outputChannel.appendLine(`Sustainability score: ${totalScore}`);
					outputChannel.appendLine(`Sustainability grade: ${grade}`);
					vscode.window.showInformationMessage(`Sustainability Grade: ${grade}`);
			}).catch((err: Error) => {
					outputChannel.appendLine(`Error calculating aggregate score: ${err}`);
			});
	};
		
		export function deactivate() {}