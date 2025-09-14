#!/usr/bin/env node

// 🇧🇷 Benchmark GoiásScript Framework vs Frameworks Populares
// Comparativo de performance para desenvolvimento web

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 BENCHMARK GOIÁSSCRIPT vs FRAMEWORKS POPULARES');
console.log('================================================');

const frameworks = {
  goiasscript: {
    name: 'GoiásScript Framework',
    emoji: '🇧🇷',
    install: 'goiasscript arma_o_barraco teste-goias framework',
    build: 'npm run build',
    dev: 'npm run dev',
    dir: 'teste-goias',
    color: '\x1b[32m' // Verde
  },
  react: {
    name: 'Create React App',
    emoji: '⚛️',
    install: 'npx create-react-app teste-react',
    build: 'npm run build',
    dev: 'npm start',
    dir: 'teste-react',
    color: '\x1b[36m' // Cyan
  },
  vue: {
    name: 'Vue.js (Vite)',
    emoji: '🟢',
    install: 'npm create vue@latest teste-vue -- --default',
    build: 'npm run build',
    dev: 'npm run dev',
    dir: 'teste-vue',
    color: '\x1b[32m' // Verde
  },
  angular: {
    name: 'Angular CLI',
    emoji: '🔺',
    install: 'npx @angular/cli new teste-angular --routing --style=css --skip-git',
    build: 'npm run build',
    dev: 'npm start',
    dir: 'teste-angular',
    color: '\x1b[31m' // Vermelho
  },
  next: {
    name: 'Next.js',
    emoji: '▲',
    install: 'npx create-next-app@latest teste-next --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"',
    build: 'npm run build',
    dev: 'npm run dev',
    dir: 'teste-next',
    color: '\x1b[37m' // Branco
  }
};

function cronometrar(comando, diretorio, timeout = 120000) {
  console.log(`  Executando: ${comando}`);
  const inicio = Date.now();
  try {
    execSync(comando, {
      cwd: diretorio,
      stdio: 'pipe',
      timeout: timeout
    });
    const fim = Date.now();
    return fim - inicio;
  } catch (error) {
    console.log(`  ❌ Erro: ${error.message.split('\n')[0]}`);
    return -1;
  }
}

