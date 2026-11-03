interface FontLoader {
  readonly load: (font: string) => Promise<unknown>;
}

const PROBE_SIZE = '16px';

/**
 * O Monaco mede a largura dos caracteres ao nascer; se a fonte própria chega depois,
 * cursor e seleção desalinham. Remede quando ela carrega (ou falha e fica a reserva).
 */
export async function remeasureWhenFontLoads(fonts: FontLoader, family: string, remeasure: () => void): Promise<void> {
  // Falhar no download não é erro aqui: o editor segue com a fonte de reserva e remedir alinha o cursor com ela.
  await fonts.load(`${PROBE_SIZE} ${family}`).then(
    () => true,
    () => false,
  );
  remeasure();
}
