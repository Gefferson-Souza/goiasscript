#!/usr/bin/env node

// 🇧🇷 GoiásScript Language Server Protocol
// Inteligência goiana para editores de código

const {
  createConnection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  ProposedFeatures,
  InitializeParams,
  DidChangeConfigurationNotification,
  CompletionItem,
  CompletionItemKind,
  TextDocumentPositionParams,
  TextDocumentSyncKind,
  InitializeResult,
  MarkupKind
} = require('vscode-languageserver/node');

const { TextDocument } = require('vscode-languageserver-textdocument');

// Conexão com o cliente (VS Code)
const connection = createConnection(ProposedFeatures.all);

// Cache de documentos
const documents = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

// Inicialização do servidor
connection.onInitialize((params) => {
  const capabilities = params.capabilities;

  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );
  hasDiagnosticRelatedInformationCapability = !!(
    capabilities.textDocument &&
    capabilities.textDocument.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation
  );

  const result = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        resolveProvider: true,
        triggerCharacters: ['.', '@', 'é', ' ']
      },
      hoverProvider: true,
      definitionProvider: true,
      documentSymbolProvider: true,
      diagnosticProvider: {
        identifier: 'goiasscript',
        documentSelector: [{ language: 'goiasscript' }],
        interFileDependencies: false,
        workspaceDiagnostics: false
      }
    }
  };

  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true
      }
    };
  }

  connection.console.log('🇧🇷 GoiásScript Language Server inicializado!');
  return result;
});

connection.onInitialized(() => {
  if (hasConfigurationCapability) {
    connection.client.register(DidChangeConfigurationNotification.type, undefined);
  }
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders(() => {
      connection.console.log('Workspace folder change event received.');
    });
  }
});

// Configurações do servidor
const defaultSettings = {
  enableDiagnostics: true,
  enableAutoComplete: true,
  maxNumberOfProblems: 100,
  showWarnings: true,
  enableGoianoMethods: true
};

let globalSettings = defaultSettings;
const documentSettings = new Map();

connection.onDidChangeConfiguration(change => {
  if (hasConfigurationCapability) {
    documentSettings.clear();
  } else {
    globalSettings = (change.settings.goiasscript || defaultSettings);
  }
  documents.all().forEach(validateTextDocument);
});

function getDocumentSettings(resource) {
  if (!hasConfigurationCapability) {
    return Promise.resolve(globalSettings);
  }
  let result = documentSettings.get(resource);
  if (!result) {
    result = connection.workspace.getConfiguration({
      scopeUri: resource,
      section: 'goiasscript'
    });
    documentSettings.set(resource, result);
  }
  return result;
}

// Remover configurações quando documento é fechado
documents.onDidClose(e => {
  documentSettings.delete(e.document.uri);
});

// Validação quando documento muda
documents.onDidChangeContent(change => {
  validateTextDocument(change.document);
});

