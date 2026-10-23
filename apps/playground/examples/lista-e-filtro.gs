// Lista: dobra os número, separa os par e junta tudo numa prosa só.

uai numeros é [1, 2, 3, 4, 5];
uai dobrados é numeros.mapear(n => n vezes 2);
uai pares é numeros.filtrar(n => n sobrou 2 é_igualim 0);

prosa("Dobrados, sô: " mais dobrados.ajunta(", "));
prosa("Só os par: " mais pares.ajunta(", "));

vai_indo (uai n de numeros) {
  prosa("Item " mais n);
}
