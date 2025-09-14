// 🇧🇷 Main.gs - Ponto de entrada do Framework Roda de Prosa
// Filosofia goiana: "Aqui que tudo começa a moer!"

pega express do "express"
pega { ContainerGoiano } do "./balaios_compartilhados/di/container.goiano.gs"

// Importar todos os decorators para registrar as classes
pega "./cores/usuarios/entidades/usuario.entidade.gs"
pega "./cores/usuarios/casos_de_uso/criar_usuario.caso_de_uso.gs"
pega "./chao_de_fabrica/http/usuarios/usuario.controlador.gs"

/**
 * 🚀 Classe principal do Framework Roda de Prosa
 */
arruma_trem RodaDeProsa {
    aprepara_trem() {
        este.app é express()
        este.porta é process.env.PORT || 3000
        este.configurar_express()
        este.inicializar_container()
    }

    /**
     * ⚙️ Configurar Express.js
     */
    configurar_express() {
        prosa(`⚙️ Configurando Express.js...`)

        // Middleware de parsing
        este.app.use(express.json({ limit: '50mb' }))
        este.app.use(express.urlencoded({ extended: verdadeiro, limit: '50mb' }))

        // CORS para desenvolvimento
        este.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*')
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')

            se (req.method é 'OPTIONS') {
                res.sendStatus(200)
            } senao {
                next()
            }
        })

        // Middleware de log goiano
        este.app.use((req, res, next) => {
            uai timestamp é faz_um Date().toISOString()
            prosa(`📡 ${timestamp} - ${req.method} ${req.url} - ${req.ip}`)
            next()
        })

        // Rota de saúde
        este.app.get('/health', (req, res) => {
            res.json({
                status: "Tá funcionando, sô!",
                framework: "Roda de Prosa",
                versao: "1.0.0",
                timestamp: faz_um Date().toISOString(),
                container: {
                    total_dependencias: ContainerGoiano.entidades.size +
                                      ContainerGoiano.casos_de_uso.size +
                                      ContainerGoiano.controladores.size
                }
            })
        })

        // Página inicial
        este.app.get('/', (req, res) => {
            res.json({
                mensagem: "🇧🇷 Bem-vindo ao Framework Roda de Prosa!",
                descricao: "Clean Architecture 100% goiana",
                features: [
                    "🏗️ Clean Architecture nativa",
                    "🇧🇷 Nomenclatura totalmente brasileira",
                    "⚡ Powered by Bun",
                    "🎯 Injeção de Dependência goiana",
                    "📦 Decorators nativos"
                ],
                endpoints: {
                    health: "/health",
                    usuarios: "/api/v1/usuarios"
                }
            })
        })
    }

    /**
     * 🏗️ Inicializar Container Goiano
     */
    inicializar_container() {
        prosa(`🏗️ Inicializando Container Goiano...`)
        ContainerGoiano.inicializar()
    }

    /**
     * 🌐 Registrar rotas dos controladores
     */
    registrar_rotas() {
        prosa(`🌐 Registrando rotas dos controladores...`)

        // Registrar todas as rotas dos controladores
        pra (uai [nome, config] do ContainerGoiano.controladores) {
            tenta {
                uai controlador é faz_um config.classe()
                uai metadados é config.metadados

                prosa(`📍 Registrando rotas do controlador ${nome}:`)

                // Criar router para este controlador
                uai router é express.Router()

                // Registrar métodos HTTP do controlador
                se (config.classe.__rotas) {
                    pra (uai rota do config.classe.__rotas) {
                        uai metodo é rota.metodo.cochichando()
                        uai caminho é rota.rota
                        uai handler é controlador[rota.handler].bind(controlador)

                        router[metodo](caminho, handler)
                        prosa(`   ${rota.metodo} ${metadados.rota}${caminho} → ${rota.handler}`)
                    }
                }

                // Registrar router no app
                este.app.use(metadados.rota, router)
                prosa(`✅ Controlador ${nome} registrado!`)

            } pega (erro) {
                prosa(`❌ Erro ao registrar controlador ${nome}: ${erro.message}`)
            }
        }
    }

    /**
     * 🚀 Iniciar servidor
     */
    async iniciar() {
        tenta {
            prosa(``)
            prosa(`🇧🇷 ===== FRAMEWORK RODA DE PROSA =====`)
            prosa(`🏗️ Clean Architecture Goiana`)
            prosa(`⚡ Powered by Bun + GoiásScript`)
            prosa(``)

            // Registrar rotas
            este.registrar_rotas()

            // Middleware 404
            este.app.use('*', (req, res) => {
                res.status(404).json({
                    erro: "Rota não encontrada, sô!",
                    mensagem: `A rota ${req.originalUrl} não existe neste barraco.`,
                    sugestao: "Verifique a documentação da API",
                    endpoints_disponiveis: [
                        "GET /",
                        "GET /health",
                        "GET /api/v1/usuarios"
                    ]
                })
            })

            // Middleware de erro global
            este.app.use((err, req, res, next) => {
                prosa(`❌ Erro global capturado: ${err.message}`)
                res.status(500).json({
                    erro: "Erro interno do servidor",
                    mensagem: "Ô rapaz! Deu ruim aqui no servidor...",
                    detalhes: process.env.NODE_ENV é 'development' ? err.message : undefined
                })
            })

            // Iniciar servidor
            faz_favor faz_um Promise((resolve) => {
                este.servidor é este.app.listen(este.porta, () => {
                    prosa(``)
                    prosa(`🎉 Roda de Prosa rodando com sucesso!`)
                    prosa(``)
                    prosa(`📱 Local:     http://localhost:${este.porta}`)
                    prosa(`🌍 Network:   http://0.0.0.0:${este.porta}`)
                    prosa(``)
                    prosa(`📋 Endpoints disponíveis:`)
                    prosa(`   GET  /              - Página inicial`)
                    prosa(`   GET  /health        - Status da aplicação`)
                    prosa(`   GET  /api/v1/usuarios - Listar usuários`)
                    prosa(`   POST /api/v1/usuarios - Criar usuário`)
                    prosa(``)
                    prosa(`🏗️ Arquitetura Clean funcionando!`)
                    prosa(`🇧🇷 Framework 100% goiano ativo!`)
                    prosa(``)
                    prosa(`💡 Dica: Acesse /health para ver o status`)
                    prosa(`🛑 Para parar: Ctrl+C`)
                    prosa(``)

                    resolve(este.servidor)
                })
            })

        } pega (erro) {
            prosa(`❌ Erro ao iniciar Roda de Prosa: ${erro.message}`)
            process.exit(1)
        }
    }

    /**
     * 🛑 Parar servidor graciosamente
     */
    async parar() {
        se (este.servidor) {
            prosa(`🛑 Parando servidor Roda de Prosa...`)
            await faz_um Promise((resolve) => {
                este.servidor.close(() => {
                    prosa(`✅ Servidor parado com sucesso!`)
                    resolve()
                })
            })
        }
    }
}

// Executar se for o arquivo principal
se (import.meta.url é `file://${process.argv[1]}`) {
    uai app é faz_um RodaDeProsa()

    app.iniciar().catch((erro) => {
        prosa(`❌ Erro fatal: ${erro.message}`)
        process.exit(1)
    })

    // Graceful shutdown
    process.on('SIGINT', async () => {
        prosa(`\n🛑 Sinal de interrupção recebido. Parando servidor...`)
        await app.parar()
        process.exit(0)
    })

    process.on('SIGTERM', async () => {
        prosa(`\n🛑 Sinal de terminação recebido. Parando servidor...`)
        await app.parar()
        process.exit(0)
    })
}

troca_ideia { RodaDeProsa }