// 🇧🇷 Keywords e estruturas GoiásScript
const goiasKeywords = {
  // Variáveis
  'uai': { type: 'variable', description: 'Declara variável constante goiana', example: 'uai nome é "João"' },
  'trem': { type: 'variable', description: 'Declara variável mutável goiana', example: 'trem contador é 0' },

  // Controle de fluxo
  'se': { type: 'control', description: 'Estrutura condicional if', example: 'se (idade maior_que 18) { ... }' },
  'senao': { type: 'control', description: 'Estrutura else', example: 'se (...) { ... } senao { ... }' },
  'vai_indo': { type: 'control', description: 'Loop for', example: 'vai_indo (trem i é 0; i menor_que 10; i é i mais 1) { ... }' },
  'enquanto_tiver': { type: 'control', description: 'Loop while', example: 'enquanto_tiver (condicao) { ... }' },
  'para_com_isso': { type: 'control', description: 'Comando break', example: 'para_com_isso;' },
  'continua_aí': { type: 'control', description: 'Comando continue', example: 'continua_aí;' },

  // Funções
  'faz_trem': { type: 'function', description: 'Declara função goiana', example: 'faz_trem somar(a, b) { faz_favor a mais b; }' },
  'faz_favor': { type: 'function', description: 'Comando return', example: 'faz_favor resultado;' },
  'vai_na_frente': { type: 'function', description: 'Função assíncrona', example: 'vai_na_frente faz_trem buscarDados() { ... }' },
  'espera_um_cadim': { type: 'function', description: 'Comando await', example: 'uai dados é espera_um_cadim buscarAPI();' },

  // Objetos e classes
  'arruma_trem': { type: 'class', description: 'Declara classe goiana', example: 'arruma_trem Pessoa { ... }' },
  'inherda_de': { type: 'class', description: 'Herança de classe', example: 'arruma_trem Funcionario inherda_de Pessoa { ... }' },
  'aprepara_trem': { type: 'class', description: 'Construtor da classe', example: 'aprepara_trem(nome) { ocê.nome = nome; }' },
  'ocê': { type: 'class', description: 'Referência this da classe', example: 'ocê.propriedade = valor;' },

  // Erro e debug
  'tenta_aí': { type: 'error', description: 'Bloco try', example: 'tenta_aí { ... } se_der_ruim (erro) { ... }' },
  'se_der_ruim': { type: 'error', description: 'Bloco catch', example: 'se_der_ruim (erro) { prosa(erro); }' },
  'por_fim': { type: 'error', description: 'Bloco finally', example: 'por_fim { limpar(); }' },
  'vixe': { type: 'error', description: 'Comando throw', example: 'vixe faz_um Error("Deu ruim!");' },

  // Módulos
  'pega': { type: 'module', description: 'Importar módulo', example: 'pega fs de "fs";' },
  'troca_ideia': { type: 'module', description: 'Exportar', example: 'troca_ideia { funcao1, funcao2 };' },
  'troca_ideia_principal': { type: 'module', description: 'Export default', example: 'troca_ideia_principal MinhaClasse;' },

  // Framework decorators
  '@Componente': { type: 'decorator', description: 'Decorator de componente web', example: '@Componente({ seletor: "meu-comp" })' },
  '@Controlador': { type: 'decorator', description: 'Decorator de controlador REST', example: '@Controlador("api/users")' },
  '@Injectable': { type: 'decorator', description: 'Decorator de serviço injetável', example: '@Injectable()' },
  '@Pegar': { type: 'decorator', description: 'Decorator de rota GET', example: '@Pegar("/users")' },
  '@Postar': { type: 'decorator', description: 'Decorator de rota POST', example: '@Postar("/users")' },
  '@Corpo': { type: 'decorator', description: 'Decorator de body parameter', example: '@Corpo() dados: coisa' },
  '@Query': { type: 'decorator', description: 'Decorator de query parameter', example: '@Query("id") id: texto' },

  // Utilitários
  'prosa': { type: 'utility', description: 'Console.log goiano', example: 'prosa("Olá mundo!");' },
  'reclama': { type: 'utility', description: 'Console.error goiano', example: 'reclama("Erro aqui!");' },
  'faz_um': { type: 'utility', description: 'Operador new', example: 'uai data é faz_um Date();' },
  'depois_de': { type: 'utility', description: 'setTimeout goiano', example: 'depois_de(() => prosa("Oi"), 1000);' }
};

// Métodos goianos nativos
const goianoMethods = {
  // String methods
  'gritando': { type: 'string', description: 'Converte para maiúscula', example: 'texto.gritando()' },
  'cochichando': { type: 'string', description: 'Converte para minúscula', example: 'texto.cochichando()' },
  'tem_no_meio': { type: 'string', description: 'Verifica se contém substring', example: 'texto.tem_no_meio("casa")' },
  'trocar': { type: 'string', description: 'Substitui texto', example: 'texto.trocar("old", "new")' },
  'dividir': { type: 'string', description: 'Divide string em array', example: 'texto.dividir(",")' },

  // Array methods
  'bota_no_final': { type: 'array', description: 'Adiciona item no final do array', example: 'lista.bota_no_final(item)' },
  'arranca_o_rabo': { type: 'array', description: 'Remove último item do array', example: 'lista.arranca_o_rabo()' },
  'mapear': { type: 'array', description: 'Mapeia array', example: 'lista.mapear(item => item * 2)' },
  'filtrar': { type: 'array', description: 'Filtra array', example: 'lista.filtrar(item => item > 10)' },
  'fatiar': { type: 'array', description: 'Fatia array', example: 'lista.fatiar(0, 3)' },
  'tamanho': { type: 'array', description: 'Retorna tamanho do array', example: 'lista.tamanho()' },
  'empurrar': { type: 'array', description: 'Adiciona item no array', example: 'lista.empurrar(item)' },

  // Outras
  'contem': { type: 'general', description: 'Verifica se contém', example: 'item.contem(valor)' },
  'pra_minusculo': { type: 'general', description: 'Converte para minúscula', example: 'texto.pra_minusculo()' },
  'pra_maiusculo': { type: 'general', description: 'Converte para maiúscula', example: 'texto.pra_maiusculo()' }
};

