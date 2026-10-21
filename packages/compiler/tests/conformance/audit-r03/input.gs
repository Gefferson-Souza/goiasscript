faz_trem escapa(s) {
  faz_favor s.replace(/&/g, "&amp;").replace(/'/g, "&#39;").replace(/"/g, "&quot;");
}
prosa(escapa('a "b" ' + "c'd"));