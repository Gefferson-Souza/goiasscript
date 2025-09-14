#!/usr/bin/env node
// Servidor de desenvolvimento GoiásScript
// Inspirado em React/Angular CLI

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const chokidar = require('chokidar');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const SRC_DIR = path.join(process.cwd(), 'src');

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Compilar GoiásScript para JavaScript
function compileGoiasScript() {
  console.log('🔧 Compilando GoiásScript...');
  
  const compile = spawn('goiasscript', ['traduz', 'src/app.gs'], {
    stdio: 'inherit'
  });
  
  compile.on('close', (code) => {
    if (code === 0) {
      // Copiar para public
      const srcJs = path.join(SRC_DIR, 'app.js');
      const destJs = path.join(PUBLIC_DIR, 'app.js');
      
      if (fs.existsSync(srcJs)) {
        fs.copyFileSync(srcJs, destJs);
        console.log('✅ GoiásScript compilado com sucesso!');
      }
    } else {
      console.error('❌ Erro na compilação do GoiásScript');
    }
  });
}

// Servidor HTTP
const server = http.createServer((req, res) => {
  let filePath = path.join(PUBLIC_DIR, req.url === '/' ? 'index.html' : req.url);
  
  // Security check
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  
  const extname = path.extname(filePath);
  const contentType = mimeTypes[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Fallback para index.html (SPA routing)
        fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (err, content) => {
          if (err) {
            res.writeHead(404);
            res.end('404 - Arquivo não encontrado');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
          }
        });
      } else {
        res.writeHead(500);
        res.end(`Erro do servidor: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Watch para auto-reload
if (fs.existsSync(SRC_DIR)) {
  console.log('👀 Observando mudanças em src/...');
  
  const watcher = chokidar.watch('src/**/*.gs', {
    persistent: true,
    ignoreInitial: true
  });
  
  let compileTimeout;
  
  watcher.on('change', (filePath) => {
    console.log(`📝 Arquivo modificado: ${filePath}`);
    
    // Debounce compilation
    clearTimeout(compileTimeout);
    compileTimeout = setTimeout(compileGoiasScript, 300);
  });
}

// Compilação inicial
compileGoiasScript();

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`
🚀 Servidor de desenvolvimento GoiásScript iniciado!

   Local:    http://localhost:${PORT}
   Diretório: ${PUBLIC_DIR}
   
   Ctrl+C para parar
   
🎯 Recursos ativados:
   ✅ Hot reload para arquivos .gs
   ✅ Compilação automática
   ✅ Servidor estático
   ✅ SPA routing
   
Desenvolvido com ❤️ em Goiás! 🇧🇷
`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Encerrando servidor de desenvolvimento...');
  server.close(() => {
    console.log('✅ Servidor encerrado com sucesso!');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
});