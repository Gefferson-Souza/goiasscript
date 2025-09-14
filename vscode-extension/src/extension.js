const vscode = require('vscode');
const { LanguageClient, TransportKind } = require('vscode-languageclient/node');
const path = require('path');

let client;

function activate(context) {
    console.log('🇧🇷 GoiásScript Extension está ativa!');

    // Configurar Language Server
    const serverModule = context.asAbsolutePath(
        path.join('..', 'lsp-server', 'server.js')
    );

    const serverOptions = {
        run: {
            module: serverModule,
            transport: TransportKind.ipc
        },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
            options: { execArgv: ['--nolazy', '--inspect=6009'] }
        }
    };

    const clientOptions = {
        documentSelector: [
            { scheme: 'file', language: 'goiasscript' }
        ],
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher('**/.gs')
        },
        outputChannelName: 'GoiásScript Language Server'
    };

    // Criar e iniciar cliente
    client = new LanguageClient(
        'goiasscript-lsp',
        '🇧🇷 GoiásScript Language Server',
        serverOptions,
        clientOptions
    );

    // Iniciar cliente
    client.start();

    // Registrar comandos
    registerCommands(context);

    // Status bar
    createStatusBar(context);

    console.log('🚀 GoiásScript LSP Client iniciado!');
}

function registerCommands(context) {
    // Comando para traduzir GoiásScript
    const traduzCommand = vscode.commands.registerCommand('goiasscript.traduz', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('Abra um arquivo .gs primeiro, uai!');
            return;
        }

        const document = editor.document;
        if (document.languageId !== 'goiasscript') {
            vscode.window.showWarningMessage('Este não é um arquivo GoiásScript, sô!');
            return;
        }

        const terminal = vscode.window.createTerminal('GoiásScript');
        terminal.show();
        terminal.sendText(`goiasscript traduz "${document.fileName}"`);
    });

    // Comando para executar GoiásScript
    const botaPraMoerCommand = vscode.commands.registerCommand('goiasscript.bota_pra_moer', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('Abra um arquivo .gs primeiro!');
            return;
        }

        const document = editor.document;
        if (document.languageId !== 'goiasscript') {
            vscode.window.showWarningMessage('Este não é um arquivo GoiásScript!');
            return;
        }

        const terminal = vscode.window.createTerminal('GoiásScript');
        terminal.show();
        terminal.sendText(`goiasscript bota_pra_moer "${document.fileName}"`);
    });

    context.subscriptions.push(
        traduzCommand,
        botaPraMoerCommand
    );
}

function createStatusBar(context) {
    const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );

    statusBarItem.text = '🇧🇷 GoiásScript';
    statusBarItem.tooltip = 'GoiásScript Extension Ativa';
    statusBarItem.show();

    context.subscriptions.push(statusBarItem);

    // Atualizar status baseado no arquivo ativo
    vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor && editor.document.languageId === 'goiasscript') {
            statusBarItem.text = '🇧🇷 GoiásScript Ativo';
        } else {
            statusBarItem.text = '🇧🇷 GoiásScript';
        }
    });
}

function deactivate() {
    if (client) {
        return client.stop();
    }
}

module.exports = {
    activate,
    deactivate
};