// Validação de documentos
async function validateTextDocument(textDocument) {
  const settings = await getDocumentSettings(textDocument.uri);
  const text = textDocument.getText();
  const diagnostics = [];

  if (!settings.enableDiagnostics) {
    return;
  }

  const lines = text.split(/\r?\n/g);

  lines.forEach((line, lineIndex) => {
    // Verificar sintaxe básica
    checkGoiasScriptSyntax(line, lineIndex, diagnostics);

    // Verificar métodos não goianos
    if (settings.enableGoianoMethods) {
      checkNonGoianoMethods(line, lineIndex, diagnostics);
    }

    // Verificar estruturas incorretas
    checkIncorrectStructures(line, lineIndex, diagnostics);
  });

  // Limitar número de problemas
  const limitedDiagnostics = diagnostics.slice(0, settings.maxNumberOfProblems);

  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics: limitedDiagnostics });
}

function checkGoiasScriptSyntax(line, lineIndex, diagnostics) {
  // Verificar uso de = ao invés de é
  const equalPattern = /\b(uai|trem)\s+\w+\s*=/;
  if (equalPattern.test(line) && !line.includes('é')) {
    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: {
        start: { line: lineIndex, character: line.indexOf('=') },
        end: { line: lineIndex, character: line.indexOf('=') + 1 }
      },
      message: 'Ô sô! Use "é" no lugar de "=" pra declarar variável goiana',
      source: 'goiasscript'
    });
  }

  // Verificar console.log ao invés de prosa
  if (line.includes('console.log')) {
    const index = line.indexOf('console.log');
    diagnostics.push({
      severity: DiagnosticSeverity.Warning,
      range: {
        start: { line: lineIndex, character: index },
        end: { line: lineIndex, character: index + 11 }
      },
      message: 'Ô sô! Use "prosa()" que é mais goiano que console.log()',
      source: 'goiasscript'
    });
  }
}

function checkNonGoianoMethods(line, lineIndex, diagnostics) {
  // Métodos JavaScript que deveriam ser goianos
  const nonGoianoMethods = {
    'toUpperCase': 'gritando',
    'toLowerCase': 'cochichando',
    'includes': 'tem_no_meio',
    'push': 'bota_no_final',
    'pop': 'arranca_o_rabo',
    'length': 'tamanho()',
    'slice': 'fatiar',
    'map': 'mapear',
    'filter': 'filtrar'
  };

  Object.entries(nonGoianoMethods).forEach(([jsMethod, goianoMethod]) => {
    if (line.includes(`.${jsMethod}(`)) {
      const index = line.indexOf(`.${jsMethod}(`);
      diagnostics.push({
        severity: DiagnosticSeverity.Information,
        range: {
          start: { line: lineIndex, character: index + 1 },
          end: { line: lineIndex, character: index + 1 + jsMethod.length }
        },
        message: `Dica goiana: Use ".${goianoMethod}()" no lugar de ".${jsMethod}()"`,
        source: 'goiasscript'
      });
    }
  });
}

function checkIncorrectStructures(line, lineIndex, diagnostics) {
  // Verificar if ao invés de se
  if (line.trim().startsWith('if (')) {
    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: {
        start: { line: lineIndex, character: line.indexOf('if') },
        end: { line: lineIndex, character: line.indexOf('if') + 2 }
      },
      message: 'Ô rapaz! Use "se" no lugar de "if" que é mais goiano',
      source: 'goiasscript'
    });
  }

  // Verificar function ao invés de faz_trem
  if (line.includes('function ') && !line.includes('//')) {
    const index = line.indexOf('function');
    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: {
        start: { line: lineIndex, character: index },
        end: { line: lineIndex, character: index + 8 }
      },
      message: 'Eita sô! Use "faz_trem" no lugar de "function" que fica mais goiano',
      source: 'goiasscript'
    });
  }
}

