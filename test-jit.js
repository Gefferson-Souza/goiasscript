// Teste do JIT Compiler
const GoiasScriptCompiler = require('./src/compiler');

async function testarJIT() {
  console.log('🔥 Teste do GoiásScript JIT Compiler\n');
  
  const compiler = new GoiasScriptCompiler({
    enableJIT: true,
    enableTypeChecking: true
  });
  
  // Configurar JIT com threshold baixo para demonstração
  compiler.configureJIT({ 
    threshold: 2,
    optimizations: {
      constantFolding: true,
      inlineExpressions: true,
      loopUnrolling: true,
      deadCodeElimination: true,
      astOptimization: true
    }
  });

  const codigoSimples = `
    uai x é 10 + 20
    uai y é 5 * 4
    uai z é GoianoMath.maior(x, y)
    prosa("Resultado:", z)
  `;

  console.log('📝 Código de teste:');
  console.log(codigoSimples);
  console.log('\n🚀 Compilações:');

  // Primeira execução - sem JIT
  console.log('\n1️⃣ Primeira execução (sem JIT):');
  const result1 = compiler.compile(codigoSimples, 'test.gs');
  console.log(`✅ Sucesso: ${result1.success}`);
  console.log(`🔥 JIT ativado: ${result1.jitOptimized || false}`);
  
  // Segunda execução - sem JIT ainda
  console.log('\n2️⃣ Segunda execução (sem JIT ainda):');
  const result2 = compiler.compile(codigoSimples, 'test.gs');
  console.log(`✅ Sucesso: ${result2.success}`);
  console.log(`🔥 JIT ativado: ${result2.jitOptimized || false}`);
  
  // Terceira execução - JIT ativado!
  console.log('\n3️⃣ Terceira execução (JIT ativado!):');
  const result3 = compiler.compile(codigoSimples, 'test.gs');
  console.log(`✅ Sucesso: ${result3.success}`);
  console.log(`🔥 JIT ativado: ${result3.jitOptimized || false}`);
  
  if (result3.warnings && result3.warnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    result3.warnings.forEach(warning => {
      console.log(`  - ${warning.message}`);
    });
  }

  // Relatório de performance
  console.log('\n📊 Relatório JIT:');
  const report = compiler.getJITReport();
  if (report) {
    console.log(`🎯 Hot Spots: ${report.totalHotSpots}`);
    console.log(`🔢 Execuções totais: ${report.totalExecutions}`);
    console.log(`💾 Taxa de cache hit: ${(report.cacheHitRatio * 100).toFixed(1)}%`);
    
    if (report.hotSpots.length > 0) {
      console.log('\n🔥 Hot Spots detectados:');
      report.hotSpots.forEach(hotspot => {
        console.log(`  - ${hotspot.identifier}: ${hotspot.executions} execuções`);
        console.log(`    Compressão: ${(hotspot.compressionRatio * 100).toFixed(1)}%`);
      });
    }
  }

  // Hot spots
  console.log('\n🎯 Hot Spots detectados:');
  const hotSpots = compiler.getJITHotSpots();
  hotSpots.forEach(spot => {
    console.log(`  - ${spot.identifier}: ${spot.executions} execuções`);
  });

  console.log('\n✨ Teste JIT concluído!');
}

testarJIT().catch(console.error);