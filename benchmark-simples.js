// Benchmark simples - Bun vs Node.js
const { execSync } = require('child_process');

function cronometrar(comando, dir) {
  console.log(`Executando: ${comando}`);
  const inicio = Date.now();
  try {
    execSync(comando, {
      cwd: dir,
      stdio: 'pipe'
    });
    const fim = Date.now();
    return fim - inicio;
  } catch (e) {
    console.log(`Erro: ${e.message}`);
    return -1;
  }
}

function benchmark() {
  const dir = "./teste-bun";
  const testes = 5;

  console.log("🚀 BENCHMARK BUN vs NODE.JS");
  console.log("============================");

  // Teste builds
  console.log("\n🔧 Testando BUILDS...");

  let bunTimes = [];
  let nodeTimes = [];

  for (let i = 0; i < testes; i++) {
    console.log(`\nTeste ${i + 1}/${testes}`);

    // Limpar
    execSync("rm -rf dist/*", { cwd: dir, stdio: 'pipe' });

    // Bun
    const bunTime = cronometrar("bun run build", dir);
    if (bunTime > 0) bunTimes.push(bunTime);

    execSync("rm -rf dist/*", { cwd: dir, stdio: 'pipe' });

    // Node
    const nodeTime = cronometrar("npm run npm:build", dir);
    if (nodeTime > 0) nodeTimes.push(nodeTime);
  }

  // Calcular médias
  const bunMedia = bunTimes.reduce((a, b) => a + b, 0) / bunTimes.length;
  const nodeMedia = nodeTimes.reduce((a, b) => a + b, 0) / nodeTimes.length;

  console.log("\n📊 RESULTADOS:");
  console.log(`🟠 BUN - Média: ${bunMedia.toFixed(0)}ms`);
  console.log(`🟢 NODE - Média: ${nodeMedia.toFixed(0)}ms`);

  if (bunMedia < nodeMedia) {
    const economia = ((nodeMedia - bunMedia) / nodeMedia * 100).toFixed(1);
    console.log(`\n🏆 BUN É ${economia}% MAIS RÁPIDO!`);
    console.log("✅ RECOMENDAÇÃO: Migrar para BUN");
  } else {
    const diferenca = ((bunMedia - nodeMedia) / nodeMedia * 100).toFixed(1);
    console.log(`\n🏆 NODE.JS é ${diferenca}% mais rápido`);
    console.log("✅ RECOMENDAÇÃO: Manter Node.js");
  }
}

benchmark();