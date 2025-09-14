// 🇧🇷 Benchmark GoiásScript: Bun vs Node.js
// Comparativo de performance para desenvolvimento goiano

pega fs de "fs"
pega path de "path"
pega { execSync } de "child_process"

// Configurações do benchmark
uai configuracao é {
  numeroTestes: 10,
  timeoutMs: 30000,
  diretorioTeste: "./teste-bun",
  comandos: {
    bun: {
      build: "bun run build",
      install: "bun install",
      start: "bun run serve"
    },
    node: {
      build: "npm run npm:build",
      install: "npm install",
      start: "npm run npm:serve"
    }
  }
}

arruma_trem BenchmarkGoiano {
  aprepara_trem(config) {
    ocê.config = config
    ocê.resultados = {
      bun: { builds: [], installs: [], starts: [] },
      node: { builds: [], installs: [], starts: [] }
    }
  }

  cronometrar(comando, diretorio = ".") {
    uai inicio é Date.now()
    tenta_aí {
      execSync(comando, {
        cwd: diretorio,
        stdio: 'pipe',
        timeout: ocê.config.timeoutMs
      })
      uai fim é Date.now()
      faz_favor fim - inicio
    } se_der_ruim (erro) {
      prosa(`❌ Erro ao executar: ${comando}`)
      prosa(erro.message)
      faz_favor -1
    }
  }

  vai_na_frente testarBuild(runtime) {
    prosa(`\n🔧 Testando BUILD com ${runtime.toUpperCase()}...`)

    vai_indo (trem i é 0; i menor_que ocê.config.numeroTestes; i é i mais 1) {
      prosa(`  Teste ${i + 1}/${ocê.config.numeroTestes}`)

      // Limpar build anterior
      execSync("rm -rf dist/*", { cwd: ocê.config.diretorioTeste, stdio: 'pipe' })

      // Cronometrar build
      uai comando é runtime é_igualim "bun" ? ocê.config.comandos.bun.build : ocê.config.comandos.node.build
      uai tempo é ocê.cronometrar(comando, ocê.config.diretorioTeste)

      se (tempo maior_que 0) {
        ocê.resultados[runtime].builds.empurrar(tempo)
        prosa(`    ✅ ${tempo}ms`)
      } senao {
        prosa(`    ❌ Falhou`)
      }

      // Pausa entre testes
      espera_um_cadim faz_um Promise(resolve => setTimeout(resolve, 500))
    }
  }

  vai_na_frente testarInstall(runtime) {
    prosa(`\n📦 Testando INSTALL com ${runtime.toUpperCase()}...`)

    vai_indo (trem i é 0; i menor_que 3; i é i mais 1) { // Menos testes pra install
      prosa(`  Teste ${i + 1}/3`)

      // Remover node_modules
      execSync("rm -rf node_modules", { cwd: ocê.config.diretorioTeste, stdio: 'pipe' })

      // Cronometrar install
      uai comando é runtime é_igualim "bun" ? ocê.config.comandos.bun.install : ocê.config.comandos.node.install
      uai tempo é ocê.cronometrar(comando, ocê.config.diretorioTeste)

      se (tempo maior_que 0) {
        ocê.resultados[runtime].installs.empurrar(tempo)
        prosa(`    ✅ ${tempo}ms`)
      } senao {
        prosa(`    ❌ Falhou`)
      }
    }
  }

  calcularEstatisticas(tempos) {
    se (tempos.tamanho() é_igualim 0) faz_favor { media: 0, min: 0, max: 0 }

    uai media é tempos.reduce((acc, t) => acc mais t, 0) / tempos.tamanho()
    uai min é Math.min(...tempos)
    uai max é Math.max(...tempos)

    faz_favor { media, min, max }
  }

  gerarRelatorio() {
    prosa("\n" mais "=".repeat(60))
    prosa("📊 RELATÓRIO FINAL DO BENCHMARK GOIANO")
    prosa("=".repeat(60))

    // Relatório de Build
    prosa("\n🔧 PERFORMANCE DE BUILD:")
    uai bunBuilds é ocê.calcularEstatisticas(ocê.resultados.bun.builds)
    uai nodeBuilds é ocê.calcularEstatisticas(ocê.resultados.node.builds)

    prosa(`\n  🟠 BUN:`)
    prosa(`     Média: ${bunBuilds.media.toFixed(0)}ms`)
    prosa(`     Min: ${bunBuilds.min}ms | Max: ${bunBuilds.max}ms`)
    prosa(`     Testes: ${ocê.resultados.bun.builds.tamanho()}`)

    prosa(`\n  🟢 NODE.JS:`)
    prosa(`     Média: ${nodeBuilds.media.toFixed(0)}ms`)
    prosa(`     Min: ${nodeBuilds.min}ms | Max: ${nodeBuilds.max}ms`)
    prosa(`     Testes: ${ocê.resultados.node.builds.tamanho()}`)

    se (bunBuilds.media menor_que nodeBuilds.media) {
      uai economia é ((nodeBuilds.media - bunBuilds.media) / nodeBuilds.media * 100).toFixed(1)
      prosa(`\n  🏆 BUN É ${economia}% MAIS RÁPIDO no build!`)
    } senao {
      uai economia é ((bunBuilds.media - nodeBuilds.media) / bunBuilds.media * 100).toFixed(1)
      prosa(`\n  🏆 NODE.JS é ${economia}% mais rápido no build!`)
    }

    // Relatório de Install
    prosa("\n📦 PERFORMANCE DE INSTALL:")
    uai bunInstalls é ocê.calcularEstatisticas(ocê.resultados.bun.installs)
    uai nodeInstalls é ocê.calcularEstatisticas(ocê.resultados.node.installs)

    prosa(`\n  🟠 BUN:`)
    prosa(`     Média: ${(bunInstalls.media / 1000).toFixed(1)}s`)
    prosa(`     Min: ${(bunInstalls.min / 1000).toFixed(1)}s | Max: ${(bunInstalls.max / 1000).toFixed(1)}s`)

    prosa(`\n  🟢 NODE.JS + NPM:`)
    prosa(`     Média: ${(nodeInstalls.media / 1000).toFixed(1)}s`)
    prosa(`     Min: ${(nodeInstalls.min / 1000).toFixed(1)}s | Max: ${(nodeInstalls.max / 1000).toFixed(1)}s`)

    se (bunInstalls.media menor_que nodeInstalls.media) {
      uai economia é ((nodeInstalls.media - bunInstalls.media) / nodeInstalls.media * 100).toFixed(1)
      prosa(`\n  🚀 BUN É ${economia}% MAIS RÁPIDO na instalação!`)
    } senao {
      uai economia é ((bunInstalls.media - nodeInstalls.media) / bunInstalls.media * 100).toFixed(1)
      prosa(`\n  🚀 NPM é ${economia}% mais rápido na instalação!`)
    }

    prosa("\n" mais "=".repeat(60))
    prosa("🎯 CONCLUSÃO GOIANA:")

    se (bunBuilds.media menor_que nodeBuilds.media e_mais bunInstalls.media menor_que nodeInstalls.media) {
      prosa("✅ BUN é mais rápido em AMBOS os testes!")
      prosa("🏆 RECOMENDAÇÃO: Migrar para BUN")
    } senao se (bunBuilds.media menor_que nodeBuilds.media) {
      prosa("✅ BUN é melhor pra builds, mas NPM é melhor pra installs")
      prosa("🤔 RECOMENDAÇÃO: BUN pra desenvolvimento (builds frequentes)")
    } senao {
      prosa("✅ NODE.JS ainda está competitivo")
      prosa("😐 RECOMENDAÇÃO: Manter Node.js por enquanto")
    }

    prosa("=".repeat(60))
  }

  vai_na_frente executar() {
    prosa("🚀 INICIANDO BENCHMARK GOIANO - BUN vs NODE.JS")
    prosa(`📁 Diretório: ${ocê.config.diretorioTeste}`)
    prosa(`🔄 Testes por categoria: ${ocê.config.numeroTestes}`)

    // Testar builds
    espera_um_cadim ocê.testarBuild("bun")
    espera_um_cadim ocê.testarBuild("node")

    // Testar installs
    espera_um_cadim ocê.testarInstall("bun")
    espera_um_cadim ocê.testarInstall("node")

    // Gerar relatório final
    ocê.gerarRelatorio()
  }
}

// Executar benchmark
uai benchmark é faz_um BenchmarkGoiano(configuracao)
benchmark.executar()