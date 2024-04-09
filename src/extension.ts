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

		if (serviceName === 'my-iso-radon-service') {
			const score = calculateRadonScore(stdout);
			outputChannel.appendLine(`Simplicity score: ${score}`);
			vscode.window.showInformationMessage(`Simplicity score: ${score}`);
		} else if (serviceName === 'my-iso-cpd-service') {
			const score = calculateCpdScore(stdout);
			outputChannel.appendLine(`Duplication score: ${score}`);
			vscode.window.showInformationMessage(`Duplication score: ${score}`);
		} else if (serviceName === 'my-iso-bandit-service') {
			const score = calculateBanditScore(stdout);
			outputChannel.appendLine(`Security score: ${score}`);
			vscode.window.showInformationMessage(`Security score: ${score}`);
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

const calculateRadonScore = (output: string): number => {
  const complexityScores: {[key: string]: number} = {'A': 100, 'B': 80, 'C': 60, 'D': 40, 'E': 20, 'F': 0};
  let totalScore = 0;
  let fileCount = 0;

  // Split output into lines
  const lines = output.split('\n');

  for (const line of lines) {
      // Check if line contains complexity score
      const matchComplexity = line.match(/ - ([A-F])$/);
      const matchMi = line.match(/MI: ([\d.]+)/);
      const matchHal = line.match(/h1: (\d+)/) || line.match(/vocabulary: (\d+)/) || line.match(/length: (\d+)/);
      const matchRaw = line.match(/LOC: (\d+)/) || line.match(/LLOC: (\d+)/) || line.match(/SLOC: (\d+)/) || line.match(/Comments: (\d+)/);

      if (matchComplexity || matchMi || matchHal || matchRaw) {
          // Increase file count
          fileCount++;

          // Get scores
          const complexityScore = matchComplexity ? complexityScores[matchComplexity[1]] : 0;
          const miScore = matchMi ? parseFloat(matchMi[1]) : 0;
          const halScore = matchHal ? -parseInt(matchHal[1]) : 0;
          const rawScore = matchRaw ? (matchRaw[0].startsWith("Comments") ? parseInt(matchRaw[1]) : -parseInt(matchRaw[1])) : 0;

          // Add to total score
          totalScore += complexityScore + miScore + halScore + rawScore;
      }
  }

  // Calculate average score
  const score = totalScore / fileCount;

  return score;
}

const calculateCpdScore = (output: string): number => {
	let sustainabilityScore = 100;
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

	// Deduct duplication count from sustainability score
	sustainabilityScore -= duplicationCount;

	// Ensure score is not less than 0
	if (sustainabilityScore < 0) {
			sustainabilityScore = 0;
	}

	return sustainabilityScore;
}

const calculateBanditScore = (output: string): number => {
	// Initialize scores for different severity levels
	const severityScores: {[key: string]: number} = {'Undefined': 1, 'Low': 2, 'Medium': 3, 'High': 5};
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

export function deactivate() {}