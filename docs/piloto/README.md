# Piloto da cartilha

Esse kit é pra testar a cartilha do GoiásScript com gente de verdade antes de soltar pro povo. A meta (S8) é simples: **pelo menos 3 aprendizes terminarem as lições 1 a 5**, e a gente descobrir quais mensagens de erro e quais lições deixaram alguém no escuro.

## O que tem aqui

| Arquivo | Pra quê |
|---|---|
| `roteiro.md` | Passo a passo de quem conduz a sessão: o que falar, o que observar, como anotar sem identificar ninguém |
| `formulario-retorno.md` | As perguntas que o aprendiz responde no fim, sobre as mensagens de erro e sobre as lições |
| `modelo-relatorio.md` | Esqueleto do relatório que fecha o piloto |
| `respostas/` | Uma resposta anonimizada por aprendiz, `A1.json`, `A2.json`, até `A9.json` |

## Quem convidar

De 3 a 5 pessoas que nunca viram o GoiásScript. Convida pelo menos uma pessoa **de fora de Goiás**: o goianês precisa fazer sentido pra quem não cresceu ouvindo ele. Isso é só um marcador (`origin`: `goias` ou `fora`), nunca cidade nem nome.

## Como anonimizar

- O aprendiz vira `A1`, `A2`, `A3`... pela ordem em que fez a sessão.
- Nada de nome, e-mail, telefone, cidade, empresa ou foto nos arquivos do repositório.
- Os comentários livres do formulário passam por conferência automática: se tiver e-mail ou telefone, o resumo recusa a resposta.

## Formato de cada resposta

```json
{
  "learnerId": "A1",
  "origin": "goias",
  "lessonsCompleted": ["licao-01", "licao-02", "licao-03", "licao-04", "licao-05"],
  "confusingMessages": [{ "code": "GS0208", "comment": "Não entendi por que o decimal é com ponto." }],
  "confusingLessons": [{ "lessonId": "licao-03", "comment": "Ficou comprida demais." }]
}
```

Nenhum outro campo é aceito.

## Como ver o resultado

Com as respostas salvas em `respostas/`, roda na raiz do repositório:

```bash
corepack pnpm --filter playground exec node scripts/summarize-pilot.ts
```

Sem nenhuma resposta, a saída é `0/3 — pendente do dono`. Quem entrega o retorno dos aprendizes é o dono do projeto; sem ele, o piloto fica pendente e nada mais muda.
