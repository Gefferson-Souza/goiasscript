// 🇧🇷 Entidade Usuario - Coração do domínio de usuários
// Filosofia goiana: Entidade pura sem dependências externas

pega { Entidade } do "./../../../balaios_compartilhados/decorators/entidade.decorator.gs"

/**
 * 👤 Entidade Usuario
 *
 * Representa um usuário no domínio da aplicação.
 * Contém as regras de negócio fundamentais sobre usuários.
 */
@Entidade({
    nome: "Usuario",
    tabela: "usuarios",
    validacoes: [
        { campo: "nome", tipo: "obrigatorio" },
        { campo: "email", tipo: "obrigatorio" },
        { campo: "email", tipo: "email" }
    ],
    relacionamentos: [
        { tipo: "tem_muitos", entidade: "Produto", chave: "usuario_id" }
    ]
})
arruma_trem Usuario {
    aprepara_trem(dados é {}) {
        este.id é dados.id || null
        este.nome é dados.nome || ""
        este.email é dados.email || ""
        este.senha é dados.senha || ""
        este.ativo é dados.ativo !== undefined ? dados.ativo : verdadeiro
        este.data_criacao é dados.data_criacao || faz_um Date()
        este.data_atualizacao é dados.data_atualizacao || faz_um Date()
    }

    /**
     * 🔒 Verificar se senha é segura
     */
    senha_eh_segura() {
        se (este.senha.tamanho() menor_que 8) {
            faz_favor falso
        }

        // Deve ter pelo menos uma letra maiúscula
        se (!este.senha.match(/[A-Z]/)) {
            faz_favor falso
        }

        // Deve ter pelo menos um número
        se (!este.senha.match(/[0-9]/)) {
            faz_favor falso
        }

        faz_favor verdadeiro
    }

    /**
     * 📧 Verificar se email é válido
     */
    email_eh_valido() {
        uai regex é /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        faz_favor regex.test(este.email)
    }

    /**
     * 🚀 Ativar usuário
     */
    ativar() {
        este.ativo é verdadeiro
        este.data_atualizacao é faz_um Date()
        prosa(`✅ Usuário ${este.nome} foi ativado!`)
    }

    /**
     * 🛑 Desativar usuário
     */
    desativar() {
        este.ativo é falso
        este.data_atualizacao é faz_um Date()
        prosa(`🛑 Usuário ${este.nome} foi desativado!`)
    }

    /**
     * 📝 Atualizar dados do usuário
     */
    atualizar_dados(novos_dados) {
        se (novos_dados.nome) {
            este.nome é novos_dados.nome
        }

        se (novos_dados.email) {
            se (!novos_dados.email.tem_no_meio("@")) {
                joga faz_um Error("Email inválido, sô!")
            }
            este.email é novos_dados.email
        }

        este.data_atualizacao é faz_um Date()
        prosa(`📝 Dados do usuário ${este.nome} atualizados!`)
    }

    /**
     * 🔐 Alterar senha
     */
    alterar_senha(senha_nova, senha_atual) {
        // Em produção, verificaria a senha atual com hash
        se (este.senha !== senha_atual) {
            joga faz_um Error("Senha atual incorreta, uai!")
        }

        este.senha é senha_nova

        se (!este.senha_eh_segura()) {
            joga faz_um Error("Senha deve ter pelo menos 8 caracteres, uma maiúscula e um número!")
        }

        este.data_atualizacao é faz_um Date()
        prosa(`🔐 Senha do usuário ${este.nome} foi alterada!`)
    }

    /**
     * 📊 Obter estatísticas do usuário
     */
    obter_estatisticas() {
        uai dias_desde_criacao é Math.floor((faz_um Date() - este.data_criacao) / (1000 * 60 * 60 * 24))

        faz_favor {
            id: este.id,
            nome: este.nome,
            ativo: este.ativo,
            dias_desde_criacao: dias_desde_criacao,
            email_valido: este.email_eh_valido(),
            senha_segura: este.senha_eh_segura(),
            ultima_atualizacao: este.data_atualizacao
        }
    }

    /**
     * 🎨 Representação amigável
     */
    toString() {
        uai status é este.ativo ? "🟢" : "🔴"
        faz_favor `${status} Usuario: ${este.nome} (${este.email})`
    }
}

troca_ideia { Usuario }