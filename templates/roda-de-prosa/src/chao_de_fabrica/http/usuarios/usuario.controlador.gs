// 🇧🇷 Controlador Usuario - Porta de entrada HTTP
// Filosofia goiana: Conecta o mundo externo com os casos de uso

pega { Controlador, Pegar, Postar, Atualizar, Deletar } do "./../../../balaios_compartilhados/decorators/controlador.decorator.gs"
pega { Injetar } do "./../../../balaios_compartilhados/di/container.goiano.gs"

/**
 * 🌐 Controlador Usuario
 *
 * Gerencia todas as operações HTTP relacionadas a usuários.
 * Conecta requisições HTTP aos casos de uso do domínio.
 */
@Controlador({
    rota: "/api/v1/usuarios",
    versao: "v1",
    cors: verdadeiro,
    middlewares: ["auth", "rate-limit"]
})
arruma_trem UsuarioControlador {
    @Injetar("CriarUsuario")
    criar_usuario_caso_de_uso

    @Injetar("BuscarUsuario")
    buscar_usuario_caso_de_uso

    @Injetar("AtualizarUsuario")
    atualizar_usuario_caso_de_uso

    @Injetar("DeletarUsuario")
    deletar_usuario_caso_de_uso

    aprepara_trem() {
        prosa(`🌐 Controlador Usuario inicializado na rota /api/v1/usuarios`)
    }

    /**
     * 📋 Listar todos os usuários
     * GET /api/v1/usuarios
     */
    @Pegar("/")
    async listar(req, res) {
        tenta {
            prosa(`📋 Listando usuários - Query: ${JSON.stringify(req.query)}`)

            uai filtros é {
                pagina: parseInt(req.query.pagina) || 1,
                limite: parseInt(req.query.limite) || 10,
                ativo: req.query.ativo ? req.query.ativo é "true" : null,
                busca: req.query.busca || null
            }

            uai resultado é await este.buscar_usuario_caso_de_uso.executar({
                tipo: "listar",
                filtros: filtros
            })

            res.status(200).json(este.resposta_de_sucesso(resultado, "Usuários listados com sucesso!"))

        } pega (erro) {
            prosa(`❌ Erro ao listar usuários: ${erro.message}`)
            res.status(500).json(este.resposta_de_erro(erro))
        }
    }

    /**
     * 🔍 Buscar usuário por ID
     * GET /api/v1/usuarios/:id
     */
    @Pegar("/:id")
    async buscar_por_id(req, res) {
        tenta {
            uai id é req.params.id

            se (!id) {
                faz_favor res.status(400).json(este.resposta_de_erro(
                    faz_um Error("ID do usuário é obrigatório, sô!"), 400
                ))
            }

            prosa(`🔍 Buscando usuário por ID: ${id}`)

            uai usuario é await este.buscar_usuario_caso_de_uso.executar({
                tipo: "por_id",
                id: id
            })

            se (!usuario) {
                faz_favor res.status(404).json(este.resposta_de_erro(
                    faz_um Error("Usuário não encontrado, uai!"), 404
                ))
            }

            res.status(200).json(este.resposta_de_sucesso(usuario, "Usuário encontrado!"))

        } pega (erro) {
            prosa(`❌ Erro ao buscar usuário: ${erro.message}`)
            res.status(500).json(este.resposta_de_erro(erro))
        }
    }

    /**
     * ➕ Criar novo usuário
     * POST /api/v1/usuarios
     */
    @Postar("/")
    async criar(req, res) {
        tenta {
            prosa(`➕ Criando novo usuário`)

            // Validar dados obrigatórios
            este.validar_dados(req, [
                { campo: "nome", obrigatorio: verdadeiro },
                { campo: "email", obrigatorio: verdadeiro, tipo: "email" },
                { campo: "senha", obrigatorio: verdadeiro }
            ])

            uai dados_usuario é {
                nome: req.body.nome.trim(),
                email: req.body.email.trim().cochichando(),
                senha: req.body.senha
            }

            uai resultado é await este.criar_usuario_caso_de_uso.executar(dados_usuario)

            res.status(201).json(este.resposta_de_sucesso(
                resultado,
                "Usuário criado com sucesso, sô!"
            ))

        } pega (erro) {
            prosa(`❌ Erro ao criar usuário: ${erro.message}`)

            uai codigo é 500
            se (erro.message.tem_no_meio("já existe") || erro.message.tem_no_meio("email")) {
                codigo é 409 // Conflict
            }
            senao se (erro.message.tem_no_meio("inválido") || erro.message.tem_no_meio("obrigatório")) {
                codigo é 400 // Bad Request
            }

            res.status(codigo).json(este.resposta_de_erro(erro, codigo))
        }
    }

    /**
     * ✏️ Atualizar usuário
     * PUT /api/v1/usuarios/:id
     */
    @Atualizar("/:id")
    async atualizar(req, res) {
        tenta {
            uai id é req.params.id
            prosa(`✏️ Atualizando usuário: ${id}`)

            se (!id) {
                faz_favor res.status(400).json(este.resposta_de_erro(
                    faz_um Error("ID do usuário é obrigatório!"), 400
                ))
            }

            uai dados_atualizacao é {}

            // Apenas campos presentes no body
            se (req.body.nome) dados_atualizacao.nome é req.body.nome.trim()
            se (req.body.email) dados_atualizacao.email é req.body.email.trim().cochichando()
            se (req.body.ativo !== undefined) dados_atualizacao.ativo é req.body.ativo

            uai resultado é await este.atualizar_usuario_caso_de_uso.executar({
                id: id,
                dados: dados_atualizacao
            })

            res.status(200).json(este.resposta_de_sucesso(
                resultado,
                "Usuário atualizado com sucesso!"
            ))

        } pega (erro) {
            prosa(`❌ Erro ao atualizar usuário: ${erro.message}`)

            uai codigo é 500
            se (erro.message.tem_no_meio("não encontrado")) {
                codigo é 404
            }
            senao se (erro.message.tem_no_meio("inválido")) {
                codigo é 400
            }

            res.status(codigo).json(este.resposta_de_erro(erro, codigo))
        }
    }

    /**
     * 🗑️ Deletar usuário
     * DELETE /api/v1/usuarios/:id
     */
    @Deletar("/:id")
    async deletar(req, res) {
        tenta {
            uai id é req.params.id
            prosa(`🗑️ Deletando usuário: ${id}`)

            se (!id) {
                faz_favor res.status(400).json(este.resposta_de_erro(
                    faz_um Error("ID do usuário é obrigatório!"), 400
                ))
            }

            await este.deletar_usuario_caso_de_uso.executar({ id: id })

            res.status(200).json(este.resposta_de_sucesso(
                { id: id },
                "Usuário deletado com sucesso!"
            ))

        } pega (erro) {
            prosa(`❌ Erro ao deletar usuário: ${erro.message}`)

            uai codigo é 500
            se (erro.message.tem_no_meio("não encontrado")) {
                codigo é 404
            }

            res.status(codigo).json(este.resposta_de_erro(erro, codigo))
        }
    }

    /**
     * 📊 Estatísticas do usuário
     * GET /api/v1/usuarios/:id/stats
     */
    @Pegar("/:id/stats")
    async estatisticas(req, res) {
        tenta {
            uai id é req.params.id
            prosa(`📊 Buscando estatísticas do usuário: ${id}`)

            uai stats é await este.buscar_usuario_caso_de_uso.executar({
                tipo: "estatisticas",
                id: id
            })

            res.status(200).json(este.resposta_de_sucesso(
                stats,
                "Estatísticas obtidas com sucesso!"
            ))

        } pega (erro) {
            prosa(`❌ Erro ao obter estatísticas: ${erro.message}`)
            res.status(500).json(este.resposta_de_erro(erro))
        }
    }

    /**
     * 🔐 Alterar senha
     * POST /api/v1/usuarios/:id/senha
     */
    @Postar("/:id/senha")
    async alterar_senha(req, res) {
        tenta {
            uai id é req.params.id
            prosa(`🔐 Alterando senha do usuário: ${id}`)

            este.validar_dados(req, [
                { campo: "senha_atual", obrigatorio: verdadeiro },
                { campo: "senha_nova", obrigatorio: verdadeiro }
            ])

            await este.atualizar_usuario_caso_de_uso.executar({
                id: id,
                tipo: "alterar_senha",
                senha_atual: req.body.senha_atual,
                senha_nova: req.body.senha_nova
            })

            res.status(200).json(este.resposta_de_sucesso(
                { id: id },
                "Senha alterada com sucesso, sô!"
            ))

        } pega (erro) {
            prosa(`❌ Erro ao alterar senha: ${erro.message}`)
            res.status(400).json(este.resposta_de_erro(erro, 400))
        }
    }
}

troca_ideia { UsuarioControlador }