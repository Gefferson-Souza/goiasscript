#!/usr/bin/env node

import path from 'path';
import fs from 'fs';
import express from 'express';
import chokidar from 'chokidar';
import { WebSocketServer } from 'ws';
import http from 'http';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 🇧🇷 GoiásScript Dev Server com Hot Reload
 * Sistema de desenvolvimento moderno para aplicações GoiásScript
 */
class GoiasDevServer {
  constructor() {
    this.app = express();
    this.server = null;
    this.wss = null;
    this.port = 3000;
    this.distPath = path.resolve('./dist');
    this.srcPath = path.resolve('./src');
    this.publicPath = path.resolve('./public');

    this.setupExpress();
    this.setupWebSocket();
    this.setupFileWatcher();
  }

  setupExpress() {
    // CORS para desenvolvimento
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });

    // Servir arquivos estáticos
    this.app.use(express.static(this.distPath));
    this.app.use('/public', express.static(this.publicPath));

    // Rota para hot reload script
    this.app.get('/hot-reload.js', (req, res) => {
      res.type('application/javascript');
      res.send(this.getHotReloadScript());
    });

    // SPA fallback - sempre retorna index.html
    this.app.get('*', (req, res) => {
      const indexPath = path.join(this.distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('🤠 Eita sô! Página não encontrada. Execute <code>npm run build</code> primeiro.');
      }
    });
  }

  setupWebSocket() {
    const server = http.createServer(this.app);
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws) => {
      console.log('🔌 Cliente conectado ao hot reload');

      ws.on('close', () => {
        console.log('🔌 Cliente desconectado do hot reload');
      });
    });

    this.server = server;
  }

  setupFileWatcher() {
    // Observar mudanças nos arquivos .gs
    const watcher = chokidar.watch([
      path.join(this.srcPath, '**/*.gs'),
      path.join(this.publicPath, '**/*'),
      './tailwind.config.js',
      './goias.config.js'
    ], {
      ignored: /node_modules/,
      persistent: true
    });

    watcher.on('change', (filePath) => {
      console.log(`🔄 Arquivo alterado: ${path.relative('.', filePath)}`);
      this.rebuild();
    });

    watcher.on('add', (filePath) => {
      console.log(`➕ Arquivo adicionado: ${path.relative('.', filePath)}`);
      this.rebuild();
    });

    watcher.on('unlink', (filePath) => {
      console.log(`🗑️ Arquivo removido: ${path.relative('.', filePath)}`);
      this.rebuild();
    });
  }

  async rebuild() {
    console.log('🔧 Recompilando projeto GoiásScript...');

    try {
      // Executar build
      const buildProcess = spawn('node', ['scripts/build.js'], {
        stdio: 'inherit'
      });

      buildProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Build concluído com sucesso!');
          this.notifyClients('reload');
        } else {
          console.log('❌ Erro no build - verifique o código');
          this.notifyClients('error', 'Build falhou');
        }
      });

    } catch (error) {
      console.error('❌ Erro durante rebuild:', error.message);
      this.notifyClients('error', error.message);
    }
  }

  notifyClients(type, data = null) {
    const message = JSON.stringify({ type, data, timestamp: Date.now() });

    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  getHotReloadScript() {
    return `
// 🇧🇷 GoiásScript Hot Reload Client
(function() {
  const ws = new WebSocket('ws://localhost:${this.port}');

  ws.onopen = function() {
    console.log('🔥 Hot reload conectado!');
  };

  ws.onmessage = function(event) {
    const message = JSON.parse(event.data);

    switch(message.type) {
      case 'reload':
        console.log('🔄 Recarregando página...');
        window.location.reload();
        break;

      case 'error':
        console.error('❌ Erro no build:', message.data);
        break;

      case 'css-update':
        // Atualizar CSS sem reload
        const links = document.querySelectorAll('link[rel="stylesheet"]');
        links.forEach(link => {
          const href = link.getAttribute('href');
          link.setAttribute('href', href + '?t=' + Date.now());
        });
        break;
    }
  };

  ws.onclose = function() {
    console.log('🔌 Hot reload desconectado');
    // Tentar reconectar em 3 segundos
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  };

  ws.onerror = function(error) {
    console.error('❌ Erro no WebSocket:', error);
  };
})();
`;
  }

  async start() {
    // Build inicial
    console.log('🚀 Iniciando GoiásScript Dev Server...');

    try {
      // Verificar se existe build
      if (!fs.existsSync(this.distPath)) {
        console.log('📦 Criando build inicial...');
        await this.rebuild();
      }

      this.server.listen(this.port, () => {
        console.log('');
        console.log('🎉 GoiásScript Dev Server rodando!');
        console.log('');
        console.log(`📱 Local:    http://localhost:${this.port}`);
        console.log(`🌍 Network:  http://0.0.0.0:${this.port}`);
        console.log('');
        console.log('🔥 Hot reload ativado');
        console.log('🎨 TailwindCSS integrado');
        console.log('📦 Build automático configurado');
        console.log('');
        console.log('💡 Dica: Edite seus arquivos .gs e veja as mudanças instantaneamente!');
        console.log('🛑 Para parar: Ctrl+C');
        console.log('');
      });

    } catch (error) {
      console.error('❌ Erro ao iniciar servidor:', error);
      process.exit(1);
    }
  }
}

// Iniciar servidor se executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new GoiasDevServer();
  server.start();
}

export default GoiasDevServer;