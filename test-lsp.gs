// 🇧🇷 Arquivo de teste para Language Server Protocol
// Este arquivo deve mostrar diagnósticos e autocomplete

// ❌ Erro: usando = ao invés de é
uai nome = "João"

// ❌ Erro: usando console.log ao invés de prosa
console.log("Olá mundo")

// ❌ Erro: usando if ao invés de se
if (idade > 18) {
    prosa("Maior de idade")
}

// ❌ Erro: usando function ao invés de faz_trem
function somar(a, b) {
    return a + b
}

// ✅ Correto: sintaxe GoiásScript
uai idade é 25
trem contador é 0

se (idade maior_que 18) {
    prosa("Maior de idade!")
}

faz_trem calcular(a, b) {
    faz_favor a mais b
}

// ✅ Métodos goianos
uai texto é "Olá Mundo"
uai maiuscula é texto.gritando() // deve sugerir autocomplete
uai minuscula é texto.cochichando()

uai lista é [1, 2, 3]
lista.empurrar(4) // deve sugerir métodos goianos
uai tamanho é lista.tamanho()

// ✅ Framework decorators
@Componente({
    seletor: "teste-comp",
    template: `<div>Teste</div>`
})
arruma_trem TesteComponent {
    aprepara_trem() {
        prosa("Componente criado!")
    }
}

@Controlador("api/teste")
arruma_trem TesteController {
    @Pegar("/")
    listar() {
        faz_favor { mensagem: "Funcionando!" }
    }
}