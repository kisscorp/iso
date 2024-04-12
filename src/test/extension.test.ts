import * as vscode from 'vscode';
import * as assert from 'assert';
import * as sinon from 'sinon';
import { runDockerComposeTask } from '../extension';

// Create a sandbox to restore all stubs after each test
const sandbox = sinon.createSandbox();

suite('Extension Test Suite', () => {
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