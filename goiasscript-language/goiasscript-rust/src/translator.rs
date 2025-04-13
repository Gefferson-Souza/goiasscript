use std::fs;
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use anyhow::{Context, Result};

use crate::ast::*;

pub struct Translator {
    // Conteúdo do código Rust gerado
    rust_code: String,
    // Indica se estamos dentro de um contexto de impressão (println!)
    is_printing_context: bool,
    // Rastreamento de indentação
    indent_level: usize,
    // Indica se estamos em um contexto de função
    in_function: bool,
    // Indica se estamos em um contexto assíncrono
    async_context: bool,
    // Indica se já definimos a função main
    has_main_function: bool,
    // Indica se já adicionamos a função read_input
    added_read_input: bool,
}

impl Translator {
    pub fn new() -> Self {
        Translator {
            rust_code: String::new(),
            is_printing_context: false,
            indent_level: 0,
            in_function: false,
            async_context: false,
            has_main_function: false,
            added_read_input: false,
        }
    }

    // Adiciona um import ao início do código Rust
    pub fn add_import(&mut self, import: &str) {
        // Verificar se o import já existe
        if !self.rust_code.contains(import) {
            // Adicionar ao início
            self.rust_code = format!("{}\n{}", import, self.rust_code);
        }
    }

    // Traduz o programa GoiásScript para Rust
    pub fn translate_program(&mut self, program: &Program) -> Result<String> {
        // Adiciona os imports padrão
        self.add_import("use std::io::{self, Write};");
        
        // Traduz cada instrução do programa
        for stmt in &program.statements {
            self.statement(stmt)?;
            self.rust_code.push_str("\n");
        }

        // Se a função de leitura de entrada for necessária
        if self.has_read_input_call() && !self.added_read_input {
            // Adiciona a função read_input ao final
            let read_input_fn = r#"
// Função auxiliar para ler a entrada do usuário
fn read_input() -> String {
    let mut input = String::new();
    print!("> ");
    io::stdout().flush().unwrap();
    io::stdin().read_line(&mut input).expect("Falha ao ler entrada");
    input.trim().to_string()
}
"#;
            self.rust_code.push_str(read_input_fn);
            self.added_read_input = true;
        }

        Ok(self.rust_code.clone())
    }

    // Verifica se há chamadas para ler_escolha no código
    fn has_read_input_call(&self) -> bool {
        self.rust_code.contains("read_input()")
    }

    // Escreve texto no código Rust
    fn write(&mut self, text: &str) -> Result<()> {
        for _ in 0..self.indent_level {
            self.rust_code.push_str("    ");
        }
        self.rust_code.push_str(text);
        Ok(())
    }

