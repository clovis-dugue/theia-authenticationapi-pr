// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { TasAuthenticationProvider } from './authenticationProvider';

const tasAuthenticationProvider = new TasAuthenticationProvider();

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "theia-authenticationapi-pr" is now active!');

	// Declare disposable variable
	let disposable: vscode.Disposable;

	/**
	 * Current session ID, "" if logged out
	 */
	let tasAuthenticationSessionId = "";
	/**
	 * Get current status of the session for the local ID
	 * @returns Current session, undefined if logged out
	 */
	async function tasAuthenticationSession(): Promise<vscode.AuthenticationSession | undefined> {
		let session: vscode.AuthenticationSession;
		if (tasAuthenticationSessionId === "") {
			session = (await tasAuthenticationProvider.getSessions())[0];
			if (session === undefined) {
				return undefined;
			}
			tasAuthenticationSessionId = session.id;
		}
		else {
			session = (await tasAuthenticationProvider.getSessions()).filter((session) => { return session.id === tasAuthenticationSessionId; })[0];
		}
		return session;
	}

	// START USER ACCESSIBLE COMMANDS

	// Login with VS Code Auth API
	disposable = vscode.commands.registerCommand("tas.login", async () => {
		try {
			// Store ID of the extension's session
			tasAuthenticationSessionId = (await tasAuthenticationProvider.createSession([])).id;
		} catch (e) {
			console.error(e);
			vscode.window.showErrorMessage(`${JSON.stringify(e)}`);
		}
	}
	);
	context.subscriptions.push(disposable);

	// Log out of VS Code Auth API
	disposable = vscode.commands.registerCommand("tas.logout", async () => {
		try {
			if (tasAuthenticationSessionId !== "") {
				await tasAuthenticationProvider.removeSession(tasAuthenticationSessionId);
				tasAuthenticationSessionId = "";
			} else {
				console.error(`Not logged in; can't log out`);
				vscode.window.showErrorMessage(`Not logged in; can't log out`);
			}
		} catch (e) {
			console.error(e);
			vscode.window.showErrorMessage(`${JSON.stringify(e)}`);
		}
	}
	);
	context.subscriptions.push(disposable);

	// END USER ACCESSIBLE COMMANDS

	// START INTERNAL EXTENSION COMMANDS

	// Log in if logged out, logout if logged in
	disposable = vscode.commands.registerCommand('tas.login-or-logout', async () => {
		if (await tasAuthenticationSession() === undefined) {
			vscode.commands.executeCommand('tas.login');
		} else {
			vscode.commands.executeCommand('tas.logout');
		}
	});
	context.subscriptions.push(disposable);

	// END INTERNAL EXTENSION COMMANDS

	disposable = vscode.authentication.registerAuthenticationProvider(
		"TAS",
		"tas",
		tasAuthenticationProvider
	);
	context.subscriptions.push(disposable);

	// START STATUS BAR MANAGEMENT

	// Contribution
	const statusBarItem = vscode.window.createStatusBarItem(
		vscode.StatusBarAlignment.Right,
		0
	);
	statusBarItem.command = "tas.login-or-logout";
	context.subscriptions.push(statusBarItem);

	// Update method
	async function updateStatusBarItem(): Promise<void> {
		// When logged out from the Accounts icon (bottom-left), the session ID may still be defined against a non-existent session.
		// This is why we re-resolve the session from the stored ID (and update it if it's wrong)
		if (await tasAuthenticationSession() === undefined) {
			tasAuthenticationSessionId = "";
			statusBarItem.text = `$(circle-large-outline) TAS: Log in`;
			statusBarItem.show();
		} else {
			tasAuthenticationProvider.getSessions().then((sessions) => {
				statusBarItem.text = `$(circle-large-filled) TAS: ${sessions.filter((session) => { return session.id === tasAuthenticationSessionId; })[0].account.label}`;
				statusBarItem.show();
			});
		}
	}

	// Event listeners
	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(updateStatusBarItem)
	);
	context.subscriptions.push(
		vscode.window.onDidChangeTextEditorSelection(updateStatusBarItem)
	);
	context.subscriptions.push(
		tasAuthenticationProvider.onDidChangeSessions(updateStatusBarItem)
	);

	// Pre-population
	updateStatusBarItem();
	(async () => {
		if (tasAuthenticationSession === undefined) {
			vscode.commands.executeCommand('tas.login');
		}
	})();

	// END STATUS BAR MANAGEMENT
}

// this method is called when your extension is deactivated
export function deactivate() { }
