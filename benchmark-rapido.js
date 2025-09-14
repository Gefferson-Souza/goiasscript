#!/usr/bin/env node

// 🇧🇷 Benchmark Rápido - GoiásScript vs React
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 BENCHMARK RÁPIDO: GoiásScript vs React');
console.log('==========================================');

function cronometrar(comando, diretorio, timeout = 60000) {
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
    return -1;
  }
}

function formatarTempo(ms) {
  if (ms === -1) return 'FALHOU';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms/1000).toFixed(1)}s`;
}

function obterTamanho(diretorio) {
  try {
    const resultado = execSync(`du -sh ${diretorio}`, { encoding: 'utf8' });
    return resultado.split('\t')[0];
  } catch (e) {
    return 'N/A';
  }
}

async function testarFrameworks() {
  const resultados = {};

  console.log('\n🇧🇷 Testando GoiásScript Framework...');
  console.log('──────────────────────────────────────');

  // Limpar diretórios
  ['teste-gs-bench', 'teste-react-bench'].forEach(dir => {
    if (fs.existsSync(dir)) {
      execSync(`rm -rf ${dir}`, { stdio: 'pipe' });
    }
  });

  // Testar GoiásScript
  console.log('📦 Criando projeto GoiásScript...');
  const gsInstall = cronometrar('goiasscript arma_o_barraco teste-gs-bench framework', '.');

  let gsBuild = -1;
  if (gsInstall !== -1 && fs.existsSync('teste-gs-bench')) {
    console.log('🔧 Testando build GoiásScript...');
    gsBuild = cronometrar('npm run build', 'teste-gs-bench');
  }

  resultados.goiasscript = {
    install: gsInstall,
    build: gsBuild,
    size: fs.existsSync('teste-gs-bench') ? obterTamanho('teste-gs-bench') : 'N/A'
  };

  console.log('\n⚛️ Testando Create React App...');
  console.log('─────────────────────────────────');

  console.log('📦 Criando projeto React...');
  const reactInstall = cronometrar('npx create-react-app teste-react-bench', '.', 180000);

  let reactBuild = -1;
  if (reactInstall !== -1 && fs.existsSync('teste-react-bench')) {
    console.log('🔧 Testando build React...');
    reactBuild = cronometrar('npm run build', 'teste-react-bench');
  }

  resultados.react = {
    install: reactInstall,
    build: reactBuild,
    size: fs.existsSync('teste-react-bench') ? obterTamanho('teste-react-bench') : 'N/A'
  };

  // Relatório
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTADOS DO BENCHMARK');
  console.log('='.repeat(60));

  console.log('\n┌─────────────────────┬──────────────┬──────────────┬──────────────┐');
  console.log('│ Framework           │ Instalação   │ Build        │ Tamanho      │');
  console.log('├─────────────────────┼──────────────┼──────────────┼──────────────┤');

  const gs = resultados.goiasscript;
  const react = resultados.react;

  console.log(`│ 🇧🇷 GoiásScript      │ ${formatarTempo(gs.install).padEnd(12)} │ ${formatarTempo(gs.build).padEnd(12)} │ ${gs.size.padEnd(12)} │`);
  console.log(`│ ⚛️  Create React App │ ${formatarTempo(react.install).padEnd(12)} │ ${formatarTempo(react.build).padEnd(12)} │ ${react.size.padEnd(12)} │`);

  console.log('└─────────────────────┴──────────────┴──────────────┴──────────────┘');

  // Comparação
  if (gs.install !== -1 && react.install !== -1) {
    console.log('\n🏆 COMPARAÇÃO DIRETA:');

    if (gs.install < react.install) {
      const diferenca = ((react.install - gs.install) / react.install * 100).toFixed(1);
      console.log(`📦 GoiásScript ${diferenca}% mais rápido na instalação!`);
    } else {
      const diferenca = ((gs.install - react.install) / gs.install * 100).toFixed(1);
      console.log(`📦 React ${diferenca}% mais rápido na instalação`);
    }

    if (gs.build !== -1 && react.build !== -1) {
      if (gs.build < react.build) {
        const diferenca = ((react.build - gs.build) / react.build * 100).toFixed(1);
        console.log(`🔧 GoiásScript ${diferenca}% mais rápido no build!`);
      } else {
        const diferenca = ((gs.build - react.build) / gs.build * 100).toFixed(1);
        console.log(`🔧 React ${diferenca}% mais rápido no build`);
      }
    }
  }

  console.log('\n🎯 CONCLUSÃO GOIANA:');
  if (gs.install !== -1 && gs.build !== -1) {
    console.log('✅ GoiásScript Framework funcionando corretamente!');
    console.log('🇧🇷 Framework brasileiro competitivo no mercado');

    if (gs.install < react.install || gs.build < react.build) {
      console.log('🏆 GoiásScript supera React em pelo menos um teste!');
    } else {
      console.log('📈 GoiásScript tem espaço para otimizações');
    }
  } else {
    console.log('❌ GoiásScript precisa de ajustes para completar os testes');
  }

  console.log('='.repeat(60));
}

// Executar
testarFrameworks().catch(console.error);