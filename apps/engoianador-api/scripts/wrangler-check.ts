import { parse } from 'smol-toml';
import {
  AI_BINDING,
  CACHE_KV_BINDING,
  DURABLE_OBJECT_BINDING,
  DURABLE_OBJECT_CLASS,
  INTEGER_VARIABLES,
  LOCAL_ORIGIN_PATTERN,
  PLACEHOLDER_MARKER,
  POSITIVE_INTEGER_PATTERN,
} from './wrangler-check.constants.ts';

type Table = Readonly<Record<string, unknown>>;

function asTable(value: unknown): Table {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Table) : {};
}

function asTables(value: unknown): readonly Table[] {
  return Array.isArray(value) ? value.map(asTable) : [];
}

function checkVariables(vars: Table): readonly string[] {
  return INTEGER_VARIABLES.filter((name) => {
    const raw = vars[name];
    return !(typeof raw === 'string' && POSITIVE_INTEGER_PATTERN.test(raw.trim()));
  }).map((name) => `${name} tem que ser um número inteiro maior que zero, sô.`);
}

function checkProductionOrigins(vars: Table): readonly string[] {
  const origins = vars['ALLOWED_ORIGINS'];
  return typeof origins === 'string' && LOCAL_ORIGIN_PATTERN.test(origins)
    ? ['ALLOWED_ORIGINS de produção não pode ter origem local; mova a origem local para [env.dev], sô.']
    : [];
}

function checkDurableObject(config: Table): readonly string[] {
  const bindings = asTables(asTable(config['durable_objects'])['bindings']);
  const hasBinding = bindings.some((binding) => binding['name'] === DURABLE_OBJECT_BINDING && binding['class_name'] === DURABLE_OBJECT_CLASS);
  const hasMigration = asTables(config['migrations']).some((migration) => {
    const classes = migration['new_sqlite_classes'];
    return Array.isArray(classes) && classes.includes(DURABLE_OBJECT_CLASS);
  });
  return [
    ...(hasBinding ? [] : [`Falta o binding ${DURABLE_OBJECT_BINDING} apontando para ${DURABLE_OBJECT_CLASS} em [[durable_objects.bindings]], sô.`]),
    ...(hasMigration ? [] : [`A migração tem que declarar ${DURABLE_OBJECT_CLASS} em new_sqlite_classes, sô.`]),
  ];
}

function checkCacheNamespace(config: Table): readonly string[] {
  const namespace = asTables(config['kv_namespaces']).find((entry) => entry['binding'] === CACHE_KV_BINDING);
  if (namespace === undefined) return [`Falta o KV ${CACHE_KV_BINDING} em [[kv_namespaces]], sô.`];
  const id = namespace['id'];
  if (typeof id !== 'string' || id.trim() === '' || id.includes(PLACEHOLDER_MARKER)) {
    return [`O id do KV ${CACHE_KV_BINDING} ainda é marcador: crie o namespace e cole o id verdadeiro, sô.`];
  }
  return [];
}

function checkAiBinding(config: Table): readonly string[] {
  return asTable(config['ai'])['binding'] === AI_BINDING ? [] : [`Falta o binding ${AI_BINDING} na seção [ai], sô.`];
}

export function checkWranglerConfig(tomlText: string): readonly string[] {
  let config: Table;
  try {
    config = asTable(parse(tomlText));
  } catch {
    return ['O wrangler.toml não é um TOML válido, sô.'];
  }
  return [
    ...checkVariables(asTable(config['vars'])),
    ...checkProductionOrigins(asTable(config['vars'])),
    ...checkDurableObject(config),
    ...checkCacheNamespace(config),
    ...checkAiBinding(config),
  ];
}
