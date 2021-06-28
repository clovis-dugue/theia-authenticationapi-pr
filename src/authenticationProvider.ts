import * as vscode from 'vscode';
import * as uuid from 'uuid';

export class TasAuthenticationProvider implements vscode.AuthenticationProvider {
    /**
     * Internal session store
     */
    private _sessions: vscode.AuthenticationSession[] = [];

    private _onDidChangeSessions: vscode.EventEmitter<vscode.AuthenticationProviderAuthenticationSessionsChangeEvent> = new vscode.EventEmitter<vscode.AuthenticationProviderAuthenticationSessionsChangeEvent>();
    onDidChangeSessions: vscode.Event<vscode.AuthenticationProviderAuthenticationSessionsChangeEvent> = this._onDidChangeSessions.event;

    async getSessions(scopes?: readonly string[]): Promise<readonly vscode.AuthenticationSession[]> {
        // Return every session on empty parameter
        if (scopes === [] || scopes === undefined) {
            return this._sessions;
        }
        // Return sessions with at least those scopes otherwise
        else {
            // Get sessions...
            return this._sessions.filter((session) => {
                // Where every scope in the parameter...
                return scopes.every((scope) => {
                    // Is included in the session scope
                    session.scopes.includes(scope);
                });
            });
        }
    }

    async createSession(scopes: readonly string[]): Promise<vscode.AuthenticationSession> {
        // Create session from token
        const session: vscode.AuthenticationSession = {
            id: uuid.v4(),
            accessToken: "hello theia team :)",
            account: {
                id: "auth-api-sample",
                label: "Auth API Sample",
            },
            scopes: ["scope"]
        };
        // Store session locally
        const sessionIndex = this._sessions.findIndex(s => s.id === session.id);
        if (sessionIndex > -1) {
            this._sessions.splice(sessionIndex, 1, session);
        } else {
            this._sessions.push(session);
        }
        // Fire the event
        this._onDidChangeSessions.fire({
            added: [session],
            changed: [],
            removed: [],
        });

        return session;
    }

    removeSession(sessionId: string): Thenable<void> {
        return new Promise((resolve, reject) => {
            // Find index
            const sessionIndex = this._sessions.findIndex(s => s.id === sessionId);
            // Find session
            const session = this._sessions.filter(s => s.id === sessionId)[0];

            if (sessionIndex > -1) {
                // Remove session
                this._sessions.splice(sessionIndex, 1);
            } else {
                // Session did not exist in the first place
                const e = `Could not remove session with ID ${sessionId}`;
                vscode.window.showErrorMessage(e);
                reject(e);
            }
            // Fire the event
            this._onDidChangeSessions.fire({
                added: [],
                changed: [],
                removed: [session],
            });
            resolve();
        });
    }
}