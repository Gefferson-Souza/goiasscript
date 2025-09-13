const PackageManager = require('../../src/packages/PackageManager');
const fs = require('fs');
const path = require('path');

// Mock filesystem
jest.mock('fs');
jest.mock('fs-extra');

describe('PackageManager', () => {
  let packageManager;

  beforeEach(() => {
    packageManager = new PackageManager();
    jest.clearAllMocks();
  });

  describe('Package Discovery', () => {
    test('deve descobrir packages instalados', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue(['goiano-utils', 'goiano-http']);
      
      const packages = packageManager.listInstalledPackages();
      
      expect(packages).toHaveLength(2);
      expect(packages).toContain('goiano-utils');
      expect(packages).toContain('goiano-http');
    });

    test('deve retornar lista vazia quando não há packages', () => {
      fs.existsSync.mockReturnValue(false);
      
      const packages = packageManager.listInstalledPackages();
      
      expect(packages).toHaveLength(0);
    });
  });

  describe('Package Installation', () => {
    test('deve instalar package básico', async () => {
      const mockPackageInfo = {
        name: 'goiano-utils',
        version: '1.0.0',
        description: 'Utilitários goianos'
      };

      packageManager.getPackageInfo = jest.fn().mockResolvedValue(mockPackageInfo);
      fs.existsSync.mockReturnValue(false); // Package not exists
      fs.mkdirSync = jest.fn();
      fs.writeFileSync = jest.fn();

      const result = await packageManager.install('goiano-utils');

      expect(result.success).toBe(true);
      expect(result.packageName).toBe('goiano-utils');
    });

    test('deve falhar ao instalar package inexistente', async () => {
      packageManager.getPackageInfo = jest.fn().mockRejectedValue(new Error('Package not found'));

      const result = await packageManager.install('package-inexistente');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Package not found');
    });
  });

  describe('Package Creation', () => {
    test('deve criar estrutura de package', () => {
      fs.existsSync.mockReturnValue(false); // Directory doesn't exist
      fs.mkdirSync = jest.fn();
      fs.writeFileSync = jest.fn();

      const result = packageManager.createPackage('meu-package', {
        version: '1.0.0',
        description: 'Meu package goiano'
      });

      expect(result.success).toBe(true);
      expect(fs.mkdirSync).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    test('deve falhar ao criar package em diretório existente', () => {
      fs.existsSync.mockReturnValue(true); // Directory exists

      const result = packageManager.createPackage('meu-package');

      expect(result.success).toBe(false);
      expect(result.error).toContain('já existe');
    });
  });

  describe('Built-in Packages', () => {
    test('deve listar packages built-in disponíveis', () => {
      const builtinPackages = packageManager.getBuiltinPackages();

      expect(builtinPackages).toContain('goiano-utils');
      expect(builtinPackages).toContain('goiano-http');
      expect(builtinPackages).toContain('goiano-db');
    });

    test('deve verificar se package é built-in', () => {
      expect(packageManager.isBuiltinPackage('goiano-utils')).toBe(true);
      expect(packageManager.isBuiltinPackage('package-customizado')).toBe(false);
    });
  });

  describe('Package Information', () => {
    test('deve obter informações de package', async () => {
      const mockPackageInfo = {
        name: 'goiano-utils',
        version: '1.0.0',
        description: 'Utilitários goianos'
      };

      // Mock built-in package info
      const result = await packageManager.getPackageInfo('goiano-utils');

      expect(result).toBeDefined();
      expect(result.name).toBe('goiano-utils');
    });
  });

  describe('Error Handling', () => {
    test('deve lidar com erro de filesystem', () => {
      fs.readdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const packages = packageManager.listInstalledPackages();

      expect(packages).toHaveLength(0);
    });

    test('deve validar nome de package', () => {
      const result = packageManager.createPackage('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Nome do package é obrigatório');
    });
  });

  describe('Package Registry', () => {
    test('deve simular busca no registry', async () => {
      const result = await packageManager.searchPackages('goiano');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});