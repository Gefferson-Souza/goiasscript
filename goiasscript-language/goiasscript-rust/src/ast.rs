use std::fmt;

#[derive(Debug, Clone)]
pub enum Statement {
    VarDeclaration {
        is_mutable: bool,
        name: String,
        initializer: Option<Expression>,
    },
    FunctionDeclaration {
        name: String,
        params: Vec<String>,
        body: Vec<Statement>,
        is_async: bool,
    },
    ReturnStatement {
        value: Option<Expression>,
    },
    IfStatement {
        condition: Expression,
        then_branch: Vec<Statement>,
        else_branch: Option<Vec<Statement>>,
    },
    WhileStatement {
        condition: Expression,
        body: Vec<Statement>,
    },
    ForStatement {
        initializer: Option<Box<Statement>>,
        condition: Option<Expression>,
        increment: Option<Expression>,
        body: Vec<Statement>,
    },
    ExpressionStatement {
        expression: Expression,
    },
    Block {
        statements: Vec<Statement>,
    },
    TryStatement {
        try_block: Vec<Statement>,
        catch_var: String,
        catch_block: Vec<Statement>,
    },
    BreakStatement,
    ContinueStatement,
}

#[derive(Debug, Clone)]
pub enum Expression {
    Literal {
        value: LiteralValue,
    },
    Variable {
        name: String,
    },
    Binary {
        left: Box<Expression>,
        operator: BinaryOperator,
        right: Box<Expression>,
    },
    Unary {
        operator: UnaryOperator,
        right: Box<Expression>,
    },
    Call {
        callee: Box<Expression>,
        arguments: Vec<Expression>,
    },
    GetProperty {
        object: Box<Expression>,
        property: String,
    },
    SetProperty {
        object: Box<Expression>,
        property: String,
        value: Box<Expression>,
    },
    Array {
        elements: Vec<Expression>,
    },
    Object {
        properties: Vec<(String, Expression)>,
    },
    Await {
        expression: Box<Expression>,
    },
    Assignment {
        name: String,
        value: Box<Expression>,
    },
}

#[derive(Debug, Clone)]
pub enum LiteralValue {
    String(String),
    Number(f64),
    Bool(bool),
    Null,
}

#[derive(Debug, Clone, Copy)]
pub enum BinaryOperator {
    Add,
    Subtract,
    Multiply,
    Divide,
    Modulo,
    Equal,
    NotEqual,
    Greater,
    Less,
    GreaterEqual,
    LessEqual,
    And,
    Or,
}

#[derive(Debug, Clone, Copy)]
pub enum UnaryOperator {
    Not,
    Negate,
}

impl fmt::Display for LiteralValue {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            LiteralValue::String(s) => write!(f, "\"{}\"", s),
            LiteralValue::Number(n) => write!(f, "{}", n),
            LiteralValue::Bool(b) => write!(f, "{}", if *b { "true" } else { "false" }),
            LiteralValue::Null => write!(f, "None"),
        }
    }
}

// AST de programa completo
#[derive(Debug)]
pub struct Program {
    pub statements: Vec<Statement>,
}