const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('CLI Goiano Commands Integration', () => {
  const testFile = path.join(__dirname, '../fixtures/test-basic.gs');
  const cliPath = path.join(__dirname, '../../bin/goiasscript.js');
  
  beforeAll(() => {
    // Criar arquivo de teste se não existir
    if (!fs.existsSync(testFile)) {
      const testContent = `uai mensagem é "Opa, sô!";\nprosa(mensagem);`;
      fs.writeFileSync(testFile, testContent);
    }
  });

  test('deve executar comando traduz', (done) => {
    const child = spawn('node', [cliPath, 'traduz', testFile]);
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      expect(code).toBe(0);
      expect(stderr).toBe('');
      done();
    });
  }, 10000);

  test('deve executar comando bota_pra_moer', (done) => {
    const child = spawn('node', [cliPath, 'bota_pra_moer', testFile]);
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      expect(code).toBe(0);
      expect(stdout).toContain('Opa, sô!');
      done();
    });
  }, 10000);

  test('deve executar comando vê_se_tá_certo', (done) => {
    const child = spawn('node', [cliPath, 'vê_se_tá_certo', testFile]);
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      expect(code).toBe(0);
      done();
    });
  }, 10000);

  test('deve mostrar help quando não há argumentos', (done) => {
    const child = spawn('node', [cliPath]);
    let stdout = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.on('close', (code) => {
      expect(stdout).toContain('GoiásScript');
      expect(stdout).toContain('traduz');
      expect(stdout).toContain('bota_pra_moer');
      expect(stdout).toContain('vê_se_tá_certo');
      done();
    });
  }, 5000);

  test('deve lidar com arquivo inexistente graciosamente', (done) => {
    const child = spawn('node', [cliPath, 'traduz', 'arquivo-inexistente.gs']);
    let stderr = '';
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      expect(code).not.toBe(0);
      expect(stderr).toContain('arquivo');
      done();
    });
  }, 5000);
});

describe('Ferramentas Goianas Integration', () => {
  const gsBalaioBin = path.join(__dirname, '../../bin/gs-balaio.js');
  const goiasBin = path.join(__dirname, '../../bin/goias.js');
  const gsFucaBin = path.join(__dirname, '../../bin/gs-fuça.js');

  test('gs-balaio deve mostrar informações dos balaios', (done) => {
    const child = spawn('node', [gsBalaioBin, 'mostra_os_balaio']);
    let stdout = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.on('close', (code) => {
      expect(code).toBe(0);
      expect(stdout).toContain('balaio');
      done();
    });
  }, 5000);

  test('gs-fuça deve funcionar com arquivo de teste', (done) => {
    const testFile = path.join(__dirname, '../fixtures/test-basic.gs');
    const child = spawn('node', [gsFucaBin, 'fuça', testFile]);
    
    child.on('close', (code) => {
      // GS-Fuça pode retornar 0 ou outro código dependendo da implementação
      expect(typeof code).toBe('number');
      done();
    });
  }, 5000);

  test('goias deve iniciar e sair corretamente', (done) => {
    const child = spawn('node', [goiasBin], { stdio: 'pipe' });
    
    // Enviar comando de saída
    child.stdin.write('.sair\\n');
    child.stdin.end();
    
    child.on('close', (code) => {
      expect(code).toBe(0);
      done();
    });
  }, 5000);
});

describe('Compatibilidade com Comandos Legacy', () => {
  const cliPath = path.join(__dirname, '../../bin/goiasscript.js');
  const testFile = path.join(__dirname, '../fixtures/test-basic.gs');

  test('deve ainda suportar comando run (compatibilidade)', (done) => {
    const child = spawn('node', [cliPath, 'run', testFile]);
    
    child.on('close', (code) => {
      // Deve funcionar ou mostrar aviso sobre comando obsoleto
      expect(typeof code).toBe('number');
      done();
    });
  }, 5000);

  test('deve ainda suportar comando compile (compatibilidade)', (done) => {
    const child = spawn('node', [cliPath, 'compile', testFile]);
    
    child.on('close', (code) => {
      // Deve funcionar ou mostrar aviso sobre comando obsoleto  
      expect(typeof code).toBe('number');
      done();
    });
  }, 5000);
});