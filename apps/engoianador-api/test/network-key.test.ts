import { describe, expect, it } from 'vitest';
import { ANONYMOUS_KEY } from '../src/quota/quota-ledger.constants';
import { networkKeyOf } from '../src/quota/network-key';

describe('networkKeyOf', () => {
  it('mantém o IPv4 inteiro', () => {
    expect(networkKeyOf('203.0.113.7')).toBe('203.0.113.7');
    expect(networkKeyOf('203.0.113.8')).not.toBe(networkKeyOf('203.0.113.7'));
  });

  it('IPv6 do mesmo /64 gera a mesma chave', () => {
    const first = networkKeyOf('2001:db8:1:2:aaaa:bbbb:cccc:dddd');
    expect(networkKeyOf('2001:0DB8:0001:0002::1')).toBe(first);
    expect(networkKeyOf('2001:db8:1:2:ffff:ffff:ffff:ffff')).toBe(first);
  });

  it('IPv6 de /64 diferentes gera chaves diferentes', () => {
    expect(networkKeyOf('2001:db8:1:2::1')).not.toBe(networkKeyOf('2001:db8:1:3::1'));
    expect(networkKeyOf('2001:db8:1:2::1')).not.toBe(networkKeyOf('2001:db9:1:2::1'));
  });

  it('expande o :: antes de cortar o prefixo', () => {
    expect(networkKeyOf('2001:db8::1')).toBe(networkKeyOf('2001:db8:0:0:5:6:7:8'));
    expect(networkKeyOf('::1')).toBe(networkKeyOf('0:0:0:0:0:0:0:2'));
  });

  it('IPv4 mapeado em IPv6 usa o IPv4', () => {
    expect(networkKeyOf('::ffff:203.0.113.7')).toBe(networkKeyOf('203.0.113.7'));
    expect(networkKeyOf('::ffff:cb00:7107')).toBe(networkKeyOf('203.0.113.7'));
  });

  it('entrada inválida vira anon', () => {
    for (const bad of ['', 'abc', '999.1.1.1', '1.2.3', '1.2.3.4.5', '2001:db8:::1', '1:2:3:4:5:6:7:8:9', 'g::1', '1::2::3']) {
      expect(networkKeyOf(bad)).toBe(ANONYMOUS_KEY);
    }
  });

  it('ignora o identificador de zona do IPv6', () => {
    expect(networkKeyOf('fe80::1%eth0')).toBe(networkKeyOf('fe80::2'));
  });
});
