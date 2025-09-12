const Compiler = require('./src/compiler');

const compiler = new Compiler();

const codigo = `
uai nome: texto é "GoiásScript"
uai versao: numero é 2.0
uai ativo: booleano é certeza
uai config: objeto é { debug: certeza, env: "dev" }

// Type annotation mismatch - should warn
uai idade: numero é "25"
uai lista: texto é [1, 2, 3]

presta_serviço saudar(usuario: texto) {
  prosa("Olá", usuario)
  faz_favor "Saudação enviada"
}

trem contador: numero é 0
contador é contador mais 1
contador é "agora é string"  // Type change warning

resultado é saudar(nome)
`;

console.log('🧪 Testando Sistema de Tipos GoiásScript\n');

const resultado = compiler.compile(codigo, 'teste_tipos.gs');

console.log('✅ Compilation Success:', resultado.success);
console.log('📊 Type Count:', resultado.typeInfo?.typeCount);

console.log('\n🔍 Symbol Table:');
if (resultado.typeInfo?.symbols) {
  Object.entries(resultado.typeInfo.symbols).forEach(([name, info]) => {
    console.log(`  ${name}: ${info.type} (${info.declarationType}) linha ${info.line}`);
  });
}

console.log('\n⚠️  Warnings:');
resultado.warnings?.forEach(warning => {
  if (warning.type) {
    console.log(`  ${warning.message}`);
    console.log(`  ${warning.suggestion}`);
  } else {
    console.log(`  ${warning}`);
  }
});

console.log('\n❌ Type Errors:');
resultado.typeInfo?.typeErrors?.forEach(error => {
  console.log(`  ${error.message}`);
  console.log(`  ${error.suggestion}`);
});

console.log('\n🚀 Generated JavaScript:');
console.log(resultado.javascript);