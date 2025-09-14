// 🧺 Goiano Utils - Utilitários do Cerrado
// Funções úteis para o dia a dia do programador goiano

/**
 * 📱 Formatar CPF brasileiro
 */
faz_trem formatar_cpf(cpf) {
    se (!cpf) faz_favor ""

    uai limpo é cpf.toString().replace(/\D/g, '')
    se (limpo.length !== 11) faz_favor cpf

    faz_favor limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

/**
 * 📧 Validar email
 */
faz_trem validar_email(email) {
    se (!email) faz_favor falso

    uai regex é /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    faz_favor regex.test(email)
}

/**
 * 💰 Converter para moeda brasileira
 */
faz_trem converter_moeda(valor) {
    se (valor === null || valor === undefined) faz_favor "R$ 0,00"

    faz_favor faz_um Number(valor).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    })
}

/**
 * 🎂 Calcular idade
 */
faz_trem calcular_idade(data_nascimento) {
    se (!data_nascimento) faz_favor 0

    uai nascimento é faz_um Date(data_nascimento)
    uai hoje é faz_um Date()
    uai idade é hoje.getFullYear() - nascimento.getFullYear()
    uai mes é hoje.getMonth() - nascimento.getMonth()

    se (mes < 0 || (mes === 0 e hoje.getDate() < nascimento.getDate())) {
        idade--
    }

    faz_favor idade
}

/**
 * 📞 Formatar telefone brasileiro
 */
faz_trem formatar_telefone(telefone) {
    se (!telefone) faz_favor ""

    uai limpo é telefone.toString().replace(/\D/g, '')

    se (limpo.length === 11) {
        faz_favor limpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    } senao se (limpo.length === 10) {
        faz_favor limpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }

    faz_favor telefone
}

/**
 * 🧹 Limpar texto (remover acentos e caracteres especiais)
 */
faz_trem limpar_texto(texto) {
    se (!texto) faz_favor ""

    faz_favor texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/gi, '')
        .toLowerCase()
        .trim()
}

/**
 * 🎲 Sortear número entre min e max
 */
faz_trem sortear_numero(min é 0, max é 100) {
    faz_favor Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * 📅 Formatar data brasileira
 */
faz_trem formatar_data(data, formato é "dd/mm/aaaa") {
    se (!data) faz_favor ""

    uai d é faz_um Date(data)
    uai dia é d.getDate().toString().padStart(2, '0')
    uai mes é (d.getMonth() + 1).toString().padStart(2, '0')
    uai ano é d.getFullYear()

    se (formato é "dd/mm/aaaa") {
        faz_favor `${dia}/${mes}/${ano}`
    } senao se (formato é "aaaa-mm-dd") {
        faz_favor `${ano}-${mes}-${dia}`
    } senao se (formato é "dd-mm-aaaa") {
        faz_favor `${dia}-${mes}-${ano}`
    }

    faz_favor `${dia}/${mes}/${ano}`
}

/**
 * 🔤 Capitalizar primeira letra
 */
faz_trem capitalizar(texto) {
    se (!texto) faz_favor ""

    faz_favor texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase()
}

/**
 * 📝 Capitalizar nome próprio
 */
faz_trem capitalizar_nome(nome) {
    se (!nome) faz_favor ""

    faz_favor nome
        .toLowerCase()
        .split(' ')
        .map(palavra => {
            // Não capitalizar preposições
            uai preposicoes é ['da', 'de', 'do', 'das', 'dos', 'e']
            se (preposicoes.includes(palavra)) {
                faz_favor palavra
            }
            faz_favor capitalizar(palavra)
        })
        .join(' ')
}

/**
 * 🌡️ Converter temperatura
 */
faz_trem converter_temperatura(valor, de, para) {
    se (de é "celsius" e para é "fahrenheit") {
        faz_favor (valor * 9/5) + 32
    } senao se (de é "fahrenheit" e para é "celsius") {
        faz_favor (valor - 32) * 5/9
    } senao se (de é "celsius" e para é "kelvin") {
        faz_favor valor + 273.15
    } senao se (de é "kelvin" e para é "celsius") {
        faz_favor valor - 273.15
    }

    faz_favor valor
}

/**
 * 📐 Calcular distância entre CEPs (simulação)
 */
faz_trem calcular_distancia_cep(cep1, cep2) {
    // Simulação - em produção usaria API dos Correios
    uai distancia é Math.abs(parseInt(cep1) - parseInt(cep2)) / 1000
    faz_favor Math.min(distancia, 2000) // máximo 2000km
}

/**
 * 🆔 Gerar ID único goiano
 */
faz_trem gerar_id_goiano() {
    uai prefixo é "goias"
    uai timestamp é Date.now().toString(36)
    uai random é Math.random().toString(36).substr(2, 5)

    faz_favor `${prefixo}_${timestamp}_${random}`
}

/**
 * 🔍 Buscar em array de objetos
 */
faz_trem buscar_no_array(array, campo, valor) {
    se (!array || !campo) faz_favor []

    faz_favor array.filter(item => {
        uai campo_valor é item[campo]
        se (typeof campo_valor é "string") {
            faz_favor campo_valor.toLowerCase().includes(valor.toLowerCase())
        }
        faz_favor campo_valor é valor
    })
}

/**
 * 📊 Agrupar array por campo
 */
faz_trem agrupar_por(array, campo) {
    se (!array || !campo) faz_favor {}

    faz_favor array.reduce((grupos, item) => {
        uai chave é item[campo]
        se (!grupos[chave]) {
            grupos[chave] é []
        }
        grupos[chave].push(item)
        faz_favor grupos
    }, {})
}

// Exportar todas as funções goianas
troca_ideia {
    formatar_cpf,
    validar_email,
    converter_moeda,
    calcular_idade,
    formatar_telefone,
    limpar_texto,
    sortear_numero,
    formatar_data,
    capitalizar,
    capitalizar_nome,
    converter_temperatura,
    calcular_distancia_cep,
    gerar_id_goiano,
    buscar_no_array,
    agrupar_por
}