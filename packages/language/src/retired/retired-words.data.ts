import type { RetiredWord } from './retired-words.types.ts';

const GONE = 'saiu da linguagem, sem substituto na v3';

export const RETIRED_WORDS: readonly RetiredWord[] = [
  { word: 'presta_serviço', replacement: 'faz_trem', note: 'função se declara com faz_trem' },
  { word: 'vai_na_frente_presta_serviço', replacement: 'vai_na_frente_faz_trem', note: 'função assíncrona se declara com vai_na_frente_faz_trem' },
  { word: 'mexe_assim', note: 'método de classe não leva palavra; o construtor é aprepara_trem' },
  { word: 'vixe_que', replacement: 'vixe', note: 'vixe recebe a mensagem direto' },
  { word: 'vazio', replacement: 'nada', note: 'valor ausente é nada' },
  { word: 'sei_lá', replacement: 'indefinido', note: 'valor não definido é indefinido' },
  { word: 'se', replacement: 'se_ocê_quiser', note: 'condicional é se_ocê_quiser' },
  { word: 'senao', replacement: 'se_não', note: 'senão é se_não' },
  { word: 'fazer', replacement: 'faz_trem', note: 'função é faz_trem' },
  { word: 'é_igual_a', replacement: 'é_igualim', note: 'igualdade é é_igualim' },
  { word: 'um_tanto_de', note: GONE },
  { word: 'ninguem_fuça', note: GONE },
  { word: 'só_da_famia', note: GONE },
  { word: 'todo_mundo_vê', note: GONE },
];
