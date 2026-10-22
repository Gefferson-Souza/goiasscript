import { describe, expect, it } from 'vitest';
import { launch } from '../src/bootstrap/launch.ts';
import type { CliEntryPoints, LaunchDependencies } from '../src/bootstrap/launch.types.ts';

const okCli: CliEntryPoints = { runGoiasScript: () => Promise.resolve(0), runGoias: () => Promise.resolve(0) };

function setup(nodeVersion: string, loadCli: () => Promise<CliEntryPoints>) {
  const errors: string[] = [];
  const codes: number[] = [];
  const dependencies: LaunchDependencies = {
    nodeVersion,
    loadCli,
    writeError: (text) => void errors.push(text),
    setExitCode: (code) => void codes.push(code),
  };
  return { dependencies, errors, codes };
}

describe('launch', () => {
  it('repassa o código de saída do CLI carregado', async () => {
    const { dependencies, errors, codes } = setup('22.12.0', () => Promise.resolve(okCli));
    await launch(dependencies, () => Promise.resolve(3));
    expect({ errors, codes }).toEqual({ errors: [], codes: [3] });
  });

  it('avisa em goianês quando o bundle não carrega num Node antigo', async () => {
    const { dependencies, errors, codes } = setup('12.22.0', () => Promise.reject(new SyntaxError('Unexpected reserved word')));
    await launch(dependencies, () => Promise.resolve(0));
    expect(errors).toEqual(['aviso GS0904: Seu Node é antigo, sô. Precisa do 22.12 ou mais.\n']);
    expect(codes).toEqual([2]);
  });

  it('não esconde falha de carga num Node suportado', async () => {
    const { dependencies, errors } = setup('22.12.0', () => Promise.reject(new Error('módulo sumiu')));
    await expect(launch(dependencies, () => Promise.resolve(0))).rejects.toThrow('módulo sumiu');
    expect(errors).toEqual([]);
  });
});
