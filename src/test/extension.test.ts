import * as vscode from 'vscode';
import * as assert from 'assert';
import * as sinon from 'sinon';
import * as dockerUtils from '../docker-utils';
import { runDockerComposeTask, activate } from '../extension';

// Create a sandbox to restore all stubs after each test
const sandbox = sinon.createSandbox();

suite('runDockerComposeTask', () => {
    let executeTaskStub: sinon.SinonStub;
    let showInformationMessageStub: sinon.SinonStub;
    let workspaceFoldersStub: sinon.SinonStub;

    setup(() => {
        workspaceFoldersStub = sandbox.stub(vscode.workspace, 'workspaceFolders').value([{
            uri: {
                fsPath: '/mock/path'
            }
        } as any]);

        executeTaskStub = sandbox.stub(vscode.tasks, 'executeTask').resolves(undefined);
        showInformationMessageStub = sandbox.stub(vscode.window, 'showInformationMessage').resolves(undefined);
    });

    // Restore the stubs after each test
    teardown(() => {
        sandbox.restore();
    });

    test('should set WORKSPACE_PATH', () => {
        runDockerComposeTask();
        assert.strictEqual(process.env['WORKSPACE_PATH'], '/mock/path');
    });

    test('should execute docker task', () => {
        runDockerComposeTask();
        assert.ok(executeTaskStub.calledOnce);
    });

    test('should show information message after task execution', async () => {
			await runDockerComposeTask();
			assert.ok(showInformationMessageStub.calledOnce);
	});

	test('should not set WORKSPACE_PATH when no workspace is open', () => {
		delete process.env['WORKSPACE_PATH'];
		workspaceFoldersStub.value(undefined);
		runDockerComposeTask();
		assert.strictEqual(process.env['WORKSPACE_PATH'], undefined);
	});

    test('should handle task execution failure', () => {
        executeTaskStub.rejects(new Error('Task failed'));
        runDockerComposeTask();
        // Check your error handling here
    });

    test('should use the first workspace folder if multiple are open', () => {
        workspaceFoldersStub.value([
            { uri: { fsPath: '/mock/path/1' } } as any,
            { uri: { fsPath: '/mock/path/2' } } as any
        ]);
        runDockerComposeTask();
        assert.strictEqual(process.env['WORKSPACE_PATH'], '/mock/path/1');
    });
});

suite('activate', () => {
	let createFileSystemWatcherStub: sinon.SinonStub;
	let registerCommandStub: sinon.SinonStub;
	let showInformationMessageStub: sinon.SinonStub;
	let onDidChangeStub: sinon.SinonStub;

	setup(() => {
			// Stub the vscode API
			createFileSystemWatcherStub = sandbox.stub(vscode.workspace, 'createFileSystemWatcher');
			registerCommandStub = sandbox.stub(vscode.commands, 'registerCommand');
			showInformationMessageStub = sandbox.stub(vscode.window, 'showInformationMessage');

			// Stub the onDidChange method of the FileSystemWatcher return object
			onDidChangeStub = sandbox.stub();
			createFileSystemWatcherStub.returns({ onDidChange: onDidChangeStub });
	});

	teardown(() => {
			sandbox.restore();
	});

	test('should activate extension', () => {
			const mockContext = { subscriptions: [] };

			// Call the function with a mock context
			activate(mockContext as any);

			// Check that createFileSystemWatcher and registerCommand were called
			assert.ok(createFileSystemWatcherStub.calledOnce);
			assert.ok(registerCommandStub.calledOnce);

			// Check that onDidChange was set up
			assert.ok(onDidChangeStub.calledOnce);

			// Check that the watcher and command were added to context.subscriptions
			assert.strictEqual(mockContext.subscriptions.length, 2);
	});

});