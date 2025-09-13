#!/usr/bin/env node

const { createConnection } = require('vscode-debugadapter');
const GoianoDebugAdapter = require('../src/debug/GoianoDebugAdapter');

// Create debug adapter
const adapter = new GoianoDebugAdapter();

// Create connection  
const connection = createConnection(adapter, process);

console.error('GoiásScript Debug Adapter iniciado');

// Handle connection events
connection.on('error', (error) => {
  console.error('Erro no Debug Adapter:', error);
});

connection.on('close', () => {
  console.error('Debug Adapter encerrado');
  process.exit(0);
});

// Start the adapter
connection.start();