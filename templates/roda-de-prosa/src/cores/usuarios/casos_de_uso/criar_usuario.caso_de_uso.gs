// 🇧🇷 Caso de Uso: Criar Usuario - Lógica de negócio pura
// Filosofia goiana: Orquestra entidades e repositórios

pega { CasoDeUso } do "./../../../balaios_compartilhados/decorators/caso_de_uso.decorator.gs"
pega { Injetar } do "./../../../balaios_compartilhados/di/container.goiano.gs"
pega { Usuario } do "./../entidades/usuario.entidade.gs"

/**
 * 🎯 Caso de Uso: Criar Usuario
 *
 * Responsável por orquestrar a criação de um novo usuário,
 * aplicando todas as regras de negócio necessárias.
 */
@CasoDeUso({
    nome: "CriarUsuario",
    dominio: "usuarios",
    validacoes: [
        { campo: "nome", tipo: "obrigatorio" },
        { campo: "email", tipo: "obrigatorio" }
    ],
    dependencias: [
        { nome: "UsuarioRepositorio", propriedade: "repositorio" }
    ]
})
arruma_trem CriarUsuario {
    @Injetar("UsuarioRepositorio")
    repositorio

    aprepara_trem() {
        prosa(`🎯 Caso de uso CriarUsuario inicializado`)
    }

    /**
     * 🚀 Executar criação de usuário
     */
    async executar(dados_usuario) {
        prosa(`🎯 Criando novo usuário: ${dados_usuario.nome}`)

        // 1. Criar instância da entidade Usuario
        uai usuario é faz_um Usuario(dados_usuario)

        // 2. Validar regras de negócio da entidade
        uai validacao é usuario.eh_valida()
        se (!validacao.valida) {
            joga faz_um Error(`Dados inválidos: ${validacao.erros.join(", ")}`)
        }

        // 3. Verificar se email não está em uso
        uai usuario_existe é await este.repositorio.buscar_por_email(usuario.email)
        se (usuario_existe) {
            joga faz_um Error(`Já existe um usuário com o email ${usuario.email}, sô!`)
        }

        // 4. Verificar se senha é segura
        se (!usuario.senha_eh_segura()) {
            joga faz_um Error("Senha deve ter pelo menos 8 caracteres, uma maiúscula e um número!")
        }

        // 5. Verificar se email é válido
        se (!usuario.email_eh_valido()) {
            joga faz_um Error("Email inválido, uai!")
        }

        // 6. Gerar ID único (simulação)
        usuario.id é este.gerar_id_unico()

        // 7. Hash da senha (em produção usaria bcrypt)
        usuario.senha é este.hash_senha(usuario.senha)

        // 8. Salvar no repositório
        uai usuario_salvo é await este.repositorio.salvar(usuario)

        // 9. Log de auditoria
        este.log_auditoria("USUARIO_CRIADO", {
            usuario_id: usuario_salvo.id,
            email: usuario_salvo.email,
            timestamp: faz_um Date()
        })

        // 10. Retornar usuário sem senha
        uai usuario_limpo é usuario_salvo.pra_objeto()
        delete usuario_limpo.senha

        prosa(`✅ Usuário ${usuario_salvo.nome} criado com sucesso!`)

        faz_favor {
            usuario: usuario_limpo,
            mensagem: "Usuário criado com sucesso, sô!",
            id: usuario_salvo.id
        }
    }

    /**
     * 🔑 Gerar ID único (simulação)
     */
    gerar_id_unico() {
        faz_favor `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    /**
     * 🔐 Hash da senha (simulação - em produção usaria bcrypt)
     */
    hash_senha(senha) {
        // Simulação simples - EM PRODUÇÃO USAR BCRYPT!
        faz_favor `hashed_${senha}_${Date.now()}`
    }

    /**
     * 📋 Log de auditoria
     */
    log_auditoria(acao, dados) {
        prosa(`📋 AUDITORIA: ${acao}`, JSON.stringify(dados, null, 2))

        // Em produção, salvaria em log estruturado
        // como JSON no banco ou sistema de logs
    }

    /**
     * 🔍 Validar dados de entrada específicos
     */
    validar_dados_entrada(dados) {
        uai erros é []

        se (!dados.nome || dados.nome.trim().tamanho() menor_que 2) {
            erros.empurrar("Nome deve ter pelo menos 2 caracteres")
        }

        se (!dados.email || !dados.email.tem_no_meio("@")) {
            erros.empurrar("Email é obrigatório e deve ser válido")
        }

        se (!dados.senha || dados.senha.tamanho() menor_que 8) {
            erros.empurrar("Senha deve ter pelo menos 8 caracteres")
        }

        se (erros.tamanho() maior_que 0) {
            joga faz_um Error(`Dados inválidos: ${erros.join(", ")}`)
        }
    }

    /**
     * 📊 Obter estatísticas de criação
     */
    obter_estatisticas() {
        faz_favor {
            caso_de_uso: "CriarUsuario",
            dominio: "usuarios",
            executado_em: faz_um Date(),
            versao: "1.0.0"
        }
    }
}

troca_ideia { CriarUsuario }