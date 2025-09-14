// 🇧🇷 Container Goiano - Sistema de Injeção de Dependência 100% Brasileiro
// Filosofia goiana: "Cada coisa no seu lugar e tudo organizado!"

/**
 * 🏗️ Container Goiano
 *
 * Sistema de injeção de dependência nativo do GoiásScript.
 * Gerencia todas as classes registradas pelos decorators.
 */
arruma_trem ContainerGoiano {
    static entidades é faz_um Map()
    static casos_de_uso é faz_um Map()
    static controladores é faz_um Map()
    static repositorios é faz_um Map()
    static servicos é faz_um Map()
    static instancias é faz_um Map()

    /**
     * 📋 Registrar uma entidade
     */
    static registrar_entidade(nome, configuracao) {
        este.entidades.set(nome, configuracao)
        prosa(`✅ Entidade ${nome} registrada no container goiano`)
    }

    /**
     * 🎯 Registrar um caso de uso
     */
    static registrar_caso_de_uso(nome, configuracao) {
        este.casos_de_uso.set(nome, configuracao)
        prosa(`🎯 Caso de uso ${nome} registrado no container goiano`)
    }

    /**
     * 🌐 Registrar um controlador
     */
    static registrar_controlador(nome, configuracao) {
        este.controladores.set(nome, configuracao)
        prosa(`🌐 Controlador ${nome} registrado no container goiano`)
    }

    /**
     * 🗄️ Registrar um repositório
     */
    static registrar_repositorio(nome, configuracao) {
        este.repositorios.set(nome, configuracao)
        prosa(`🗄️ Repositório ${nome} registrado no container goiano`)
    }

    /**
     * ⚙️ Registrar um serviço
     */
    static registrar_servico(nome, configuracao) {
        este.servicos.set(nome, configuracao)
        prosa(`⚙️ Serviço ${nome} registrado no container goiano`)
    }

    /**
     * 🎁 Resolver dependência (criar instância)
     */
    static resolver(nome) {
        // Verificar se já existe instância (singleton)
        se (este.instancias.has(nome)) {
            faz_favor este.instancias.get(nome)
        }

        // Buscar em todas as categorias
        uai configuracao é este.casos_de_uso.get(nome) ||
                            este.controladores.get(nome) ||
                            este.repositorios.get(nome) ||
                            este.servicos.get(nome)

        se (!configuracao) {
            joga faz_um Error(`❌ Dependência '${nome}' não encontrada no container goiano!`)
        }

        tenta {
            // Criar instância
            uai instancia é faz_um configuracao.classe()

            // Resolver dependências da instância
            este.injetar_dependencias(instancia, configuracao)

            // Salvar como singleton
            este.instancias.set(nome, instancia)

            prosa(`🎁 Dependência ${nome} resolvida com sucesso!`)
            faz_favor instancia

        } pega (erro) {
            prosa(`❌ Erro ao resolver dependência ${nome}: ${erro.message}`)
            joga erro
        }
    }

    /**
     * 💉 Injetar dependências em uma instância
     */
    static injetar_dependencias(instancia, configuracao) {
        se (!configuracao.metadados.dependencias) {
            faz_favor
        }

        pra (uai dep do configuracao.metadados.dependencias) {
            tenta {
                uai dependencia é este.resolver(dep.nome)
                instancia[dep.propriedade] é dependencia
                prosa(`💉 Dependência ${dep.nome} injetada em ${dep.propriedade}`)
            } pega (erro) {
                prosa(`⚠️ Não foi possível injetar ${dep.nome}: ${erro.message}`)
            }
        }
    }

    /**
     * 📊 Listar todas as dependências registradas
     */
    static listar_tudo() {
        uai total é este.entidades.size + este.casos_de_uso.size +
                   este.controladores.size + este.repositorios.size +
                   este.servicos.size

        prosa(`📊 === CONTAINER GOIANO ===`)
        prosa(`📈 Total de dependências: ${total}`)
        prosa(``)

        se (este.entidades.size maior_que 0) {
            prosa(`🏗️ Entidades (${este.entidades.size}):`)
            pra (uai [nome, config] do este.entidades) {
                prosa(`   - ${nome} (${config.metadados.tabela || 'sem tabela'})`)
            }
        }

        se (este.casos_de_uso.size maior_que 0) {
            prosa(`🎯 Casos de Uso (${este.casos_de_uso.size}):`)
            pra (uai [nome, config] do este.casos_de_uso) {
                prosa(`   - ${nome} (domínio: ${config.metadados.dominio})`)
            }
        }

        se (este.controladores.size maior_que 0) {
            prosa(`🌐 Controladores (${este.controladores.size}):`)
            pra (uai [nome, config] do este.controladores) {
                prosa(`   - ${nome} (${config.metadados.rota})`)
            }
        }

        se (este.repositorios.size maior_que 0) {
            prosa(`🗄️ Repositórios (${este.repositorios.size}):`)
            pra (uai [nome] do este.repositorios) {
                prosa(`   - ${nome}`)
            }
        }

        se (este.servicos.size maior_que 0) {
            prosa(`⚙️ Serviços (${este.servicos.size}):`)
            pra (uai [nome] do este.servicos) {
                prosa(`   - ${nome}`)
            }
        }

        se (este.instancias.size maior_que 0) {
            prosa(`🎁 Instâncias Ativas (${este.instancias.size}):`)
            pra (uai [nome] do este.instancias) {
                prosa(`   - ${nome} (singleton)`)
            }
        }

        prosa(`========================`)
    }

    /**
     * 🧹 Limpar container (útil para testes)
     */
    static limpar_tudo() {
        este.entidades.clear()
        este.casos_de_uso.clear()
        este.controladores.clear()
        este.repositorios.clear()
        este.servicos.clear()
        este.instancias.clear()

        prosa(`🧹 Container goiano limpo!`)
    }

    /**
     * 🔍 Verificar se dependência existe
     */
    static tem_dependencia(nome) {
        faz_favor este.entidades.has(nome) ||
                 este.casos_de_uso.has(nome) ||
                 este.controladores.has(nome) ||
                 este.repositorios.has(nome) ||
                 este.servicos.has(nome)
    }

    /**
     * 🏃 Inicializar container (executar no boot da aplicação)
     */
    static inicializar() {
        prosa(`🚀 Inicializando Container Goiano...`)

        // Aqui podemos adicionar lógica de inicialização
        // como validações, health checks, etc.

        este.listar_tudo()
        prosa(`✅ Container Goiano inicializado com sucesso!`)
    }
}

/**
 * 💉 Decorator @Injetar - Marca propriedade para injeção automática
 */
faz_trem Injetar(nome_dependencia) {
    faz_favor faz_trem(target, propertyKey) {
        se (!target.constructor.__dependencias) {
            target.constructor.__dependencias é []
        }

        target.constructor.__dependencias.empurrar({
            nome: nome_dependencia,
            propriedade: propertyKey
        })

        prosa(`💉 Dependência ${nome_dependencia} marcada para injeção em ${propertyKey}`)
    }
}

troca_ideia { ContainerGoiano, Injetar }