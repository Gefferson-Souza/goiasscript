use logos::{Logos, Span};
use crate::errors::CompileError;
use anyhow::Result;

#[derive(Logos, Debug, PartialEq, Clone)]
pub enum TokenKind {
    // Palavras-chave
    #[token("uai")]
    Uai,
    
    #[token("trem")]
    Trem,
    
    #[token("é")]
    E,
    
    #[token("ocê")]
    Oce,
    
    #[token("se_ocê_quiser")]
    SeOceQuiser,
    
    #[token("se_num_for")]
    SeNumFor,
    
    #[token("se_não")]
    SeNao,
    
    #[token("vai_indo")]
    VaiIndo,
    
    #[token("enquanto_tiver")]
    EnquantoTiver,
    
    #[token("para_com_isso")]
    ParaComIsso,
    
    #[token("continua_aí")]
    ContinuaAi,
    
    #[token("presta_serviço")]
    PrestaServico,
    
    #[token("faz_favor")]
    FazFavor,
    
    #[token("vai_na_frente")]
    VaiNaFrente,
    
    #[token("espera_um_cadim")]
    EsperaUmCadim,
    
    #[token("tenta_aí")]
    TentaAi,
    
    #[token("se_der_ruim")]
    SeDerRuim,
    
    #[token("prosa")]
    Prosa,
    
    #[token("reclama")]
    Reclama,
    
    #[token("faz_um")]
    FazUm,
    
    // Operadores
    #[token("e_mais")]
    EMais,
    
    #[token("ou_então")]
    OuEntao,
    
    #[token("num_é")]
    NumE,
    
    #[token("é_igualim")]
    EIgualim,
    
    #[token("diferente")]
    Diferente,
    
    #[token("maior_que")]
    MaiorQue,
    
    #[token("menor_que")]
    MenorQue,
    
    #[token("pelo_menos")]
    PeloMenos,
    
    #[token("no_máximo")]
    NoMaximo,
    
    #[token("mais")]
    Mais,
    
    #[token("menos")]
    Menos,
    
    #[token("vezes")]
    Vezes,
    
    #[token("dividido")]
    Dividido,
    
    #[token("sobrou")]
    Sobrou,
    
    // Valores constantes
    #[token("certeza")]
    Certeza,
    
    #[token("de_jeito_nenhum")]
    DeJeitoNenhum,
    
    #[token("vazio")]
    Vazio,
    
    #[token("sei_lá")]
    SeiLa,
    
    // Delimitadores
    #[token("{")]
    OpenBrace,
    
    #[token("}")]
    CloseBrace,
    
    #[token("(")]
    OpenParen,
    
    #[token(")")]
    CloseParen,
    
    #[token("[")]
    OpenBracket,
    
    #[token("]")]
    CloseBracket,
    
    #[token(";")]
    Semicolon,
    
    #[token(",")]
    Comma,
    
    #[token(".")]
    Dot,
    
    #[token(":")]
    Colon,
    
    // Literais
    #[regex(r#""([^"\\]|\\t|\\u|\\n|\\")*""#)]
    StringLiteral,
    
    #[regex(r"[0-9]+(\.[0-9]+)?")]
    NumberLiteral,
    
    // Identificadores
    #[regex(r"[a-zA-Z_][a-zA-Z0-9_]*")]
    Identifier,
    
    // Comentários e espaços em branco
    #[regex(r"//.*", logos::skip)]
    #[regex(r"/\*([^*]|\*[^/])*\*/", logos::skip)]
    #[regex(r"[ \t\n\r]+", logos::skip)]
    Comment,
    
    // Token desconhecido
    Error,
}

#[derive(Debug, Clone)]
pub struct Token {
    pub kind: TokenKind,
    pub lexeme: String,
    pub span: Span,
}

pub fn tokenize(source: &str) -> Result<Vec<Token>> {
    let mut lexer = TokenKind::lexer(source);
    let mut tokens = Vec::new();
    
    // next() retorna Option<Result<TokenKind, ()>>
    while let Some(result) = lexer.next() {
        let span = lexer.span();
        let lexeme = lexer.slice().to_string();
        
        match result {
            Ok(kind) => {
                if kind == TokenKind::Error {
                    return Err(CompileError::LexerError { 
                        span, 
                        message: format!("Token inválido: '{}'", lexeme) 
                    }.into());
                }
                
                tokens.push(Token {
                    kind,
                    lexeme,
                    span,
                });
            },
            Err(_) => {
                return Err(CompileError::LexerError { 
                    span, 
                    message: format!("Token inválido: '{}'", lexeme) 
                }.into());
            }
        }
    }
    
    Ok(tokens)
}