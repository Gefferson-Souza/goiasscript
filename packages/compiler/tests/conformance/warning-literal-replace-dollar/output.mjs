console.log($gs_trocar("x", "x", "US$&"));
function $gs_trocar(text, search, replacement) {
  return String(text).replaceAll(String(search), () => String(replacement));
}