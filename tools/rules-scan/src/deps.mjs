import * as parser from '@babel/parser';
import traverseModule from '@babel/traverse';
import * as types from '@babel/types';

// O pacote CJS do traverse expõe a função em `.default` quando importado por ESM.
const traverse = traverseModule.default ?? traverseModule;

export const deps = { parser, traverse, types };
