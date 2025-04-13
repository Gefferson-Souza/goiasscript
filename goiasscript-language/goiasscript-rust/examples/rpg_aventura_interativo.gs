// RPG Aventura Interativa em GoiásScript
// Autor: Gefferson Souza
// Data: 13/04/2025

prosa("===== AVENTURA INTERATIVA EM GOIÁSSCRIPT =====");
prosa("Bem-vindo(a) à grande aventura em Goiás!");
prosa("");

prosa("Como você se chama, aventureiro(a)?");
var nome é ler_escolha();

prosa("Olá, " + nome + "! Você está prestes a iniciar uma jornada incrível.");
prosa("Você acorda em uma cabana no meio do cerrado goiano.");
prosa("O sol já está alto no céu e você precisa decidir o que fazer.");

prosa("");
prosa("O que deseja fazer agora?");
prosa("1 - Explorar a região ao redor");
prosa("2 - Ficar na cabana e descansar mais um pouco");
prosa("3 - Procurar mantimentos");

var escolha é ler_escolha();

se (escolha é "1") {
    prosa("Você decide explorar a região e após caminhar por algumas horas,");
    prosa("encontra uma antiga trilha de garimpeiros.");
    prosa("");
    prosa("Ao seguir a trilha, você se depara com uma bifurcação.");
    prosa("Para onde deseja ir?");
    prosa("1 - Seguir para o norte, em direção às montanhas");
    prosa("2 - Seguir para o leste, em direção a um rio");
    
    escolha é ler_escolha();
    
    se (escolha é "1") {
        prosa("Você segue em direção às montanhas e encontra uma caverna.");
        prosa("Dentro dela, brilha um pequeno cristal de quartzo.");
        prosa("Ao pegá-lo, você sente uma energia antiga e poderosa.");
        prosa("");
        prosa("Parabéns, " + nome + "! Você encontrou o lendário Cristal de Goiás.");
        prosa("Com ele, poderá trazer prosperidade para toda a região!");
    } senão {
        prosa("Você segue o caminho até o rio e encontra uma canoa antiga.");
        prosa("Ao descer o rio com ela, chega a uma pequena vila onde é recebido como herói,");
        prosa("pois todos acreditavam que a cabana estava abandonada há anos!");
        prosa("");
        prosa("Parabéns, " + nome + "! Você encontrou um novo lar e novos amigos.");
    }
} senão se (escolha é "2") {
    prosa("Você decide descansar mais um pouco na cabana.");
    prosa("Ao acordar novamente, já é fim de tarde e você percebe");
    prosa("um brilho estranho vindo do assoalho.");
    prosa("");
    prosa("Ao investigar, encontra um mapa escondido debaixo de uma tábua solta!");
    prosa("");
    prosa("O que deseja fazer com o mapa?");
    prosa("1 - Seguir para o local marcado com X");
    prosa("2 - Guardar o mapa para mais tarde");
    
    escolha é ler_escolha();
    
    se (escolha é "1") {
        prosa("Você segue o mapa até um antigo pé de pequi.");
        prosa("Ao cavar sob suas raízes, encontra uma caixa com");
        prosa("moedas de ouro da época dos bandeirantes!");
        prosa("");
        prosa("Parabéns, " + nome + "! Você encontrou um tesouro histórico!");
    } senão {
        prosa("Você guarda o mapa e decide explorar os arredores.");
        prosa("Acaba encontrando uma trilha que leva a uma bela cachoeira,");
        prosa("onde decide se refrescar e relaxar.");
        prosa("");
        prosa("Às vezes, " + nome + ", a verdadeira riqueza está nos momentos de paz.");
    }
} senão {
    prosa("Você procura por mantimentos na cabana e encontra");
    prosa("uma velha sacola com frutas desidratadas e uma garrafa d'água.");
    prosa("");
    prosa("Junto aos mantimentos, há um bilhete:");
    prosa("'Quem encontrar esta mensagem, procure pela árvore mais antiga do cerrado.'");
    prosa("");
    prosa("Você deseja seguir a pista do bilhete?");
    prosa("1 - Sim, vou procurar a árvore antiga");
    prosa("2 - Não, prefiro seguir meu próprio caminho");
    
    escolha é ler_escolha();
    
    se (escolha é "1") {
        prosa("Após horas de busca, você encontra um imenso jatobá centenário.");
        prosa("Em seu tronco há uma marca que indica uma direção.");
        prosa("Seguindo-a, você chega a uma comunidade isolada de artesãos,");
        prosa("que o recebem com alegria e o convidam para aprender suas técnicas.");
        prosa("");
        prosa("Parabéns, " + nome + "! Você descobriu um novo propósito e habilidades valiosas.");
    } senão {
        prosa("Você decide seguir seu próprio caminho e explora o cerrado.");
        prosa("Durante sua jornada, encontra plantas medicinais raras");
        prosa("e aprende a identificá-las com um velho curandeiro que conhece pelo caminho.");
        prosa("");
        prosa("Parabéns, " + nome + "! O conhecimento que adquiriu será valioso para muitas pessoas.");
    }
}

prosa("");
prosa("===== FIM DA AVENTURA =====");
prosa("Obrigado por jogar, " + nome + "!");
prosa("Esperamos que tenha gostado desta aventura pelo cerrado goiano.");