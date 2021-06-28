# theia-authenticationapi-pr README

This repository contains a Visual Studio Code extension that creates a basic Authentication Provider as per vscode's API, in order to test the API implementations.  

It has been tested with VSCode.

## HOWTO install

Package using `vsce package` (install it using `npm install -g vsce` if it's not already available), and install the output VSIX.

A VSIX will be commited to this repository as well.

## HOWTO use

Bring up the command list, and use the commands `TAS: Login` and `TAS: Logout` for your testing.  
On the bottom right of the screen, there is a visual indicator of the current session status.  
VSCode will only show our provider in the "Accounts" menu (bottom left) if we are currently logged in, so make sure to use the Login command (or click the status bar indicator) at least once in order for our provider to appear
