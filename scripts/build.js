#!/usr/bin/env node

/**
 * Script de build para o GoiásScript
 * Compila e prepara o projeto para distribuição
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');

async function clean() {
  console.log(chalk.blue('🧹 Limpando diretórios de build...'));
  await fs.remove(DIST_DIR);
  console.log(chalk.green('✅ Build limpo com sucesso!'));
}

async function copyFiles() {
  console.log(chalk.blue('📁 Copiando arquivos essenciais...'));
  
  // Copiar src para dist
  await fs.copy(SRC_DIR, path.join(DIST_DIR, 'src'));
  
  // Copiar arquivos importantes
  const filesToCopy = [
    'package.json',
    'README.md', 
    'LICENSE',
    'CHANGELOG.md'
  ];
  
  for (const file of filesToCopy) {
    const srcFile = path.join(PROJECT_ROOT, file);
    const destFile = path.join(DIST_DIR, file);
    
    if (await fs.pathExists(srcFile)) {
      await fs.copy(srcFile, destFile);
    }
  }
  
  console.log(chalk.green('✅ Arquivos copiados com sucesso!'));
}

async function updatePackageJson() {
  console.log(chalk.blue('📦 Atualizando package.json para produção...'));
  
  const packagePath = path.join(DIST_DIR, 'package.json');
  const packageJson = await fs.readJson(packagePath);
  
  // Remover devDependencies
  delete packageJson.devDependencies;
  delete packageJson.scripts.dev;
  delete packageJson.scripts.test;
  delete packageJson.scripts['test:watch'];
  delete packageJson.scripts.lint;
  delete packageJson.scripts['lint:fix'];
  delete packageJson.scripts.format;
  
  await fs.writeJson(packagePath, packageJson, { spaces: 2 });
  console.log(chalk.green('✅ package.json atualizado!'));
}

async function makeExecutable() {
  console.log(chalk.blue('🔧 Tornando CLI executável...'));
  
  const cliPath = path.join(DIST_DIR, 'src', 'cli', 'index.js');
  if (await fs.pathExists(cliPath)) {
    const content = await fs.readFile(cliPath, 'utf8');
    if (!content.startsWith('#!/usr/bin/env node')) {
      await fs.writeFile(cliPath, '#!/usr/bin/env node\n' + content);
    }
  }
  
  console.log(chalk.green('✅ CLI configurado!'));
}

async function build() {
  try {
    console.log(chalk.yellow('🚀 Iniciando build do GoiásScript...'));
    
    await clean();
    await copyFiles();
    await updatePackageJson();
    await makeExecutable();
    
    console.log(chalk.green.bold('\n🎉 Build concluído com sucesso!'));
    console.log(chalk.blue(`📦 Arquivos disponíveis em: ${DIST_DIR}`));
    
  } catch (error) {
    console.error(chalk.red.bold('\n❌ Erro durante o build:'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

// Executar build se chamado diretamente
if (require.main === module) {
  build();
}

module.exports = { build };