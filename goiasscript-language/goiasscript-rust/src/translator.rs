// Remova os imports não utilizados
use crate::ast::*;
// use crate::keywords::KEYWORDS; 
// use std::collections::HashMap;
use anyhow::Result;

pub struct RustTranslator {
    output: String,
    indent: usize,
    imports: Vec<String>,
    async_context: bool,
    is_printing_context: bool,
    has_main_function: bool,
    in_function: bool, 
}

impl RustTranslator {
    pub fn new() -> Self {
        RustTranslator {
            output: String::new(),
            indent: 0,
            imports: vec![],
            async_context: false,
            is_printing_context: false,
            has_main_function: false,
            in_function: false,
        }
    }

    pub fn translate(&mut self, program: Program) -> Result<String> {
        // Adicionar cabeçalho padrão
        self.write_line("// Código gerado automaticamente pelo compilador GoiásScript");
        self.write_line("// Data: 2025-04-13 06:45:02");
        self.write_line("// Autor: Gefferson-Souza");
        self.write_line("");
        
        // Imports padrão
        self.add_import("use std::io::{self, Write};");
        
        // Verificar se já há uma função main no programa
        self.has_main_function = program.statements.iter().any(|stmt| {
            if let Statement::FunctionDeclaration { name, .. } = stmt {
                name == "main"
            } else {
                false
            }
        });
        
        // Se não há uma função main, abrir uma
        if !self.has_main_function {
            self.write_line("fn main() {");
            self.indent += 1;
        }
        
        // Traduzir todas as declarações
        for stmt in program.statements {
            self.statement(&stmt)?;
        }
        
        // Se abrimos uma função main, fechá-la
        if !self.has_main_function {
            self.indent -= 1;
            self.write_line("}");
        }
        
        // Consolidar o resultado
        let mut result = String::new();
        
        // Adicionar imports
        for import in &self.imports {
            result.push_str(import);
            result.push('\n');
        }
        if !self.imports.is_empty() {
            result.push('\n');
        }
        
        result.push_str(&self.output);
        
        Ok(result)
    }

    fn statement(&mut self, stmt: &Statement) -> Result<()> {
        match stmt {
            Statement::VarDeclaration { is_mutable, name, initializer } => {
                self.write(if *is_mutable { "let mut " } else { "let " });
                self.write(name);
                
                if let Some(expr) = initializer {
                    self.write(" = ");
                    self.expression(expr)?;
                }
                
                self.write_line(";");
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
                
                self.indent -= if !prev_in_function && self.indent > 0 { 1 } else { 0 };
                self.write("fn ");
                self.write(name);
                self.write("(");
                
                for (i, param) in params.iter().enumerate() {
                    if i > 0 {
                        self.write(", ");
                    }
                    self.write(param);
                    self.write(": impl std::fmt::Display");
                }
                
                self.write_line(") {");
                self.indent += 1;
                
                for s in body {
                    self.statement(s)?;
                }
                
                self.indent -= 1;
                self.write_line("}");
                
                if !prev_in_function && !self.has_main_function {
                    self.indent += 1;
                }
                
                self.async_context = prev_async;
                self.in_function = prev_in_function;
            },
            Statement::ExpressionStatement { expression } => {
                self.expression(expression)?;
                self.write_line(";");
            },
            Statement::ReturnStatement { value } => {
                if let Some(expr) = value {
                    self.write("return ");
                    self.expression(expr)?;
                    self.write_line(";");
                } else {
                    self.write_line("return;");
                }
            },
            Statement::IfStatement { condition, then_branch, else_branch } => {
                self.write("if ");
                self.expression(condition)?;
                self.write_line(" {");
                self.indent += 1;
                
                for s in then_branch {
                    self.statement(s)?;
                }
                
                self.indent -= 1;
                
                if let Some(else_stmts) = else_branch {
                    self.write_line("} else {");
                    self.indent += 1;
                    
                    for s in else_stmts {
                        self.statement(s)?;
                    }
                    
                    self.indent -= 1;
                    self.write_line("}");
                } else {
                    self.write_line("}");
                }
            },
            
            Statement::WhileStatement { condition, body } => {
                self.write("while ");
                self.expression(condition)?;
                self.write_line(" {");
                self.indent += 1;
                
                for s in body {
                    self.statement(s)?;
                }
                
                self.indent -= 1;
                self.write_line("}");
            },
            _ => {
                self.write_line("// Tipo de declaração não implementado");
            }
        }
        
        Ok(())
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
            self.write(name);
        },
        Expression::Binary { left, operator, right } => {
            // Caso especial para concatenação de strings em println
            if self.is_printing_context && matches!(operator, BinaryOperator::Add) && 
               self.is_string_literal(left) {
                // Formato para concatenação no println
                if let Expression::Literal { value: LiteralValue::String(s) } = &**left {
                    self.write(&format!("\"{}{{}}\"", s));
                    self.write(", ");
                    self.expression(right)?;
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
            // Tratamento especial para prosa (println!)
            if let Expression::Variable { name } = &**callee {
                if name == "prosa" {
                    self.is_printing_context = true;
                    
                    self.write("println!");
                    self.write("(");
                    
                    if !arguments.is_empty() {
                        // Se é uma expressão binária com string literal
                        if let Expression::Binary { left, operator: BinaryOperator::Add, right } = &arguments[0] {
                            if self.is_string_literal(left) {
                                if let Expression::Literal { value: LiteralValue::String(s) } = &**left {
                                    self.write(&format!("\"{}{{}}\"", s));
                                    self.write(", ");
                                    self.expression(right)?;
                                }
                            } else {
                                self.expression(&arguments[0])?;
                            }
                        } else if let Expression::Literal { value: LiteralValue::String(s) } = &arguments[0] {
                            // String literal simples
                            self.write(&format!("\"{}\"", s));
                        } else {
                            // Outra expressão
                            self.expression(&arguments[0])?;
                        }
                    }
                    
                    self.write(")");
                    self.is_printing_context = false;
                    return Ok(());
                }
            }
            
            // Chamadas de função normais
            self.expression(callee)?;
            self.write("(");
            
            for (i, arg) in arguments.iter().enumerate() {
                if i > 0 {
                    self.write(", ");
                }
                self.expression(arg)?;
            }
            
            self.write(")");
        },
        _ => {
            self.write("/* expressão não implementada */");
        }
    }
    
    Ok(())
}

// Método auxiliar para verificar se é uma literal string
fn is_string_literal(&self, expr: &Expression) -> bool {
    matches!(expr, Expression::Literal { value: LiteralValue::String(_) })
}

// Métodos auxiliares para escrita
fn write(&mut self, text: &str) {
    self.output.push_str(text);
}

fn write_line(&mut self, text: &str) {
    for _ in 0..self.indent {
        self.output.push_str("    ");
    }
    self.output.push_str(text);
    self.output.push('\n');
}

fn add_import(&mut self, import: &str) {
    if !self.imports.contains(&import.to_string()) {
        self.imports.push(import.to_string());
    }
}
}

pub fn translate(program: Program) -> Result<String> {
let mut translator = RustTranslator::new();
translator.translate(program)
}