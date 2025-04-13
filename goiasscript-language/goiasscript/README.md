# GoiásScript - Extensão para VS Code

![GoiásScript Logo](images/goiasscript-logo.png)

## Visão Geral

Uma extensão para Visual Studio Code que fornece suporte de linguagem para GoiásScript, uma linguagem de programação baseada no dialeto goiano do interior que compila para JavaScript.

## Características

- Syntax highlighting para arquivos `.gs`
- Reconhecimento de todas as palavras-chave da linguagem GoiásScript
- Coloração para operadores, strings, números e comentários
- Suporte a pares de caracteres e indentação automática

## Instalação

1. Instale a extensão pelo VS Code Marketplace ou use o arquivo `.vsix` diretamente
2. Reinicie o VS Code
3. Abra qualquer arquivo com a extensão `.gs`

## Exemplos de Código

```javascript
// Exemplo de código GoiásScript
prosa("=== Programa GoiásScript ===");
prosa("Usuário: Gefferson-Souza");
prosa("Data: 2025-04-13 05:15:11");

// Função assíncrona
vai_na_frente presta_serviço carregaDados() {
  tenta_aí {
    prosa("Carregando dados...");
    
    // Simulando operação assíncrona
    espera_um_cadim faz_um promessa((resolve_aí) => {
      setTimeout(() => {
        resolve_aí({ status: "sucesso" });
      }, 1000);
    });
    
    prosa("Dados carregados com sucesso!");
    faz_favor certeza;
  } se_der_ruim (erro) {
    reclama("Erro ao carregar dados: " + erro);
    faz_favor de_jeito_nenhum;
  }
}