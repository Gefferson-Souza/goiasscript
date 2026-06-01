import { ImageResponse } from 'next/og';

export const alt = 'GoiásScript — Goianês na Web';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Tipográfica de propósito: sem emoji para não depender de rede em build.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0d1117',
          padding: 72,
          fontFamily: 'monospace',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 76, fontWeight: 800, color: '#f5c518' }}>
            GoiásScript
          </div>
          <div style={{ fontSize: 34, color: '#e6edf3', marginTop: 8 }}>
            Goianês na Web — escreve goianês, roda JavaScript
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: '#161b22',
            border: '2px solid #30363d',
            borderRadius: 16,
            padding: 28,
            fontSize: 30,
            color: '#e6edf3',
          }}
        >
          <span style={{ color: '#1f7a3d' }}>uai</span> saudacao{' '}
          <span style={{ color: '#1f7a3d' }}>é</span>{' '}
          <span style={{ color: '#f5c518' }}>&quot;bão demais da conta!&quot;</span>
          <span style={{ marginTop: 6 }}>prosa(saudacao)</span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 26,
            color: 'rgba(230,237,243,0.6)',
          }}
        >
          <span>Feito com carinho em Goiás</span>
          <span>playground.goiasscript.com.br</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