    // Traduz uma instrução
    fn statement(&mut self, stmt: &Statement) -> Result<()> {
        match stmt {
            Statement::VarDeclaration { is_mutable, name, initializer } => {
                self.write(if *is_mutable { "let mut " } else { "let " })?;
                self.write(name)?;
                
                if let Some(expr) = initializer {
                    self.write(" = ")?;
                    self.expression(expr)?;
                }
                
                self.write(";")?;
            },
            Statement::FunctionDeclaration { name, params, body, is_async } => {
                let prev_in_function = self.in_function;
                self.in_function = true;
                
                let prev_async = self.async_context;
                self.async_context = *is_async;
                
                if *is_async {
                    self.add_import("use std::future::Future;");
                    self.add_import("use async_trait::async_trait;");
                }
                
                self.indent_level -= if !prev_in_function && self.indent_level > 0 { 1 } else { 0 };
                
                // Verificar se é a função main
                if name == "principal" {
                    self.has_main_function = true;
                    self.write("fn main()")?;
                } else {
                    self.write("fn ")?;
                    self.write(name)?;
                    self.write("(")?;
                    
                    for (i, param) in params.iter().enumerate() {
                        if i > 0 {
                            self.write(", ")?;
                        }
                        self.write(param)?;
                        self.write(": impl std::fmt::Display")?;
                    }
                    
                    self.write(")")?;
                    
                    // Verificar se a função tem um retorno para definir o tipo de retorno
                    let has_return_value = body.iter().any(|s| {
                        if let Statement::ReturnStatement { value } = s {
                            value.is_some()
                        } else {
                            false
                        }
                    });
                    
                    if has_return_value {
                        self.write(" -> String")?;
                    }
                }
                
                self.write(" {")?;
                self.indent_level += 1;
                
                for s in body {
                    self.statement(s)?;
                }
                
                self.indent_level -= 1;
                self.write("}")?;
                
                if !prev_in_function && !self.has_main_function {
                    self.indent_level += 1;
                }
                
                self.async_context = prev_async;
                self.in_function = prev_in_function;
            },
            Statement::ExpressionStatement { expression } => {
                self.expression(expression)?;
                self.write(";")?;
            },
            Statement::ReturnStatement { value } => {
                if let Some(expr) = value {
                    self.write("return ")?;
                    
                    // Para valores String, garantir que o retorno tenha o tipo correto
                    if let Expression::Literal { value: LiteralValue::String(_) } = expr {
                        self.write("String::from(")?;
                        self.expression(expr)?;
                        self.write(")")?;
                    } else {
                        self.expression(expr)?;
                    }
                    
                    self.write(";")?;
                } else {
                    self.write("return;")?;
                }
            },
            Statement::IfStatement { condition, then_branch, else_branch } => {
                self.write("if ")?;
                self.expression(condition)?;
                self.write(" {")?;
                self.indent_level += 1;
                
                for s in then_branch {
                    self.statement(s)?;
                }
                
                self.indent_level -= 1;
                
                if let Some(else_stmts) = else_branch {
                    self.write("} else {")?;
                    self.indent_level += 1;
                    
                    for s in else_stmts {
                        self.statement(s)?;
                    }
                    
                    self.indent_level -= 1;
                    self.write("}")?;
                } else {
                    self.write("}")?;
                }
            },
            
            Statement::WhileStatement { condition, body } => {
                self.write("while ")?;
                self.expression(condition)?;
                self.write(" {")?;
                self.indent_level += 1;
                
                for s in body {
                    self.statement(s)?;
                }
                
                self.indent_level -= 1;
                self.write("}")?;
            },
            _ => {
                self.write("// Tipo de declaração não implementado")?;
            }
        }
        
        Ok(())
    }

    // Verifica se uma expressão é uma string literal
    fn is_string_literal(&self, expr: &Expression) -> bool {
        matches!(expr, Expression::Literal { value: LiteralValue::String(_) })
    }

    // Verifica se uma expressão é ou retorna uma string
    fn is_string_expr(&self, expr: &Expression) -> bool {
        match expr {
            Expression::Literal { value: LiteralValue::String(_) } => true,
            Expression::Call { callee, .. } => {
                if let Expression::Variable { name } = &**callee {
                    // Funções que retornam string
                    name == "ler_escolha"
                } else {
                    false
                }
            },
            _ => false,
        }
    }

