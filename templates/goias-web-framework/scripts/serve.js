#!/usr/bin/env node

import path from 'path';
import fs from 'fs';
import express from 'express';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 🇧🇷 GoiásScript Production Server
 * Servidor simples para produção
 */
class GoiasProductionServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.distPath = path.resolve('./dist');

    this.setupExpress();
  }

  setupExpress() {
    console.log('🚀 Configurando servidor de produção...');

    // Servir arquivos estáticos
    this.app.use(express.static(this.distPath));

    // SPA fallback - sempre retorna index.html
    this.app.get('*', (req, res) => {
      const indexPath = path.join(this.distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send(`
          <h1>🤠 Eita sô! Build não encontrado</h1>
          <p>Execute <code>npm run build</code> antes de rodar o servidor.</p>
        `);
      }
    });
  }

  async start() {
    // Verificar se dist existe
    if (!fs.existsSync(this.distPath)) {
      console.log('❌ Pasta dist/ não encontrada!');
      console.log('💡 Execute "npm run build" primeiro');
      process.exit(1);
    }

    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        console.log('✅ Servidor GoiásScript rodando!');
        console.log(`🌐 http://localhost:${this.port}`);
        console.log(`📁 Servindo: ${this.distPath}`);
        resolve(this.server);
      });
    });
  }

  async stop() {
    if (this.server) {
      await new Promise((resolve) => {
        this.server.close(() => {
          console.log('🛑 Servidor parado');
          resolve();
        });
      });
    }
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new GoiasProductionServer();

  server.start().catch((error) => {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Parando servidor...');
    await server.stop();
    process.exit(0);
  });
}

export default GoiasProductionServer;