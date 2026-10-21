class MeuErro extends Error {}
try { throw new MeuErro("x"); } catch (e) { console.log(e instanceof MeuErro, e.message); } finally { console.log("fim"); }