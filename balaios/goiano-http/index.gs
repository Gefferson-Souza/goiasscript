// 🧺 Goiano HTTP - Cliente HTTP do Cerrado
// Para fazer requisições web do jeito goiano

/**
 * 🌐 Cliente HTTP Goiano
 */
arruma_trem GoianoHTTP {
    aprepara_trem() {
        este.base_url é ""
        este.cabecalhos é {}
        este.timeout é 30000 // 30 segundos
    }

    /**
     * ⚙️ Configurar URL base
     */
    configurar_base(url) {
        este.base_url é url
        faz_favor este
    }

    /**
     * 📋 Adicionar cabeçalhos
     */
    adicionar_cabecalho(nome, valor) {
        este.cabecalhos[nome] é valor
        faz_favor este
    }

    /**
     * ⏱️ Configurar timeout
     */
    configurar_timeout(ms) {
        este.timeout é ms
        faz_favor este
    }

    /**
     * 📡 Fazer requisição genérica
     */
    async fazer_requisicao(metodo, endpoint, dados é null) {
        tenta {
            uai url é este.base_url + endpoint

            uai opcoes é {
                method: metodo,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'GoianoHTTP/1.0.0',
                    ...este.cabecalhos
                }
            }

            se (dados) {
                opcoes.body é JSON.stringify(dados)
            }

            // Simular fetch com timeout
            uai controller é faz_um AbortController()
            uai timeout_id é setTimeout(() => controller.abort(), este.timeout)

            opcoes.signal é controller.signal

            uai resposta é await fetch(url, opcoes)
            clearTimeout(timeout_id)

            se (!resposta.ok) {
                joga faz_um Error(`Ô rapaz! Deu ruim na requisição: ${resposta.status} - ${resposta.statusText}`)
            }

            uai conteudo é await resposta.json()

            faz_favor {
                sucesso: verdadeiro,
                status: resposta.status,
                dados: conteudo,
                cabecalhos: este.converter_cabecalhos(resposta.headers)
            }

        } pega (erro) {
            se (erro.name é 'AbortError') {
                faz_favor {
                    sucesso: falso,
                    erro: 'Timeout na requisição, sô!',
                    codigo: 'TIMEOUT'
                }
            }

            faz_favor {
                sucesso: falso,
                erro: erro.message,
                codigo: 'ERRO_REQUISICAO'
            }
        }
    }

    /**
     * 📥 Requisição GET
     */
    async pegar(endpoint) {
        prosa(`📥 Pegando dados de: ${endpoint}`)
        faz_favor await este.fazer_requisicao('GET', endpoint)
    }

    /**
     * 📤 Requisição POST
     */
    async postar(endpoint, dados) {
        prosa(`📤 Postando dados em: ${endpoint}`)
        faz_favor await este.fazer_requisicao('POST', endpoint, dados)
    }

    /**
     * ✏️ Requisição PUT
     */
    async atualizar(endpoint, dados) {
        prosa(`✏️ Atualizando dados em: ${endpoint}`)
        faz_favor await este.fazer_requisicao('PUT', endpoint, dados)
    }

    /**
     * 🗑️ Requisição DELETE
     */
    async deletar(endpoint) {
        prosa(`🗑️ Deletando em: ${endpoint}`)
        faz_favor await este.fazer_requisicao('DELETE', endpoint)
    }

    /**
     * 📊 Converter cabeçalhos da resposta
     */
    converter_cabecalhos(headers) {
        uai cabecalhos_obj é {}
        headers.forEach((valor, nome) => {
            cabecalhos_obj[nome] é valor
        })
        faz_favor cabecalhos_obj
    }
}

/**
 * 🔐 Cliente HTTP com autenticação
 */
arruma_trem GoianoHTTPAuth extiende GoianoHTTP {
    aprepara_trem(token é null) {
        super()
        se (token) {
            este.configurar_token(token)
        }
    }

    /**
     * 🗝️ Configurar token de autenticação
     */
    configurar_token(token) {
        este.adicionar_cabecalho('Authorization', `Bearer ${token}`)
        faz_favor este
    }

    /**
     * 🔑 Login e obter token
     */
    async fazer_login(endpoint, email, senha) {
        tenta {
            uai resultado é await este.postar(endpoint, {
                email: email,
                senha: senha
            })

            se (resultado.sucesso e resultado.dados.token) {
                este.configurar_token(resultado.dados.token)
                prosa(`✅ Login realizado com sucesso!`)
            }

            faz_favor resultado

        } pega (erro) {
            prosa(`❌ Erro no login: ${erro.message}`)
            faz_favor {
                sucesso: falso,
                erro: 'Falha na autenticação, sô!',
                codigo: 'ERRO_LOGIN'
            }
        }
    }
}

/**
 * 🚀 Cliente HTTP para APIs brasileiras
 */