// Autocompletar
connection.onCompletion((textDocumentPosition) => {
  const document = documents.get(textDocumentPosition.textDocument.uri);
  if (!document) {
    return [];
  }

  const text = document.getText();
  const position = textDocumentPosition.position;
  const line = text.split(/\r?\n/g)[position.line];
  const beforeCursor = line.substring(0, position.character);

  const completionItems = [];

  // Autocompletar decorators do framework
  if (beforeCursor.trim().startsWith('@')) {
    const decorators = ['@Componente', '@Controlador', '@Injectable', '@Pegar', '@Postar', '@Corpo', '@Query'];
    decorators.forEach((decorator, index) => {
      const info = goiasKeywords[decorator];
      completionItems.push({
        label: decorator,
        kind: CompletionItemKind.Function,
        detail: info.description,
        documentation: info.example,
        insertText: decorator === '@Componente' ? '@Componente({\n  seletor: "${1:nome}",\n  template: `\n    ${2:conteudo}\n  `\n})' : decorator,
        sortText: `0${index}` // Prioridade alta
      });
    });
  }

  // Autocompletar métodos goianos após ponto
  if (beforeCursor.endsWith('.')) {
    Object.entries(goianoMethods).forEach(([method, info]) => {
      completionItems.push({
        label: method,
        kind: CompletionItemKind.Method,
        detail: info.description,
        documentation: info.example,
        insertText: method + (method.includes('()') ? '' : '()'),
        sortText: `1${method}` // Prioridade média
      });
    });
  }

  // Autocompletar keywords gerais
  Object.entries(goiasKeywords).forEach(([keyword, info]) => {
    if (!keyword.startsWith('@')) {
      completionItems.push({
        label: keyword,
        kind: info.type === 'function' ? CompletionItemKind.Function :
              info.type === 'control' ? CompletionItemKind.Keyword :
              info.type === 'class' ? CompletionItemKind.Class :
              CompletionItemKind.Variable,
        detail: info.description,
        documentation: info.example,
        sortText: `2${keyword}` // Prioridade baixa
      });
    }
  });

  return completionItems;
});

// Resolver itens de completion
connection.onCompletionResolve((item) => {
  return item;
});

// Hover (informações ao passar mouse)
connection.onHover((params) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return null;
  }

  const position = params.position;
  const text = document.getText();
  const line = text.split(/\r?\n/g)[position.line];
  const word = getWordAtPosition(line, position.character);

  // Procurar palavra nas keywords
  const keywordInfo = goiasKeywords[word];
  if (keywordInfo) {
    return {
      contents: {
        kind: MarkupKind.Markdown,
        value: `**${word}** _(${keywordInfo.type})_\n\n${keywordInfo.description}\n\n\`\`\`goiasscript\n${keywordInfo.example}\n\`\`\``
      }
    };
  }

  // Procurar palavra nos métodos
  const methodInfo = goianoMethods[word];
  if (methodInfo) {
    return {
      contents: {
        kind: MarkupKind.Markdown,
        value: `**.${word}()** _(método ${methodInfo.type})_\n\n${methodInfo.description}\n\n\`\`\`goiasscript\n${methodInfo.example}\n\`\`\``
      }
    };
  }

  return null;
});

function getWordAtPosition(line, character) {
  const before = line.substring(0, character);
  const after = line.substring(character);

  const wordBefore = before.match(/[a-zA-Z_@][a-zA-Z0-9_]*$/);
  const wordAfter = after.match(/^[a-zA-Z0-9_]*/);

  return (wordBefore ? wordBefore[0] : '') + (wordAfter ? wordAfter[0] : '');
}

// Conectar documentos
documents.listen(connection);

// Iniciar servidor
connection.listen();

connection.console.log('🇧🇷 GoiásScript Language Server Protocol rodando!');