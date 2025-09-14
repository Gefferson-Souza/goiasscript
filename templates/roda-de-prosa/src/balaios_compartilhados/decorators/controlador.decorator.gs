// 🇧🇷 Decorator @Controlador - Interface HTTP goiana
// Filosofia goiana: Controladores são a porta de entrada

pega { ContainerGoiano } do "./../../balaios_compartilhados/di/container.goiano.gs"

/**
 * 🌐 Decorator @Controlador
 *
 * Marca uma classe como controlador HTTP.
 * Controladores recebem requisições e chamam casos de uso.
 *
 * Exemplo de uso:
 * @Controlador({
 *   rota: "/api/usuarios",
 *   versao: "v1"
 * })
 * arruma_trem UsuarioControlador {
 *   // ...métodos HTTP
 * }
 */
faz_trem Controlador(opcoes é null) {
    faz_favor faz_trem(target) {
        uai metadados é {
            tipo: "controlador",
            nome: opcoes?.nome || target.name,
            rota: opcoes?.rota || "/",
            versao: opcoes?.versao || "v1",
            timestamp: faz_um Date(),
            middlewares: opcoes?.middlewares || [],
            cors: opcoes?.cors || verdadeiro
        }

        // Registrar no container goiano
        ContainerGoiano.registrar_controlador(target.name, {
            classe: target,
            metadados: metadados
        })

        // Adicionar métodos goianos automáticos
        target.prototype.resposta_de_sucesso é faz_trem(dados, mensagem é "Deu bom, sô!") {
            faz_favor {
                sucesso: verdadeiro,
                mensagem: mensagem,
                dados: dados,
                timestamp: faz_um Date().toISOString()
            }
        }

        target.prototype.resposta_de_erro é faz_trem(erro, codigo é 500) {
            faz_favor {
                sucesso: falso,
                mensagem: erro.message || "Ô rapaz! Deu ruim aqui...",
                erro: erro.name || "ErroGoiano",
                codigo: codigo,
                timestamp: faz_um Date().toISOString()
            }
        }

        target.prototype.validar_dados é faz_trem(req, validacoes) {
            uai erros é []

            pra (uai validacao do validacoes) {
                uai valor é req.body[validacao.campo] || req.query[validacao.campo] || req.params[validacao.campo]

                se (validacao.obrigatorio e !valor) {
                    erros.empurrar(`Campo ${validacao.campo} é obrigatório, uai!`)
                }

                se (valor e validacao.tipo) {
                    se (validacao.tipo é "email" e !valor.tem_no_meio("@")) {
                        erros.empurrar(`Campo ${validacao.campo} deve ser um email válido!`)
                    }
                }
            }

            se (erros.tamanho() maior_que 0) {
                joga faz_um Error(erros.join(", "))
            }
        }

        // Metadados acessíveis
        target.__controlador_metadados é metadados

        prosa(`🌐 Controlador '${metadados.nome}' registrado na rota ${metadados.rota}`)

        faz_favor target
    }
}

/**
 * 🔗 Decorator @Pegar - Define rota GET
 */
faz_trem Pegar(rota é "/") {
    faz_favor faz_trem(target, propertyKey, descriptor) {
        se (!target.constructor.__rotas) {
            target.constructor.__rotas é []
        }

        target.constructor.__rotas.empurrar({
            metodo: "GET",
            rota: rota,
            handler: propertyKey,
            tipo: "pegar"
        })

        prosa(`📥 Rota GET ${rota} registrada para ${propertyKey}`)

        faz_favor descriptor
    }
}

/**
 * 📤 Decorator @Postar - Define rota POST
 */
faz_trem Postar(rota é "/") {
    faz_favor faz_trem(target, propertyKey, descriptor) {
        se (!target.constructor.__rotas) {
            target.constructor.__rotas é []
        }

        target.constructor.__rotas.empurrar({
            metodo: "POST",
            rota: rota,
            handler: propertyKey,
            tipo: "postar"
        })

        prosa(`📤 Rota POST ${rota} registrada para ${propertyKey}`)

        faz_favor descriptor
    }
}

/**
 * ✏️ Decorator @Atualizar - Define rota PUT
 */
faz_trem Atualizar(rota é "/") {
    faz_favor faz_trem(target, propertyKey, descriptor) {
        se (!target.constructor.__rotas) {
            target.constructor.__rotas é []
        }

        target.constructor.__rotas.empurrar({
            metodo: "PUT",
            rota: rota,
            handler: propertyKey,
            tipo: "atualizar"
        })

        prosa(`✏️ Rota PUT ${rota} registrada para ${propertyKey}`)

        faz_favor descriptor
    }
}

/**
 * 🗑️ Decorator @Deletar - Define rota DELETE
 */
faz_trem Deletar(rota é "/") {
    faz_favor faz_trem(target, propertyKey, descriptor) {
        se (!target.constructor.__rotas) {
            target.constructor.__rotas é []
        }

        target.constructor.__rotas.empurrar({
            metodo: "DELETE",
            rota: rota,
            handler: propertyKey,
            tipo: "deletar"
        })

        prosa(`🗑️ Rota DELETE ${rota} registrada para ${propertyKey}`)

        faz_favor descriptor
    }
}

troca_ideia { Controlador, Pegar, Postar, Atualizar, Deletar }