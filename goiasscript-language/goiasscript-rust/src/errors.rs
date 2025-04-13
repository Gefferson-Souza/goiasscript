use std::ops::Range;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum CompileError {
    #[error("Erro de lexer na posição {span:?}: {message}")]
    LexerError {
        span: Range<usize>,
        message: String,
    },
    
    #[error("Erro de parser na posição {span:?}: {message}")]
    ParserError {
        span: Range<usize>,
        message: String,
    },
    
    #[allow(dead_code)]
    #[error("Erro de tradução: {message}")]
    TranslationError {
        message: String,
    },
    
    #[allow(dead_code)]
    #[error("Erro de sistema: {message}")]
    SystemError {
        message: String,
    }
}