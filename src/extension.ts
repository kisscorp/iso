import * as vscode from 'vscode';
import * as path from 'path';
import { spawn } from './docker-utils';

const outputChannel = vscode.window.createOutputChannel('Docker Logs');

export const runDockerComposeTask = () => {
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
        /*printDockerLogs('my-python-service');
        printDockerLogs('my-python-service2');
        printDockerLogs('my-iso-radon-service');
        printDockerLogs('my-iso-cpd-service');
        printDockerLogs('my-iso-bandit-service');
        printContainerStatus('my-python-service');
        printContainerStatus('my-python-service2');
        printContainerStatus('my-iso-radon-service');
        printContainerStatus('my-iso-cpd-service');
        printContainerStatus('my-iso-bandit-service');*/

				// New code: calculate and print the aggregated score
        calculateAndPrintAggregateScore();/*.then(() => {
            const downCommand: string = 'docker-compose down';
            const downTask: vscode.Task = new vscode.Task({ type: type }, vscode.TaskScope.Workspace, 'docker-down', 'extension-source', new vscode.ShellExecution(downCommand, executionOptions), problemMatcher);
            vscode.tasks.executeTask(downTask);
        });*/
    });
};

/*export const printDockerLogs = (serviceName: string) => {
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
		};*/
		
		/*export const printContainerStatus = (containerName: string) => {
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
		};*/
		
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

		export const calculateAndPrintAggregateScore = (weights = { radon: 0.3, cpd: 0.3, bandit: 0.4 }) => {
			const services: string[] = [
					'my-iso-radon-service',
					'my-iso-cpd-service',
					'my-iso-bandit-service'
			];
	
			// Map each service to a Promise
			const servicePromises: Promise<{ name: string, score: number }>[] = services.map((serviceName: string) => {
					return new Promise<{ name: string, score: number, duplicateCount?: number, lines?: number }>((resolve, reject) => {
							const command = spawn('docker-compose', ['-f', path.join(__dirname, '..', 'docker-compose.yml'), 'logs', serviceName]);
	
							let stdout = '';
							let stderr = '';
							let duplicateCount = 0;
							let lines = 0;
	
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
											[ score, duplicateCount ] = calculateCpdScore(stdout);
									} else if (serviceName === 'my-iso-bandit-service') {
											score = calculateBanditScore(stdout);
									}
	
									// Check if score is a number before resolving
									if (typeof score === "number") {
											resolve({ name: serviceName, score: score, duplicateCount, lines });
									} else {
											reject(new Error(`Score for ${serviceName} is not a number: ${score}`));
									}
							});
					});
			});
	
			// Wait for all services to finish executing
			/*return */Promise.all(servicePromises).then((scores: { name: string, score: number,  duplicateCount?: number, lines?: number }[]) => {
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
							if (score.duplicateCount) {
								outputChannel.appendLine(`${score.name} duplicates: ${score.duplicateCount}`);
								outputChannel.appendLine(`${score.name} lines: ${score.lines}`);
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

	export function calculateBanditScore(output: string): number {
		// Initialize scores for different severity levels
		const severityScores: {[key: string]: number} = {
			Undefined: 1,
			Low: 2,
			Medium: 3,
			High: 5,
		};
		let sustainabilityScore = 100;
	
		// Split output into lines
		const lines = output.split('\n');
	
		for (const line of lines) {
			// Check if line contains issue info
			const match = line.match(/(Undefined|Low|Medium|High): (\d+)/);
	
			if (match) {
				// Get issue severity and count
				const severity = match[1];
				const count = parseInt(match[2]);
	
				// Subtract from sustainability score based on severity
				sustainabilityScore -= severityScores[severity] * count;
			}
		}
	
		// Ensure score is not less than 0
		if (sustainabilityScore < 0) {
			sustainabilityScore = 0;
		}
	
		return sustainabilityScore;
	}

	export function calculateCpdScore(output: string): [number, number, number] {
		let duplicationCount = 0;
	
		// Split output into lines
		const lines = output.split('\n');
	
		for (const line of lines) {
			// Check if line contains duplication info
			const match = line.match(/Found a (\d+) line/);
	
			if (match) {
				// Increase duplication count
				duplicationCount += parseInt(match[1]);
			}
		}
	
		// Calculate score using logarithmic scale
		const sustainabilityScore = 100 - Math.log(duplicationCount + 1) * 10;
	
		// Ensure score is not less than 0
		return [Math.max(sustainabilityScore, 0), duplicationCount, lines.length];
	}

	export function calculateRadonScore(output: string): number {
		const complexityScores: {[key: string]: number} = {
			A: 100,
			B: 80,
			C: 60,
			D: 40,
			E: 20,
			F: 0,
		};
		let totalScore = 0;
		let fileCount = 0;
	
		// Split output into lines
		const lines = output.split('\n');
	
		for (const line of lines) {
			// Check if line contains complexity score
			const matchComplexity = line.match(/ - ([A-F])$/);
			const matchMi = line.match(/MI: ([\d.]+)/);
			const matchHal =
				line.match(/h1: (\d+)/) ||
				line.match(/vocabulary: (\d+)/) ||
				line.match(/length: (\d+)/);
			const matchRaw =
				line.match(/LOC: (\d+)/) ||
				line.match(/LLOC: (\d+)/) ||
				line.match(/SLOC: (\d+)/) ||
				line.match(/Comments: (\d+)/);
	
			if (matchComplexity || matchMi || matchHal || matchRaw) {
				// Increase file count
				fileCount++;
	
				// Get scores
				const complexityScore = matchComplexity
					? complexityScores[matchComplexity[1]]
					: 0;
				const miScore = matchMi ? parseFloat(matchMi[1]) : 0;
				const halScore = matchHal ? -parseInt(matchHal[1]) : 0;
				const rawScore = matchRaw
					? matchRaw[0].startsWith('Comments')
						? parseInt(matchRaw[1])
						: -parseInt(matchRaw[1])
					: 0;
	
				// Add to total score
				totalScore += complexityScore + miScore + halScore + rawScore;
			}
		}
	
		// Calculate average score
		const score = totalScore / fileCount;
	
		return score;
	}
		
		export function deactivate() {}