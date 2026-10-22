$gs_trocar("Oi sô", "Oi", "Eai");
[1, 2, 3].map(x => x * 2);
function $gs_trocar(text, search, replacement) {
  return String(text).replaceAll(String(search), () => String(replacement));
}