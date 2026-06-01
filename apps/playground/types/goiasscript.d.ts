declare module 'goiasscript/browser' {
  export interface GoiasError {
    message: string;
    type?: string;
    line?: number;
    column?: number;
  }

  export interface TranspileWarning {
    type?: string;
    message: string;
    suggestion?: string;
  }

  export interface TranspileResult {
    success: boolean;
    code: string | null;
    error?: GoiasError;
    warnings?: TranspileWarning[];
    tokens?: unknown[];
  }

  export class GoiasScriptBrowserCompiler {
    constructor(options?: Record<string, unknown>);
    transpile(code: string, fileName?: string): TranspileResult;
    listarMetodosGoianos(): string[];
    listarTiposGoianos(): string[];
    ehMetodoProibido(metodo: string): boolean;
  }

  export class ErroGoiano extends Error {
    type?: string;
    line?: number;
    column?: number;
  }
}
