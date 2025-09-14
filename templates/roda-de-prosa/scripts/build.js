#!/usr/bin/env node

// 🇧🇷 Build Script Roda de Prosa - Powered by Bun
// Filosofia goiana: "Build rápido como sertanejo nas eleições!"

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 🏗️ Builder Roda de Prosa
 */
class BuilderRodaDeProsa {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.srcPath = path.join(this.projectRoot, 'src');
    this.distPath = path.join(this.projectRoot, 'dist');
    this.publicPath = path.join(this.projectRoot, 'public');
    this.terreiroPath = path.join(this.projectRoot, 'terreiro_da_prosa');

    this.stats = {
      inicio: Date.now(),
      arquivos_processados: 0,
      erros: 0,
      warnings: 0
    };
  }

  /**
   * 🚀 Executar build completo
   */
  async build() {
    try {
      console.log(`🇧🇷 === BUILD RODA DE PROSA ===`);
      console.log(`🏗️ Framework Clean Architecture Goiano`);
      console.log(`⚡ Powered by Bun + GoiásScript`);
      console.log(``);

      await this.limpar_dist();
      await this.verificar_dependencias();
      await this.compilar_backend();
      await this.compilar_frontend();
      await this.copiar_assets();
      await this.processar_config();
      await this.gerar_relatorio();

      console.log(`✅ Build Roda de Prosa concluído com sucesso!`);
      console.log(`📦 Output: ${this.distPath}`);

    } catch (erro) {
      console.error(`❌ Erro no build: ${erro.message}`);
      process.exit(1);
    }
  }

  /**
   * 🧹 Limpar diretório dist
   */
  async limpar_dist() {
    console.log(`🧹 Limpando diretório dist...`);

    if (fs.existsSync(this.distPath)) {
      fs.rmSync(this.distPath, { recursive: true, force: true });
    }

    fs.mkdirSync(this.distPath, { recursive: true });
    fs.mkdirSync(path.join(this.distPath, 'backend'), { recursive: true });
    fs.mkdirSync(path.join(this.distPath, 'frontend'), { recursive: true });
  }

  /**
   * 📦 Verificar dependências
   */
  async verificar_dependencias() {
    console.log(`📦 Verificando dependências...`);

    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json não encontrado!');
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    console.log(`   📋 Projeto: ${packageJson.name}`);
    console.log(`   🏷️ Versão: ${packageJson.version}`);
    console.log(`   🏗️ Arquitetura: ${packageJson.roda_de_prosa?.arquitetura || 'Não definida'}`);
  }

  /**
   * 🔧 Compilar Backend (Clean Architecture)
   */
  async compilar_backend() {
    console.log(`🔧 Compilando backend (Clean Architecture)...`);

    const backendSrc = this.srcPath;
    const backendDist = path.join(this.distPath, 'backend');

    // Compilar arquivos .gs para .js
    await this.compilar_goiasscript(backendSrc, backendDist);

    // Copiar package.json para o backend
    const packageJsonSrc = path.join(this.projectRoot, 'package.json');
    const packageJsonDist = path.join(backendDist, 'package.json');
    fs.copyFileSync(packageJsonSrc, packageJsonDist);

    console.log(`   ✅ Backend compilado: ${backendDist}`);
  }

  /**
   * 🎨 Compilar Frontend (Terreiro da Prosa)
   */
  async compilar_frontend() {
    console.log(`🎨 Compilando frontend (Terreiro da Prosa)...`);

    if (fs.existsSync(this.terreiroPath)) {
      const frontendDist = path.join(this.distPath, 'frontend');
      await this.compilar_goiasscript(this.terreiroPath, frontendDist);
      console.log(`   ✅ Frontend compilado: ${frontendDist}`);
    } else {
      console.log(`   ⚠️ Diretório terreiro_da_prosa não encontrado. Pulando frontend.`);
    }
  }

  /**
   * 🔄 Compilar arquivos GoiásScript
   */
  async compilar_goiasscript(srcDir, distDir) {
    const arquivos = this.encontrar_arquivos_gs(srcDir);

    for (const arquivo of arquivos) {
      const caminhoRelativo = path.relative(srcDir, arquivo);
      const caminhoDestino = path.join(distDir, caminhoRelativo.replace('.gs', '.js'));
      const diretorioDestino = path.dirname(caminhoDestino);

      // Criar diretório se necessário
      if (!fs.existsSync(diretorioDestino)) {
        fs.mkdirSync(diretorioDestino, { recursive: true });
      }

      try {
        // Simular transpilação GoiásScript -> JavaScript
        const conteudoGs = fs.readFileSync(arquivo, 'utf8');
        const conteudoJs = await this.transpilar_gs_para_js(conteudoGs, arquivo);

        fs.writeFileSync(caminhoDestino, conteudoJs, 'utf8');
        this.stats.arquivos_processados++;

        console.log(`   📄 ${caminhoRelativo} → ${caminhoRelativo.replace('.gs', '.js')}`);

      } catch (erro) {
        console.error(`   ❌ Erro ao compilar ${caminhoRelativo}: ${erro.message}`);
        this.stats.erros++;
      }
    }
  }

  /**
   * 🔄 Transpilar GoiásScript para JavaScript
   */
  async transpilar_gs_para_js(conteudo, arquivo) {
    // Simulação simples de transpilação GoiásScript -> JavaScript
    let js = conteudo;

    // Substituições básicas GoiásScript -> JS
    js = js.replace(/pega\s*\{\s*([^}]+)\s*\}\s*do\s*["']([^"']+)["']/g, 'import { $1 } from "$2"');
    js = js.replace(/pega\s+([^\s]+)\s+do\s+["']([^"']+)["']/g, 'import $1 from "$2"');
    js = js.replace(/troca_ideia\s*\{\s*([^}]+)\s*\}/g, 'export { $1 }');
    js = js.replace(/faz_trem\s+(\w+)/g, 'function $1');
    js = js.replace(/arruma_trem\s+(\w+)/g, 'class $1');
    js = js.replace(/aprepara_trem\s*\(/g, 'constructor(');
    js = js.replace(/uai\s+(\w+)\s+é\s+/g, 'const $1 = ');
    js = js.replace(/trem\s+(\w+)\s+é\s+/g, 'let $1 = ');
    js = js.replace(/\bé\b/g, '=');
    js = js.replace(/\bse\b/g, 'if');
    js = js.replace(/\bsenao\b/g, 'else');
    js = js.replace(/\bpra\b/g, 'for');
    js = js.replace(/\bfaz_um\b/g, 'new');
    js = js.replace(/\bfaz_favor\b/g, 'return');
    js = js.replace(/\btenta\b/g, 'try');
    js = js.replace(/\bpega\b(?!\s*\{)/g, 'catch');
    js = js.replace(/\bjoga\b/g, 'throw');
    js = js.replace(/\bprosa\b/g, 'console.log');
    js = js.replace(/\bverdadeiro\b/g, 'true');
    js = js.replace(/\bfalso\b/g, 'false');
    js = js.replace(/\bmaior_que\b/g, '>');
    js = js.replace(/\bmenor_que\b/g, '<');
    js = js.replace(/\beste\b/g, 'this');
    js = js.replace(/\.tamanho\(\)/g, '.length');
    js = js.replace(/\.empurrar\(/g, '.push(');
    js = js.replace(/\.tem_no_meio\(/g, '.includes(');
    js = js.replace(/\.cochichando\(\)/g, '.toLowerCase()');
    js = js.replace(/\.gritando\(\)/g, '.toUpperCase()');

    return js;
  }

  /**
   * 📁 Encontrar arquivos .gs
   */
  encontrar_arquivos_gs(diretorio) {
    const arquivos = [];

    function percorrer(dir) {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const caminhoCompleto = path.join(dir, item);
        const stat = fs.statSync(caminhoCompleto);

        if (stat.isDirectory()) {
          percorrer(caminhoCompleto);
        } else if (item.endsWith('.gs')) {
          arquivos.push(caminhoCompleto);
        }
      }
    }

    if (fs.existsSync(diretorio)) {
      percorrer(diretorio);
    }

    return arquivos;
  }

  /**
   * 📋 Copiar assets estáticos
   */
  async copiar_assets() {
    console.log(`📋 Copiando assets estáticos...`);

    // Copiar scripts
    const scriptsPath = path.join(this.projectRoot, 'scripts');
    if (fs.existsSync(scriptsPath)) {
      const scriptsDist = path.join(this.distPath, 'scripts');
      fs.mkdirSync(scriptsDist, { recursive: true });
      fs.cpSync(scriptsPath, scriptsDist, { recursive: true });
      console.log(`   📁 Scripts copiados`);
    }

    // Copiar public se existir
    if (fs.existsSync(this.publicPath)) {
      const publicDist = path.join(this.distPath, 'public');
      fs.cpSync(this.publicPath, publicDist, { recursive: true });
      console.log(`   🌐 Assets públicos copiados`);
    }
  }

  /**
   * ⚙️ Processar configurações
   */
  async processar_config() {
    console.log(`⚙️ Processando configurações...`);

    // Copiar arquivos de configuração
    const configs = ['goias.config.js', 'tailwind.config.js', 'bun.lockb'];

    for (const config of configs) {
      const srcConfig = path.join(this.projectRoot, config);
      const distConfig = path.join(this.distPath, config);

      if (fs.existsSync(srcConfig)) {
        fs.copyFileSync(srcConfig, distConfig);
        console.log(`   ⚙️ ${config} copiado`);
      }
    }
  }

  /**
   * 📊 Gerar relatório de build
   */
  async gerar_relatorio() {
    const duracao = Date.now() - this.stats.inicio;

    console.log(``);
    console.log(`📊 === RELATÓRIO DE BUILD ===`);
    console.log(`⏱️ Duração: ${duracao}ms`);
    console.log(`📄 Arquivos processados: ${this.stats.arquivos_processados}`);
    console.log(`❌ Erros: ${this.stats.erros}`);
    console.log(`⚠️ Warnings: ${this.stats.warnings}`);
    console.log(``);

    // Salvar relatório em JSON
    const relatorio = {
      timestamp: new Date().toISOString(),
      duracao_ms: duracao,
      stats: this.stats,
      framework: "Roda de Prosa",
      arquitetura: "Clean Architecture Goiana"
    };

    fs.writeFileSync(
      path.join(this.distPath, 'build-report.json'),
      JSON.stringify(relatorio, null, 2),
      'utf8'
    );

    console.log(`💡 Relatório detalhado salvo em: build-report.json`);
  }
}

// Executar build se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const builder = new BuilderRodaDeProsa();
  builder.build();
}