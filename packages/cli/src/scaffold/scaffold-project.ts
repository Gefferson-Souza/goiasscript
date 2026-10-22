import { CliFileError } from '../cli-file-error.ts';
import type { CliIo } from '../io.types.ts';
import { printableName } from '../paths/display-text.ts';
import { OUTPUT_REASON, PATH_CODE } from '../paths/paths.constants.ts';
import type { ScaffoldResult } from './scaffold.types.ts';
import { TEMPLATE_FILES } from './template.constants.ts';

const failure = (detail: string): ScaffoldResult => ({ ok: false, code: PATH_CODE.usage, detail });

// A falha original é a que importa ao usuário; a limpeza é só melhor esforço.
async function discardDirectory(name: string, io: CliIo): Promise<boolean> {
  try {
    await io.fs.remove(name);
    return true;
  } catch {
    return false;
  }
}

async function writeTemplate(name: string, io: CliIo): Promise<ScaffoldResult> {
  try {
    for (const [fileName, content] of Object.entries(TEMPLATE_FILES)) {
      await io.fs.writeText(io.env.path.join(name, fileName), content, 'create-new');
    }
    return { ok: true };
  } catch {
    const discarded = await discardDirectory(name, io);
    const outcome = discarded ? 'então apaguei o que tinha criado' : 'e não consegui apagar o que tinha criado';
    return failure(`não deu pra gravar os arquivos de "${printableName(name)}", ${outcome}`);
  }
}

export async function scaffoldProject(name: string, io: CliIo): Promise<ScaffoldResult> {
  try {
    await io.fs.makeDirectory(name);
  } catch (error) {
    if (error instanceof CliFileError && error.code === 'EEXIST') {
      return { ok: false, code: PATH_CODE.outputRefused, detail: OUTPUT_REASON.exists, args: { reason: OUTPUT_REASON.exists } };
    }
    return failure(`não deu pra criar a pasta "${printableName(name)}"`);
  }
  return writeTemplate(name, io);
}
