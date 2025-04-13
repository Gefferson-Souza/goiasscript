// Meu primeiro programa em GoiásScript!

uai saudacao = "Bão demais da conta!";

presta_serviço dizOi(nome) {
  prosa(saudacao + " " + nome);
  faz_favor nome + ", cê é da roça mesmo!";
}

prosa("Programa iniciado!");

trem contador = 1;
enquanto_tiver (contador menor_que 5) {
  prosa("Contando: " + contador);
  contador = contador mais 1;
}

uai resultado = dizOi("Gefferson-Souza");
prosa(resultado);