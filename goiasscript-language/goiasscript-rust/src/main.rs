mod lexer;
mod parser;
mod ast;
mod translator;
mod keywords;
mod errors;

use clap::{Parser, ValueEnum};
use std::path::PathBuf;
use std::fs;
use anyhow::{Result, Context};
use colored::*;

#[derive(Parser)]
#[command(name = "goiasscript")]
#[command(about = "Compilador GoiásScript para Rust", long_about = None)]
struct Cli {
    /// Arquivo de entrada .gs
    #[arg(value_name = "ARQUIVO")]
    input: PathBuf,

    /// Mostra o código Rust gerado
    #[arg(short, long)]
    show_code: bool,

    /// Modo de compilação
    #[arg(short, long, value_enum, default_value_t = CompileMode::Build)]
    mode: CompileMode,

    /// Arquivo de saída (opcional)
    #[arg(short, long)]
    output: Option<PathBuf>,
}

#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Ord, ValueEnum)]
enum CompileMode {
    /// Apenas traduz para Rust
    Translate,
    /// Traduz e compila em modo debug
    Build,
    /// Traduz e compila em modo release
    Release,
    /// Gera documentação
    Doc,
}

fn main() -> Result<()> {
    let cli = Cli::parse();
    
    // Verifica se o arquivo existe e tem a extensão correta
    if !cli.input.exists() {
        return Err(anyhow::anyhow!("Arquivo não encontrado: {}", cli.input.display()));
    }
    
    if cli.input.extension().and_then(|e| e.to_str()) != Some("gs") {
        return Err(anyhow::anyhow!("Arquivo deve ter extensão .gs: {}", cli.input.display()));
    }
    
    // Lê o arquivo de entrada
    let source = fs::read_to_string(&cli.input)
        .with_context(|| format!("Erro ao ler arquivo: {}", cli.input.display()))?;
    
    println!("{} {}", "Compilando:".green().bold(), cli.input.display());
    
    // Realiza a análise léxica (tokenização)
    let tokens = lexer::tokenize(&source)?;
    
    // Realiza a análise sintática (parsing)
    let ast = parser::parse(tokens)?;
    
    // Traduz para código Rust
    let rust_code = translator::translate(ast)?;
    
    // Define o nome do arquivo de saída Rust
    let output_rust_file = match &cli.output {
        Some(path) => path.clone(),
        None => {
            let stem = cli.input.file_stem().unwrap().to_str().unwrap();
            PathBuf::from(format!("{}.rs", stem))
        }
    };
    
    // Salva o código Rust gerado
    fs::write(&output_rust_file, &rust_code)
        .with_context(|| format!("Erro ao salvar arquivo Rust: {}", output_rust_file.display()))?;
    
    // Exibe o código Rust gerado se solicitado
    if cli.show_code {
        println!("\n{}", "=== Código Rust gerado ===".yellow().bold());
        println!("{}", rust_code);
        println!("{}", "=========================".yellow().bold());
    }
    
    match cli.mode {
        CompileMode::Translate => {
            println!("{} {}", "Código Rust gerado em:".green(), output_rust_file.display());
        },
        CompileMode::Build | CompileMode::Release => {
            // Invoca o compilador Rust
            compile_rust_code(&output_rust_file, cli.mode == CompileMode::Release)?;
        },
        CompileMode::Doc => {
            generate_documentation(&output_rust_file)?;
        }
    }
    
    Ok(())
}

fn compile_rust_code(rust_file: &PathBuf, release: bool) -> Result<()> {
    use std::process::Command;
    
    println!("{}", "Compilando código Rust...".blue());
    
    let mut cmd = Command::new("rustc");
    cmd.arg(rust_file);
    
    if release {
        cmd.arg("--release");
        cmd.arg("-O");
    }
    
    let output_path = rust_file.with_extension("");
    cmd.arg("-o").arg(&output_path);
    
    let status = cmd.status()
        .with_context(|| "Falha ao executar rustc. Verifique se o Rust está instalado")?;
    
    if !status.success() {
        return Err(anyhow::anyhow!("Compilação do Rust falhou"));
    }
    
    println!("{} {}", "Executável gerado em:".green(), output_path.display());
    Ok(())
}

fn generate_documentation(rust_file: &PathBuf) -> Result<()> {
    use std::process::Command;
    
    println!("{}", "Gerando documentação...".blue());
    
    let status = Command::new("rustdoc")
        .arg(rust_file)
        .status()
        .with_context(|| "Falha ao executar rustdoc")?;
    
    if !status.success() {
        return Err(anyhow::anyhow!("Geração da documentação falhou"));
    }
    
    println!("{}", "Documentação gerada com sucesso".green());
    Ok(())
}