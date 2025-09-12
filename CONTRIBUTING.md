# Contribuindo para o GoiásScript 🤠

Ô gente, que bão que ocê quer contribuir com o GoiásScript! Este guia vai te ajudar a entender como participar do desenvolvimento desta linguagem goiana.

## Como Contribuir

### 🐛 Reportar Bugs

Antes de reportar um bug, verifique se não existe uma issue similar já aberta. Se não existir:

1. Abra uma nova issue usando o template de bug report
2. Inclua informações detalhadas sobre o problema
3. Adicione exemplos de código GoiásScript que reproduzem o erro
4. Informe sua versão do Node.js e sistema operacional

### 💡 Sugerir Features

Para sugerir uma nova funcionalidade:

1. Abra uma issue usando o template de feature request
2. Descreva claramente a funcionalidade desejada
3. Explique por que seria útil para a comunidade
4. Se possível, sugira como poderia ser implementada

### 🔧 Desenvolvimento

#### Configuração do Ambiente

1. **Fork** este repositório
2. **Clone** seu fork:
   ```bash
   git clone https://github.com/SEU_USERNAME/goiasscript.git
   cd goiasscript
   ```

3. **Instale as dependências**:
   ```bash
   npm install
   ```

4. **Execute os testes** para garantir que está tudo funcionando:
   ```bash
   npm test
   ```

#### Estrutura do Projeto

```
src/
├── compiler/       # Núcleo do transpiler
├── errors/         # Sistema de erros goianos
├── cli/           # Interface de linha de comando
└── stdlib/        # Biblioteca padrão (futuro)

examples/          # Exemplos organizados por categoria
tests/            # Testes automatizados
docs/             # Documentação
```

#### Fluxo de Desenvolvimento

1. **Crie uma branch** para sua feature:
   ```bash
   git checkout -b feature/nova-funcionalidade
   ```

2. **Implemente suas mudanças** seguindo os padrões do projeto

3. **Escreva testes** para suas modificações

4. **Execute os testes e linting**:
   ```bash
   npm test
   npm run lint
   npm run format
   ```

5. **Commit suas mudanças** com mensagens descritivas:
   ```bash
   git commit -m "feat: adiciona suporte a novos operadores goianos"
   ```

6. **Push para sua branch**:
   ```bash
   git push origin feature/nova-funcionalidade
   ```

7. **Abra um Pull Request**

### 📝 Padrões de Código

#### Estilo de Código
- Use ESLint e Prettier (já configurados)
- Máximo 100 caracteres por linha
- Use single quotes para strings
- Adicione ponto e vírgula no final das instruções

#### Testes
- Todo código novo deve ter testes
- Coverage mínimo de 80%
- Use nomes descritivos para os testes
- Organize testes em blocos lógicos com `describe` e `it`

#### Commit Messages
Siga o padrão [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` para novas funcionalidades
- `fix:` para correções de bugs
- `docs:` para mudanças na documentação
- `style:` para formatação e estilo
- `refactor:` para refatoração de código
- `test:` para testes
- `chore:` para tarefas de manutenção

### 🧪 Testando

#### Executar Todos os Testes
```bash
npm test
```

#### Executar Testes em Modo Watch
```bash
npm run test:watch
```

#### Ver Coverage
```bash
npm run test:coverage
```

#### Testar Exemplos
```bash
# Exemplo básico
npm run example:basic

# Exemplo com classes
npm run example:classes

# Exemplo assíncrono
npm run example:async
```

### 🌟 Áreas de Contribuição

#### Prioridade Alta
- [ ] Melhorar sistema de erros goianos
- [ ] Adicionar mais expressões regionais
- [ ] Otimizar performance do transpiler
- [ ] Implementar source maps
- [ ] Criar mais exemplos práticos

#### Prioridade Média
- [ ] Sistema de módulos/importação
- [ ] Biblioteca padrão goiana
- [ ] Integração com ferramentas de build
- [ ] Melhorar extensão VS Code

#### Prioridade Baixa
- [ ] Suporte a TypeScript definitions
- [ ] Plugin para webpack
- [ ] REPL interativo
- [ ] Documentação interativa

### 🤝 Processo de Review

1. Todo PR passa por revisão de código
2. Testes automáticos devem passar
3. Coverage deve ser mantido acima de 80%
4. Documentação deve ser atualizada se necessário
5. Pelo menos um maintainer deve aprovar

### 📚 Recursos Úteis

- [Documentação da Linguagem](README.md)
- [Exemplos Práticos](examples/)
- [Referência da API](docs/api/)
- [Issues Abertas](https://github.com/Gefferson-Souza/goiasscript/issues)

### ❓ Dúvidas?

Se tiver qualquer dúvida, pode:
- Abrir uma issue com a tag "question"
- Entrar em contato pelo email: gefferson.souza@example.com

---

**Obrigado por contribuir com o GoiásScript! Juntos vamos fazer essa linguagem ficar cada vez mais bãzona! 🚀🤠**