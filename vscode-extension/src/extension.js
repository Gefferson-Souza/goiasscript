const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

function activate(context) {
    console.log('GoiásScript extension is now active!');

    // Registra comandos
    const commands = [
        vscode.commands.registerCommand('goiasscript.compile', compileGoiasScript),
        vscode.commands.registerCommand('goiasscript.run', runGoiasScript),
        vscode.commands.registerCommand('goiasscript.checkTypes', checkTypes),
        vscode.commands.registerCommand('goiasscript.newFile', createNewFile)
    ];

    context.subscriptions.push(...commands);

    // Auto-compile on save se habilitado
    const onSaveHandler = vscode.workspace.onDidSaveTextDocument((document) => {
        if (document.languageId === 'goiasscript') {
            const config = vscode.workspace.getConfiguration('goiasscript');
            if (config.get('autoCompileOnSave')) {
                compileGoiasScript();
            }
        }
    });

    context.subscriptions.push(onSaveHandler);

    // Provider de diagnósticos (warnings/errors)
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('goiasscript');
    context.subscriptions.push(diagnosticCollection);

    // Monitor de mudanças nos arquivos .gs
    const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.gs');
    fileWatcher.onDidChange((uri) => {
        const config = vscode.workspace.getConfiguration('goiasscript');
        if (config.get('enableTypeChecking')) {
            validateGoiasScript(uri, diagnosticCollection);
        }
    });
    
    context.subscriptions.push(fileWatcher);
}

async function compileGoiasScript() {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'goiasscript') {
        vscode.window.showErrorMessage('Abra um arquivo GoiásScript (.gs) para compilar');
        return;
    }

    const document = editor.document;
    const filePath = document.fileName;
    
    try {
        await document.save();
        
        const config = vscode.workspace.getConfiguration('goiasscript');
        const compilerPath = config.get('compilerPath') || 'goiasscript';
        
        vscode.window.showInformationMessage('Compilando GoiásScript...');
        
        exec(`${compilerPath} compile "${filePath}"`, (error, stdout, stderr) => {
            if (error) {
                vscode.window.showErrorMessage(`Erro na compilação: ${error.message}`);
                return;
            }
            
            if (stderr) {
                vscode.window.showWarningMessage(`Warnings: ${stderr}`);
            }
            
            vscode.window.showInformationMessage('✅ Compilação concluída com sucesso!');
            
            const config = vscode.workspace.getConfiguration('goiasscript');
            if (config.get('outputJavaScript')) {
                const jsPath = filePath.replace('.gs', '.js');
                vscode.workspace.openTextDocument(jsPath).then(doc => {
                    vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
                });
            }
        });
        
    } catch (error) {
        vscode.window.showErrorMessage(`Erro ao compilar: ${error.message}`);
    }
}

async function runGoiasScript() {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'goiasscript') {
        vscode.window.showErrorMessage('Abra um arquivo GoiásScript (.gs) para executar');
        return;
    }

    const document = editor.document;
    const filePath = document.fileName;
    
    try {
        await document.save();
        
        const config = vscode.workspace.getConfiguration('goiasscript');
        const compilerPath = config.get('compilerPath') || 'goiasscript';
        
        const terminal = vscode.window.createTerminal('GoiásScript');
        terminal.show();
        terminal.sendText(`${compilerPath} run "${filePath}"`);
        
    } catch (error) {
        vscode.window.showErrorMessage(`Erro ao executar: ${error.message}`);
    }
}

async function checkTypes() {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'goiasscript') {
        vscode.window.showErrorMessage('Abra um arquivo GoiásScript (.gs) para verificar tipos');
        return;
    }

    const document = editor.document;
    const filePath = document.fileName;
    
    try {
        const config = vscode.workspace.getConfiguration('goiasscript');
        const compilerPath = config.get('compilerPath') || 'goiasscript';
        
        vscode.window.showInformationMessage('Verificando tipos...');
        
        exec(`${compilerPath} check-types "${filePath}"`, (error, stdout, stderr) => {
            if (error) {
                vscode.window.showErrorMessage(`Erro na verificação: ${error.message}`);
                return;
            }
            
            if (stderr) {
                vscode.window.showWarningMessage(`Warnings de tipos: ${stderr}`);
            } else {
                vscode.window.showInformationMessage('✅ Tipos verificados - nenhum problema encontrado!');
            }
        });
        
    } catch (error) {
        vscode.window.showErrorMessage(`Erro ao verificar tipos: ${error.message}`);
    }
}

async function createNewFile() {
    const fileName = await vscode.window.showInputBox({
        prompt: 'Nome do arquivo GoiásScript',
        placeHolder: 'exemplo.gs',
        validateInput: (value) => {
            if (!value) return 'Nome do arquivo é obrigatório';
            if (!value.endsWith('.gs')) return 'Arquivo deve ter extensão .gs';
            return null;
        }
    });

    if (!fileName) return;

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('Abra uma pasta no workspace primeiro');
        return;
    }

    const filePath = path.join(workspaceFolders[0].uri.fsPath, fileName);
    
    const template = `// ${fileName}
// GoiásScript v2.0 - Linguagem de programação goiana

// Exemplo de uso
uai mensagem: texto é "Oi, sô!"
prosa(mensagem)

faz_trem saudar(nome: texto): texto {
    faz_favor "Oi " mais nome mais ", tudo beleza?"
}

uai resultado: texto é saudar("Fulano")
prosa(resultado)
`;

    try {
        fs.writeFileSync(filePath, template, 'utf8');
        const document = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(document);
        vscode.window.showInformationMessage(`Arquivo ${fileName} criado com sucesso!`);
    } catch (error) {
        vscode.window.showErrorMessage(`Erro ao criar arquivo: ${error.message}`);
    }
}

async function validateGoiasScript(uri, diagnosticCollection) {
    try {
        const document = await vscode.workspace.openTextDocument(uri);
        const text = document.getText();
        
        const diagnostics = [];
        
        // Verificações básicas de sintaxe GoiásScript
        const lines = text.split('\n');
        
        lines.forEach((line, index) => {
            // Verifica declarações de variáveis sem tipo
            const varMatch = line.match(/^\s*(uai|trem)\s+(\w+)\s+é\s+/);
            if (varMatch) {
                const hasType = line.includes(':');
                if (!hasType) {
                    const diagnostic = new vscode.Diagnostic(
                        new vscode.Range(index, 0, index, line.length),
                        'Considere adicionar tipo à variável para melhor legibilidade',
                        vscode.DiagnosticSeverity.Information
                    );
                    diagnostics.push(diagnostic);
                }
            }
            
            // Verifica uso de função sem declaração
            const funcCallMatch = line.match(/(\w+)\s*\(/);
            if (funcCallMatch) {
                const funcName = funcCallMatch[1];
                const builtins = ['prosa', 'setTimeout', 'fetch', 'console', 'Math'];
                if (!builtins.includes(funcName) && !text.includes(`faz_trem ${funcName}`)) {
                    const diagnostic = new vscode.Diagnostic(
                        new vscode.Range(index, funcCallMatch.index, index, funcCallMatch.index + funcName.length),
                        `Função '${funcName}' pode não estar definida`,
                        vscode.DiagnosticSeverity.Warning
                    );
                    diagnostics.push(diagnostic);
                }
            }
        });
        
        diagnosticCollection.set(uri, diagnostics);
        
    } catch (error) {
        console.error('Erro na validação:', error);
    }
}

function deactivate() {
    console.log('GoiásScript extension deactivated');
}

module.exports = {
    activate,
    deactivate
};