class Animal { constructor(nome) { this.nome = nome; } falar() { return `${this.nome} faz barulho`; } }
class Cachorro extends Animal { falar() { return `${super.falar()} - au au`; } }
console.log(new Cachorro("Rex").falar());