function formatarTempo(ms) {
  if (ms === -1) return 'FALHOU';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms/1000).toFixed(1)}s`;
  return `${(ms/60000).toFixed(1)}min`;
}

function obterTamanho(diretorio) {
  try {
    const resultado = execSync(`du -sh ${diretorio}`, { encoding: 'utf8' });
    return resultado.split('\t')[0];
  } catch (e) {
    return 'N/A';
  }
}

async function testarFramework(key, config, testes = ['install', 'build']) {
  console.log(`\n${config.color}${config.emoji} Testando ${config.name}${'\x1b[0m'}`);
  console.log('─'.repeat(50));

  const resultados = {
    name: config.name,
    emoji: config.emoji,
    install: -1,
    build: -1,
    size: 'N/A',
    nodeModulesSize: 'N/A'
  };

  // Limpar diretório se existir
  if (fs.existsSync(config.dir)) {
    execSync(`rm -rf ${config.dir}`, { stdio: 'pipe' });
  }

  // Teste de instalação
  if (testes.includes('install')) {
    console.log('  📦 Testando instalação...');
    const tempoInstall = cronometrar(config.install, '.', 300000); // 5min timeout
    resultados.install = tempoInstall;

    if (tempoInstall !== -1) {
      // Instalar dependências se necessário
      if (fs.existsSync(path.join(config.dir, 'package.json'))) {
        console.log('  📦 Instalando dependências...');
        const tempoDeps = cronometrar('npm install', config.dir, 300000);
        if (tempoDeps !== -1) {
          resultados.install += tempoDeps;
        }
      }

      // Obter tamanhos
      resultados.size = obterTamanho(config.dir);
      const nodeModulesPath = path.join(config.dir, 'node_modules');
      if (fs.existsSync(nodeModulesPath)) {
        resultados.nodeModulesSize = obterTamanho(nodeModulesPath);
      }
    }
  }

  // Teste de build
  if (testes.includes('build') && fs.existsSync(config.dir)) {
    console.log('  🔧 Testando build...');
    const tempoBuild = cronometrar(config.build, config.dir, 180000); // 3min timeout
    resultados.build = tempoBuild;
  }

  return resultados;
}

async function executarBenchmark() {
  const resultados = [];

  // Testar cada framework
  for (const [key, config] of Object.entries(frameworks)) {
    try {
      const resultado = await testarFramework(key, config);
      resultados.push(resultado);
    } catch (error) {
      console.log(`❌ Erro ao testar ${config.name}: ${error.message}`);
      resultados.push({
        name: config.name,
        emoji: config.emoji,
        install: -1,
        build: -1,
        size: 'N/A',
        nodeModulesSize: 'N/A'
      });
    }
  }

  // Gerar relatório
  console.log('\n' + '='.repeat(80));
  console.log('📊 RELATÓRIO FINAL - BENCHMARK DE FRAMEWORKS');
  console.log('='.repeat(80));

  // Tabela de resultados
  console.log('\n📋 RESUMO DOS TESTES:');
  console.log('┌─────────────────────┬──────────────┬──────────────┬──────────────┬──────────────┐');
  console.log('│ Framework           │ Instalação   │ Build        │ Tamanho      │ node_modules │');
  console.log('├─────────────────────┼──────────────┼──────────────┼──────────────┼──────────────┤');

  resultados.forEach(r => {
    const nome = (r.emoji + ' ' + r.name).padEnd(19);
    const install = formatarTempo(r.install).padEnd(12);
    const build = formatarTempo(r.build).padEnd(12);
    const size = r.size.padEnd(12);
    const nodeSize = r.nodeModulesSize.padEnd(12);
    console.log(`│ ${nome} │ ${install} │ ${build} │ ${size} │ ${nodeSize} │`);
  });

  console.log('└─────────────────────┴──────────────┴──────────────┴──────────────┴──────────────┘');

  // Análise de performance
  console.log('\n🏆 ANÁLISE DE PERFORMANCE:');

  const sucessos = resultados.filter(r => r.install !== -1 && r.build !== -1);
  if (sucessos.length > 0) {
    // Melhor instalação
    const melhorInstall = sucessos.reduce((min, r) => r.install < min.install ? r : min);
    console.log(`📦 Instalação mais rápida: ${melhorInstall.emoji} ${melhorInstall.name} (${formatarTempo(melhorInstall.install)})`);

    // Melhor build
    const melhorBuild = sucessos.reduce((min, r) => r.build < min.build ? r : min);
    console.log(`🔧 Build mais rápido: ${melhorBuild.emoji} ${melhorBuild.name} (${formatarTempo(melhorBuild.build)})`);

    // GoiásScript vs outros
    const goias = resultados.find(r => r.name.includes('GoiásScript'));
    if (goias && goias.install !== -1 && goias.build !== -1) {
      console.log('\n🇧🇷 ANÁLISE GOIÁSSCRIPT:');

      sucessos.filter(r => r !== goias).forEach(outro => {
        const diferencaInstall = ((outro.install - goias.install) / outro.install * 100).toFixed(1);
        const diferencaBuild = ((outro.build - goias.build) / outro.build * 100).toFixed(1);

        console.log(`\n  vs ${outro.emoji} ${outro.name}:`);
        if (goias.install < outro.install) {
          console.log(`  📦 GoiásScript ${Math.abs(diferencaInstall)}% mais rápido na instalação`);
        } else {
          console.log(`  📦 ${outro.name} ${Math.abs(diferencaInstall)}% mais rápido na instalação`);
        }

        if (goias.build < outro.build) {
          console.log(`  🔧 GoiásScript ${Math.abs(diferencaBuild)}% mais rápido no build`);
        } else {
          console.log(`  🔧 ${outro.name} ${Math.abs(diferencaBuild)}% mais rápido no build`);
        }
      });
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎯 CONCLUSÃO GOIANA:');

  const goias = resultados.find(r => r.name.includes('GoiásScript'));
  if (goias && goias.install !== -1 && goias.build !== -1) {
    const posicaoInstall = sucessos.sort((a, b) => a.install - b.install).indexOf(goias) + 1;
    const posicaoBuild = sucessos.sort((a, b) => a.build - b.build).indexOf(goias) + 1;

    console.log(`🏆 GoiásScript ficou em ${posicaoInstall}º lugar na instalação`);
    console.log(`🏆 GoiásScript ficou em ${posicaoBuild}º lugar no build`);

    if (posicaoInstall === 1 || posicaoBuild === 1) {
      console.log('🎉 GoiásScript Framework é COMPETITIVO!');
      console.log('🇧🇷 Orgulho brasileiro no desenvolvimento web!');
    } else {
      console.log('📈 GoiásScript tem potencial para melhorias');
      console.log('🚀 Foco na otimização para próximas versões');
    }
  } else {
    console.log('❌ GoiásScript não conseguiu completar os testes');
    console.log('🔧 Revisão necessária na configuração');
  }

  console.log('='.repeat(80));
}

// Executar benchmark
executarBenchmark().catch(error => {
  console.error('❌ Erro no benchmark:', error);
  process.exit(1);
});