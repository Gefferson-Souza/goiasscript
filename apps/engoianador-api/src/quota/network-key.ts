import { ANONYMOUS_KEY } from './quota-ledger.constants';

const IPV4_OCTETS = 4;
const IPV4_OCTET_MAX = 255;
const IPV4_OCTET_PATTERN = /^\d{1,3}$/u;
const IPV6_GROUPS = 8;
const IPV6_PREFIX_GROUPS = 4;
const IPV6_GROUP_PATTERN = /^[0-9a-f]{1,4}$/iu;
const IPV6_GROUP_RADIX = 16;
const IPV6_GROUP_WIDTH = 4;
const IPV6_PREFIX_LENGTH = '/64';
const ZONE_SEPARATOR = '%';
const MAPPED_ZERO_GROUPS = 5;
const MAPPED_MARKER = 0xffff;
const BYTE_RANGE = 256;

function isIpv4(value: string): boolean {
  const octets = value.split('.');
  return (
    octets.length === IPV4_OCTETS &&
    octets.every((octet) => IPV4_OCTET_PATTERN.test(octet) && Number(octet) <= IPV4_OCTET_MAX)
  );
}

function ipv4ToGroups(value: string): readonly number[] | null {
  if (!isIpv4(value)) return null;
  const [a, b, c, d] = value.split('.').map(Number) as [number, number, number, number];
  return [a * BYTE_RANGE + b, c * BYTE_RANGE + d];
}

function parseGroupList(part: string): readonly number[] | null {
  if (part === '') return [];
  const items = part.split(':');
  const parsed = items.map((item, index) => {
    if (index === items.length - 1 && item.includes('.')) return ipv4ToGroups(item);
    return IPV6_GROUP_PATTERN.test(item) ? [Number.parseInt(item, IPV6_GROUP_RADIX)] : null;
  });
  return parsed.includes(null) ? null : parsed.flatMap((groups) => groups ?? []);
}

function expandIpv6(value: string): readonly number[] | null {
  const halves = value.split('::');
  if (halves.length > 2) return null;
  const head = parseGroupList(halves[0] ?? '');
  const tail = halves.length === 2 ? parseGroupList(halves[1] ?? '') : [];
  if (head === null || tail === null) return null;
  if (halves.length === 1) return head.length === IPV6_GROUPS ? head : null;
  const missing = IPV6_GROUPS - head.length - tail.length;
  return missing >= 1 ? [...head, ...Array.from({ length: missing }, () => 0), ...tail] : null;
}

function isMappedIpv4(groups: readonly number[]): boolean {
  return groups.slice(0, MAPPED_ZERO_GROUPS).every((group) => group === 0) && groups[MAPPED_ZERO_GROUPS] === MAPPED_MARKER;
}

function groupsToIpv4(high: number, low: number): string {
  return [Math.floor(high / BYTE_RANGE), high % BYTE_RANGE, Math.floor(low / BYTE_RANGE), low % BYTE_RANGE].join('.');
}

// O limite por rede vale para o /64 inteiro: quem tem um IPv6 controla o bloco todo.
export function networkKeyOf(ip: string): string {
  const address = ip.split(ZONE_SEPARATOR)[0] ?? '';
  if (isIpv4(address)) return address;
  const groups = expandIpv6(address);
  if (groups === null) return ANONYMOUS_KEY;
  if (isMappedIpv4(groups)) return groupsToIpv4(groups[6] ?? 0, groups[7] ?? 0);
  const prefix = groups.slice(0, IPV6_PREFIX_GROUPS).map((group) => group.toString(IPV6_GROUP_RADIX).padStart(IPV6_GROUP_WIDTH, '0'));
  return `${prefix.join(':')}${IPV6_PREFIX_LENGTH}`;
}
