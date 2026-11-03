import { ImageResponse } from 'next/og';
import { currentSiteConfig } from '@/config/current-site-config';
import { COLORS } from '@/lib/design/design-tokens.constants';
import { SHARE_SNIPPET } from '@/lib/share-snippet.constants';

export const alt = 'GoiásScript — Goianês na Web';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Tipográfica de propósito: sem emoji para não depender de rede em build.
export default function OpengraphImage() {
  const { siteUrl } = currentSiteConfig();
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: COLORS.plane,
          padding: 72,
          fontFamily: 'monospace',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 76, fontWeight: 800 }}>
            <span style={{ color: COLORS.pequi }}>Goiás</span>
            <span style={{ color: COLORS.ink }}>Script</span>
            <span style={{ width: 8, height: 76, marginLeft: 10, background: COLORS.caret }} />
          </div>
          <div style={{ fontSize: 34, color: COLORS.ink, marginTop: 8 }}>
            Goianês na Web — escreve goianês, roda JavaScript
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: COLORS.panel,
            border: `2px solid ${COLORS.line}`,
            borderRadius: 16,
            padding: 28,
            fontSize: 30,
            color: COLORS.ink,
          }}
        >
          {SHARE_SNIPPET.split('\n').map((line, index) => (
            <span key={index} style={{ whiteSpace: 'pre' }}>
              {line}
            </span>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 26,
            color: COLORS.dim,
          }}
        >
          <span>Feito com carinho em Goiás</span>
          <span>{siteUrl === null ? '' : new URL(siteUrl).host}</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