    // Melhore o método expression para lidar com concatenações de strings
    fn expression(&mut self, expr: &Expression) -> Result<()> {
        match expr {
            Expression::Literal { value } => {
                match value {
                    LiteralValue::String(s) => self.write(&format!("\"{}\"", s)),
                    LiteralValue::Number(n) => self.write(&n.to_string()),
                    LiteralValue::Bool(b) => self.write(if *b { "true" } else { "false" }),
                    LiteralValue::Null => self.write("None"),
                }
            },
            Expression::Variable { name } => {
                self.write(name)?;
            },
            Expression::Binary { left, operator, right } => {
                // Caso especial para concatenação de strings
                if matches!(operator, BinaryOperator::Add) {
                    // Verificando se estamos em contexto de print
                    if self.is_printing_context && self.is_string_literal(left) {
                        // Formato para concatenação no println
                        if let Expression::Literal { value: LiteralValue::String(s) } = &**left {
                            self.write(&format!("\"{}{{}}\"", s))?;
                            self.write(", ")?;
                            self.expression(right)?;
                        }
                    } else {
                        // Verificar se ambos os lados são do mesmo tipo
                        let is_left_string = self.is_string_expr(left);
                        let is_right_string = self.is_string_expr(right);
                        
                        // Se pelo menos um dos lados for string, usar concatenação de strings
                        if is_left_string || is_right_string {
                            self.write("format!(\"{}{}\", ")?;
                            self.expression(left)?;
                            self.write(", ")?;
                            self.expression(right)?;
                            self.write(")")?;
                        } else {
                            // Operação numérica normal
                            self.expression(left)?;
                            self.write(" + ")?;
                            self.expression(right)?;
                        }
                    }
                } else {
                    // Expressão binária normal
                    self.expression(left)?;
                    
                    match operator {
                        BinaryOperator::Add => self.write(" + "),
                        BinaryOperator::Subtract => self.write(" - "),
                        BinaryOperator::Multiply => self.write(" * "),
                        BinaryOperator::Divide => self.write(" / "),
                        BinaryOperator::Modulo => self.write(" % "),
                        BinaryOperator::Equal => self.write(" == "),
                        BinaryOperator::NotEqual => self.write(" != "),
                        BinaryOperator::Greater => self.write(" > "),
                        BinaryOperator::Less => self.write(" < "),
                        BinaryOperator::GreaterEqual => self.write(" >= "),
                        BinaryOperator::LessEqual => self.write(" <= "),
                        BinaryOperator::And => self.write(" && "),
                        BinaryOperator::Or => self.write(" || "),
                    }
                    
                    self.expression(right)?;
                }
            },
            Expression::Call { callee, arguments } => {
                // Caso especial para ler_escolha() (entrada do usuário)
                if let Expression::Variable { name } = &**callee {
                    if name == "ler_escolha" {
                        self.write("read_input()")?;
                        return Ok(());
                    }
                }
                
                // Tratamento especial para prosa (println!)
                if let Expression::Variable { name } = &**callee {
                    if name == "prosa" {
                        self.is_printing_context = true;
                        
                        self.write("println!")?;
                        self.write("(")?;
                        
                        if !arguments.is_empty() {
                            // Se é uma expressão binária com string + variável
                            if let Expression::Binary { left, operator: BinaryOperator::Add, right } = &arguments[0] {
                                if self.is_string_literal(left) {
                                    // Para "texto " mais variável
                                    if let Expression::Literal { value: LiteralValue::String(s) } = &**left {
                                        self.write(&format!("\"{}{{}}\"", s))?;
                                        self.write(", ")?;
                                        self.expression(right)?;
                                    }
                                } else if let Expression::Binary { left: left_inner, operator: BinaryOperator::Add, right: right_inner } = &**left {
                                    // Para expressões encadeadas como "texto " mais variável mais " mais texto"
                                    if self.is_string_literal(left_inner) {
                                        if let Expression::Literal { value: LiteralValue::String(s) } = &**left_inner {
                                            self.write(&format!("\"{}{{}} {{}}\"", s))?;
                                            self.write(", ")?;
                                            self.expression(right_inner)?;
                                            self.write(", ")?;
                                            self.expression(right)?;
                                        }
                                    } else {
                                        // Caso genérico para outras expressões binárias
                                        self.write("\"{}\"")?;
                                        self.write(", ")?;
                                        self.expression(&arguments[0])?;
                                    }
                                } else {
                                    // Caso genérico para outras expressões binárias
                                    self.write("\"{}\"")?;
                                    self.write(", ")?;
                                    self.expression(&arguments[0])?;
                                }
                            } else if let Expression::Literal { value: LiteralValue::String(s) } = &arguments[0] {
                                // String literal simples
                                self.write(&format!("\"{}\"", s))?;
                            } else {
                                // Outros tipos de expressões
                                self.write("\"{}\"")?;
                                self.write(", ")?;
                                self.expression(&arguments[0])?;
                            }
                        }
                        
                        self.write(")")?;
                        self.is_printing_context = false;
                    } else {
                        // Chamadas de função regulares
                        self.expression(callee)?;
                        self.write("(")?;
                        
                        for (i, arg) in arguments.iter().enumerate() {
                            if i > 0 {
                                self.write(", ")?;
                            }
                            self.expression(arg)?;
                        }
                        
                        self.write(")")?;
                    }
                } else {
                    // Chamada de método ou outras chamadas
                    self.expression(callee)?;
                    self.write("(")?;
                    
                    for (i, arg) in arguments.iter().enumerate() {
                        if i > 0 {
                            self.write(", ")?;
                        }
                        self.expression(arg)?;
                    }
                    
                    self.write(")")?;
                }
            },
            Expression::Assignment { name, value } => {
                // Implementação para expressão de atribuição (contador é valor)
                self.write(name)?;
                self.write(" = ")?;
                self.expression(value)?;
            },
            _ => {
                self.write("/* expressão não implementada */")?;
            }
        }
        
        Ok(())
    }
}

// Função pública principal
pub fn translate(program: &Program) -> Result<String> {
    let mut translator = Translator::new();
    translator.translate_program(program)
}