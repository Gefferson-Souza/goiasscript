// Lista e mapeamento: dobra os número e separa os par, no goianês.

uai numeros é [1, 2, 3, 4, 5];
prosa("Os número:", numeros);

uai dobrados é numeros.mapear(n => n vezes 2);
prosa("Dobrados, sô:", dobrados);

uai pares é numeros.filtrar(n => n sobrou 2 é_igualim 0);
prosa("Só os par:", pares);

vai_indo (trem i é 0; i menor_que dobrados.length; i é i mais 1) {
  prosa("Item " mais i mais ": " mais dobrados[i]);
}
