#!/usr/bin/env node

// 🇧🇷 Gerador de Casos de Uso - CLI Roda de Prosa
// Filosofia goiana: "Automatiza o que é repetitivo, sô!"

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 🎯 Gerador de Casos de Uso Goiano
 */
class GeradorCasoDeUso {
  constructor() {
    this.args = process.argv.slice(2);
    this.validarArgumentos();
  }

  validarArgumentos() {
    if (this.args.length < 2) {
      console.log(`❌ Uso correto: bun run gerar:caso_de_uso <dominio> <nome>`);
      console.log(`📝 Exemplo: bun run gerar:caso_de_uso usuarios CriarUsuario`);
      process.exit(1);
    }

    this.dominio = this.args[0].toLowerCase();
    this.nome = this.args[1];
    this.nomeArquivo = this.nome.toLowerCase().replace(/([a-z])([A-Z])/g, '$1_$2');
  }

  /**
   * 🎨 Template do caso de uso
   */
  obterTemplate() {
    return `// 🇧🇷 Caso de Uso: ${this.nome} - Lógica de negócio pura
// Filosofia goiana: Orquestra entidades e repositórios

pega { CasoDeUso } do "./../../../balaios_compartilhados/decorators/caso_de_uso.decorator.gs"
pega { Injetar } do "./../../../balaios_compartilhados/di/container.goiano.gs"

/**
 * 🎯 Caso de Uso: ${this.nome}
 *
 * [DESCRIÇÃO]: Descreva aqui o que este caso de uso faz
 *
 * Responsabilidades:
 * - [ADICIONAR]: Liste as responsabilidades
 * - [ADICIONAR]: Mais responsabilidades
 */
@CasoDeUso({
    nome: "${this.nome}",
    dominio: "${this.dominio}",
    validacoes: [
        // { campo: "campo_obrigatorio", tipo: "obrigatorio" }
    ],
    dependencias: [
        // { nome: "RepositorioNome", propriedade: "repositorio" }
    ]
})
arruma_trem ${this.nome} {
    // @Injetar("RepositorioNome")
    // repositorio

    aprepara_trem() {
        prosa(\`🎯 Caso de uso ${this.nome} inicializado\`)
    }

    /**
     * 🚀 Executar ${this.nome.toLowerCase()}
     */
    async executar(dados) {
        prosa(\`🎯 Executando ${this.nome}: \${JSON.stringify(dados)}\`)

        tenta {
            // 1. Validar dados de entrada
            este.validar_entrada(dados)

            // 2. Aplicar regras de negócio
            uai resultado é await este.processar_negocio(dados)

            // 3. Persistir mudanças se necessário
            // uai resultado_salvo é await este.repositorio.salvar(resultado)

            // 4. Log de auditoria
            este.log_auditoria("${this.nome.toUpperCase()}_EXECUTADO", {
                dados: dados,
                resultado: resultado,
                timestamp: faz_um Date()
            })

            prosa(\`✅ ${this.nome} executado com sucesso!\`)

            faz_favor {
                sucesso: verdadeiro,
                dados: resultado,
                mensagem: "${this.nome} executado com sucesso, sô!"
            }

        } pega (erro) {
            prosa(\`❌ Erro no ${this.nome}: \${erro.message}\`)
            joga erro
        }
    }

    /**
     * ✅ Validar dados de entrada
     */
    validar_entrada(dados) {
        se (!dados) {
            joga faz_um Error("Dados são obrigatórios para ${this.nome}")
        }

        // Adicionar validações específicas aqui
        // Exemplo:
        // se (!dados.campo_obrigatorio) {
        //     joga faz_um Error("Campo obrigatório não informado!")
        // }
    }

    /**
     * 🏗️ Processar lógica de negócio
     */
    async processar_negocio(dados) {
        // Implementar a lógica específica do caso de uso aqui

        prosa(\`🏗️ Processando lógica de negócio para ${this.nome}\`)

        // Exemplo de processamento
        uai resultado é {
            processado_em: faz_um Date(),
            dados_originais: dados,
            status: "processado"
        }

        faz_favor resultado
    }

    /**
     * 📋 Log de auditoria
     */
    log_auditoria(acao, dados) {
        prosa(\`📋 AUDITORIA: \${acao}\`, JSON.stringify(dados, null, 2))

        // Em produção, salvar em sistema de logs estruturado
        // como JSON no banco ou sistema de observabilidade
    }

    /**
     * 📊 Obter métricas do caso de uso
     */
    obter_metricas() {
        faz_favor {
            caso_de_uso: "${this.nome}",
            dominio: "${this.dominio}",
            executado_em: faz_um Date(),
            versao: "1.0.0"
        }
    }
}

troca_ideia { ${this.nome} }`;
  }

  /**
   * 🎯 Gerar o arquivo
   */
  gerar() {
    const diretorio = path.resolve(`./src/cores/${this.dominio}/casos_de_uso`);
    const caminhoArquivo = path.join(diretorio, `${this.nomeArquivo}.caso_de_uso.gs`);

    // Criar diretório se não existir
    if (!fs.existsSync(diretorio)) {
      fs.mkdirSync(diretorio, { recursive: true });
      console.log(`📁 Diretório criado: ${diretorio}`);
    }

    // Verificar se arquivo já existe
    if (fs.existsSync(caminhoArquivo)) {
      console.log(`❌ Arquivo já existe: ${caminhoArquivo}`);
      console.log(`💡 Use --force para sobrescrever ou escolha outro nome`);
      return;
    }

    // Escrever arquivo
    fs.writeFileSync(caminhoArquivo, this.obterTemplate(), 'utf8');

    console.log(`\n🎉 Caso de uso gerado com sucesso!`);
    console.log(`📁 Localização: ${caminhoArquivo}`);
    console.log(`🎯 Nome: ${this.nome}`);
    console.log(`🏗️ Domínio: ${this.dominio}`);
    console.log(`\n💡 Próximos passos:`);
    console.log(`   1. Edite o arquivo gerado`);
    console.log(`   2. Implemente a lógica de negócio`);
    console.log(`   3. Configure as dependências necessárias`);
    console.log(`   4. Adicione testes se necessário`);
    console.log(`\n🚀 Bom trabalho, sô!`);
  }
}

// Executar gerador
const gerador = new GeradorCasoDeUso();
gerador.gerar();