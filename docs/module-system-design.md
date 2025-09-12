# Design Inicial do Sistema de Módulos do GoiásScript

**Status:** Proposta Inicial
**Versão:** 1.0
**Autor:** Jules

## 1. Resumo

Este documento descreve a proposta inicial para o sistema de módulos do GoiásScript. O objetivo é permitir que os desenvolvedores organizem seu código em arquivos reutilizáveis, seguindo um padrão de sintaxe que seja consistente com a filosofia da linguagem. A sintaxe será inspirada no ECMAScript (ES6) modules, mas traduzida para o dialeto goiano.

## 2. Motivação

À medida que os projetos em GoiásScript crescem, a necessidade de dividir o código em múltiplos arquivos se torna crítica para a manutenibilidade e organização. Um sistema de módulos formal oferece:
- **Reutilização de Código:** Funções, classes e variáveis podem ser definidas em um arquivo e usadas em muitos outros.
- **Organização:** Separação de responsabilidades, tornando o código mais fácil de entender e gerenciar.
- **Escopo:** Evita a poluição do escopo global, já que cada arquivo terá seu próprio escopo.

## 3. Sintaxe Proposta

A sintaxe será baseada em duas novas palavras-chave: `pega` (para importar) e `manda_pra_fora` (para exportar).

### 3.1. Exportação (`manda_pra_fora`)

#### Exportação Padrão (Default Export)
Um módulo pode ter uma única exportação padrão.

```goias
// em 'matematica.gs'
presta_serviço somar(a, b) {
  faz_favor a mais b;
}

manda_pra_fora como_padrao somar;
```

#### Exportação Nomeada (Named Export)
Um módulo pode ter várias exportações nomeadas.

```goias
// em 'util.gs'
uai PI é 3.14159;

presta_serviço multiplicar(a, b) {
  faz_favor a vezes b;
}

manda_pra_fora { PI, multiplicar };
```

### 3.2. Importação (`pega`)

#### Importação Padrão (Default Import)
Para importar um módulo com exportação padrão.

```goias
// em 'main.gs'
pega somar de "./matematica.gs";

prosa(somar(2, 2)); // Saída: 4
```

#### Importação Nomeada (Named Import)
Para importar um ou mais itens de um módulo com exportações nomeadas.

```goias
// em 'main.gs'
pega { PI, multiplicar } de "./util.gs";

prosa("O valor de PI é: " mais PI);
prosa("2 vezes 3 é: " mais multiplicar(2, 3));
```

#### Importação Mista (Mixed Import)
Para importar o padrão e itens nomeados ao mesmo tempo.

```goias
// em 'outro_modulo.gs'
// (Supondo que 'util.gs' tem um export padrão também)
pega padrao, { nomeado1, nomeado2 } de "./util.gs";
```

#### Importação de Namespace (Namespace Import)
Para importar tudo de um módulo como um único objeto.

```goias
// em 'main.gs'
pega tudo como util de "./util.gs";

prosa(util.PI);
prosa(util.multiplicar(5, 5));
```

## 4. Resolução de Módulos

O algoritmo para resolver o caminho de um módulo seguirá uma abordagem simples e previsível:
1.  **Caminhos Relativos:** Se o caminho do módulo começar com `./` ou `../`, ele será resolvido em relação ao arquivo atual. A extensão `.gs` será adicionada automaticamente se for omitida.
2.  **Node Modules:** Se o caminho não for relativo (ex: `"lodash"`), o sistema irá procurar por ele na pasta `node_modules`, permitindo a interoperabilidade com o ecossistema Node.js.

## 5. Dependências Circulares

Uma dependência circular ocorre quando o `Módulo A` importa o `Módulo B`, e o `Módulo B`, por sua vez, importa o `Módulo A`.

O compilador do GoiásScript **deve** detectar dependências circulares durante a fase de análise. Se uma for encontrada, o compilador deve parar a execução e emitir um erro claro para o usuário, indicando o ciclo de dependência.

## 6. Trabalho Futuro

- **Integração com `require`:** Considerar como os módulos GoiásScript podem interagir com os módulos CommonJS do Node.js.
- **Carregamento Dinâmico:** Explorar uma função como `pega_dinamico()` que retorne uma `promessa`, similar ao `import()` dinâmico do JavaScript.
- **Source Maps:** Garantir que os source maps funcionem corretamente através dos limites dos módulos para uma depuração eficaz.
