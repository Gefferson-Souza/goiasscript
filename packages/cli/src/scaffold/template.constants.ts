export const MAIN_FILE_NAME = 'main.gs';

export const TEMPLATE_FILES = {
  'main.gs': 'uai nome é "mundo"\nprosa("Bão, sô! Olá, " mais nome)\n',
  'README.md': [
    '# Meu barraco',
    '',
    'Projeto armado com o GoiásScript, sô.',
    '',
    '## Pra botar pra moer',
    '',
    '```',
    'goiasscript bota_pra_moer main.gs',
    '```',
    '',
    '## Pra ver se tá certo',
    '',
    '```',
    'goiasscript vê_se_tá_certo main.gs',
    '```',
    '',
  ].join('\n'),
  '.gitignore': 'node_modules/\n*.mjs\n',
} as const;

export const NEXT_STEPS_HEADING = 'Próximos passos:';
export const NEXT_STEPS_INDENT = '  ';
export const RUN_COMMAND = `goiasscript bota_pra_moer ${MAIN_FILE_NAME}`;

export const SCAFFOLD_SUCCESS = {
  root: 'Barraco armado com sucesso, sô!',
  neutral: 'Projeto criado.',
} as const;
