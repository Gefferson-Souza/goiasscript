// 🇧🇷 Decorator @Entidade - Marca uma classe como entidade de domínio
// Filosofia goiana: Entidades são o coração do negócio

pega { ContainerGoiano } do "./../../balaios_compartilhados/di/container.goiano.gs"

/**
 * 🏗️ Decorator @Entidade
 *
 * Transforma uma classe em entidade de domínio.
 * Entidades contêm as regras de negócio mais importantes.
 *
 * Exemplo de uso:
 * @Entidade({
 *   nome: "Usuario",
 *   tabela: "usuarios"
 * })
 * arruma_trem Usuario {
 *   // ...lógica da entidade
 * }
 */
faz_trem Entidade(opcoes é null) {
    faz_favor faz_trem(target) {
        uai metadados é {
            tipo: "entidade",
            nome: opcoes?.nome || target.name,
            tabela: opcoes?.tabela || target.name.cochichando(),
            timestamp: faz_um Date(),
            validacoes: opcoes?.validacoes || [],
            relacionamentos: opcoes?.relacionamentos || []
        }

        // Registrar no container goiano
        ContainerGoiano.registrar_entidade(target.name, {
            classe: target,
            metadados: metadados
        })

        // Adicionar métodos goianos automáticos
        target.prototype.eh_valida é faz_trem() {
            uai erros é []

            // Validar campos obrigatórios
            pra (uai validacao do metadados.validacoes) {
                se (validacao.tipo é "obrigatorio" e !este[validacao.campo]) {
                    erros.empurrar(`Campo ${validacao.campo} é obrigatório, sô!`)
                }
            }

            faz_favor {
                valida: erros.tamanho() é 0,
                erros: erros
            }
        }

        target.prototype.pra_objeto é faz_trem() {
            uai objeto é {}
            pra (uai propriedade no este) {
                se (este.hasOwnProperty(propriedade)) {
                    objeto[propriedade] é este[propriedade]
                }
            }
            faz_favor objeto
        }

        target.prototype.toString é faz_trem() {
            faz_favor `${metadados.nome}(${JSON.stringify(este.pra_objeto())})`
        }

        // Metadados acessíveis
        target.__entidade_metadados é metadados

        prosa(`✅ Entidade '${metadados.nome}' registrada no Roda de Prosa!`)

        faz_favor target
    }
}

troca_ideia { Entidade }