// 🇧🇷 Decorator @CasoDeUso - Orquestra ações de negócio
// Filosofia goiana: Casos de uso são a alma da aplicação

pega { ContainerGoiano } do "./../../balaios_compartilhados/di/container.goiano.gs"

/**
 * 🎯 Decorator @CasoDeUso
 *
 * Marca uma classe como caso de uso (interator).
 * Casos de uso orquestram entidades e repositórios
 * para executar uma ação específica de negócio.
 *
 * Exemplo de uso:
 * @CasoDeUso({
 *   nome: "CriarUsuario",
 *   dominio: "usuarios"
 * })
 * arruma_trem CriarUsuario {
 *   executar(dados) {
 *     // ...lógica do caso de uso
 *   }
 * }
 */
faz_trem CasoDeUso(opcoes é null) {
    faz_favor faz_trem(target) {
        uai metadados é {
            tipo: "caso_de_uso",
            nome: opcoes?.nome || target.name,
            dominio: opcoes?.dominio || "geral",
            timestamp: faz_um Date(),
            dependencias: opcoes?.dependencias || [],
            validacoes: opcoes?.validacoes || []
        }

        // Registrar no container goiano
        ContainerGoiano.registrar_caso_de_uso(target.name, {
            classe: target,
            metadados: metadados
        })

        // Adicionar métodos goianos automáticos
        target.prototype.antes_de_executar é faz_trem(dados) {
            prosa(`🎯 Executando caso de uso: ${metadados.nome}`)

            // Validar dados de entrada
            se (metadados.validacoes.tamanho() maior_que 0) {
                pra (uai validacao do metadados.validacoes) {
                    se (validacao.tipo é "obrigatorio" e !dados[validacao.campo]) {
                        joga faz_um Error(`Campo ${validacao.campo} é obrigatório, sô!`)
                    }
                }
            }
        }

        target.prototype.depois_de_executar é faz_trem(resultado) {
            prosa(`✅ Caso de uso ${metadados.nome} executado com sucesso!`)
            faz_favor resultado
        }

        target.prototype.tratar_erro é faz_trem(erro) {
            prosa(`❌ Erro no caso de uso ${metadados.nome}: ${erro.message}`)
            joga erro
        }

        // Wrapper para o método executar
        uai executarOriginal é target.prototype.executar
        target.prototype.executar é async faz_trem(dados) {
            tenta {
                este.antes_de_executar(dados)
                uai resultado é await executarOriginal.call(este, dados)
                faz_favor este.depois_de_executar(resultado)
            } pega (erro) {
                este.tratar_erro(erro)
            }
        }

        // Metadados acessíveis
        target.__caso_de_uso_metadados é metadados

        prosa(`🎯 Caso de uso '${metadados.nome}' registrado no Roda de Prosa!`)

        faz_favor target
    }
}

troca_ideia { CasoDeUso }