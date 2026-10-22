console.log($gs_trocar("a.b.c", ".", "-"));
function $gs_trocar(text, search, replacement) {
  return String(text).replaceAll(String(search), () => String(replacement));
}