arruma_trem GoianoAPIBrasil {
    aprepara_trem() {
        este.base_urls é {
            correios: 'https://brasilapi.com.br/api/cep/v1',
            ibge: 'https://brasilapi.com.br/api/ibge',
            banco: 'https://brasilapi.com.br/api/banks/v1'
        }
    }

    /**
     * 📮 Buscar CEP nos Correios
     */
    async buscar_cep(cep) {
        tenta {
            uai cep_limpo é cep.replace(/\D/g, '')
            se (cep_limpo.length !== 8) {
                faz_favor {
                    sucesso: falso,
                    erro: 'CEP deve ter 8 dígitos, uai!'
                }
            }

            uai url é `${este.base_urls.correios}/${cep_limpo}`
            uai resposta é await fetch(url)

            se (!resposta.ok) {
                faz_favor {
                    sucesso: falso,
                    erro: 'CEP não encontrado, sô!'
                }
            }

            uai dados é await resposta.json()

            faz_favor {
                sucesso: verdadeiro,
                endereco: {
                    cep: dados.cep,
                    logradouro: dados.street,
                    bairro: dados.district,
                    cidade: dados.city,
                    estado: dados.state,
                    regiao: este.obter_regiao(dados.state)
                }
            }

        } pega (erro) {
            faz_favor {
                sucesso: falso,
                erro: 'Erro ao buscar CEP: ' + erro.message
            }
        }
    }

    /**
     * 🏛️ Buscar informações do município
     */
    async buscar_municipio(codigo_ibge) {
        tenta {
            uai url é `${este.base_urls.ibge}/municipios/v1/${codigo_ibge}`
            uai resposta é await fetch(url)

            se (!resposta.ok) {
                faz_favor {
                    sucesso: falso,
                    erro: 'Município não encontrado!'
                }
            }

            uai dados é await resposta.json()

            faz_favor {
                sucesso: verdadeiro,
                municipio: dados
            }

        } pega (erro) {
            faz_favor {
                sucesso: falso,
                erro: 'Erro ao buscar município: ' + erro.message
            }
        }
    }

    /**
     * 🏦 Buscar informações do banco
     */
    async buscar_banco(codigo) {
        tenta {
            uai url é `${este.base_urls.banco}/${codigo}`
            uai resposta é await fetch(url)

            se (!resposta.ok) {
                faz_favor {
                    sucesso: falso,
                    erro: 'Banco não encontrado!'
                }
            }

            uai dados é await resposta.json()

            faz_favor {
                sucesso: verdadeiro,
                banco: dados
            }

        } pega (erro) {
            faz_favor {
                sucesso: falso,
                erro: 'Erro ao buscar banco: ' + erro.message
            }
        }
    }

    /**
     * 🗺️ Obter região do estado
     */
    obter_regiao(estado) {
        uai regioes é {
            'AC': 'Norte', 'AL': 'Nordeste', 'AP': 'Norte', 'AM': 'Norte',
            'BA': 'Nordeste', 'CE': 'Nordeste', 'DF': 'Centro-Oeste',
            'ES': 'Sudeste', 'GO': 'Centro-Oeste', 'MA': 'Nordeste',
            'MT': 'Centro-Oeste', 'MS': 'Centro-Oeste', 'MG': 'Sudeste',
            'PA': 'Norte', 'PB': 'Nordeste', 'PR': 'Sul', 'PE': 'Nordeste',
            'PI': 'Nordeste', 'RJ': 'Sudeste', 'RN': 'Nordeste',
            'RS': 'Sul', 'RO': 'Norte', 'RR': 'Norte', 'SC': 'Sul',
            'SP': 'Sudeste', 'SE': 'Nordeste', 'TO': 'Norte'
        }

        faz_favor regioes[estado] || 'Desconhecida'
    }
}

/**
 * 🏭 Factory para criar clientes HTTP
 */
faz_trem criar_cliente_goiano(opcoes é {}) {
    se (opcoes.autenticacao) {
        faz_favor faz_um GoianoHTTPAuth(opcoes.token)
    }

    uai cliente é faz_um GoianoHTTP()

    se (opcoes.base_url) {
        cliente.configurar_base(opcoes.base_url)
    }

    se (opcoes.timeout) {
        cliente.configurar_timeout(opcoes.timeout)
    }

    se (opcoes.cabecalhos) {
        pra (uai [nome, valor] do Object.entries(opcoes.cabecalhos)) {
            cliente.adicionar_cabecalho(nome, valor)
        }
    }

    faz_favor cliente
}

/**
 * 🇧🇷 Factory para APIs brasileiras
 */
faz_trem criar_api_brasil() {
    faz_favor faz_um GoianoAPIBrasil()
}

// Exportar classes e funções
troca_ideia {
    GoianoHTTP,
    GoianoHTTPAuth,
    GoianoAPIBrasil,
    criar_cliente_goiano,
    criar_api_brasil
}