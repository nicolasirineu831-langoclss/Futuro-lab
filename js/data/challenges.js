// Desafios do laboratório. Cada função é testada com casos definidos (args + expected).
// A comparação é feita com JSON.stringify, então arrays e objetos são comparados pelo conteúdo.

export const CHALLENGES = [
  {
    id: 'ola-mundo',
    title: 'Olá, mundo',
    level: 'Iniciante',
    functionName: 'ola',
    statement: 'Crie a função ola() que retorna exatamente o texto "Olá, mundo!".',
    starter: 'function ola() {\n  // escreva seu código aqui\n}\n',
    hints: ['Use return para devolver o texto.', 'O texto deve ter exatamente a mesma pontuação: vírgula e exclamação.'],
    solution: 'function ola() {\n  // return devolve o valor para quem chamou a função\n  return "Olá, mundo!";\n}',
    tests: [{ args: [], expected: 'Olá, mundo!' }],
  },
  {
    id: 'soma',
    title: 'Somar dois números',
    level: 'Iniciante',
    functionName: 'soma',
    statement: 'Crie soma(a, b) que devolve a soma dos dois números.',
    starter: 'function soma(a, b) {\n  // escreva seu código aqui\n}\n',
    hints: ['Use o operador +.', 'Não esqueça de devolver o resultado com return.'],
    solution: 'function soma(a, b) {\n  // a soma é o resultado devolvido\n  return a + b;\n}',
    tests: [
      { args: [2, 3], expected: 5 },
      { args: [-4, 10], expected: 6 },
      { args: [0, 0], expected: 0 },
    ],
  },
  {
    id: 'par-ou-impar',
    title: 'Par ou ímpar',
    level: 'Iniciante',
    functionName: 'parOuImpar',
    statement: 'Crie parOuImpar(n) que devolve "par" ou "ímpar" conforme o número. Use o operador % (resto da divisão).',
    starter: 'function parOuImpar(n) {\n  // escreva seu código aqui\n}\n',
    hints: ['O resto de n dividido por 2 é 0 quando n é par.', 'Use uma condicional if/else para escolher o texto.'],
    solution: 'function parOuImpar(n) {\n  // n % 2 === 0 indica número par\n  if (n % 2 === 0) {\n    return "par";\n  }\n  return "ímpar";\n}',
    tests: [
      { args: [4], expected: 'par' },
      { args: [7], expected: 'ímpar' },
      { args: [0], expected: 'par' },
    ],
  },
  {
    id: 'maior-da-lista',
    title: 'Maior número da lista',
    level: 'Intermediário',
    functionName: 'maior',
    statement: 'Crie maior(lista) que devolve o maior número de uma lista não vazia, sem usar Math.max.',
    starter: 'function maior(lista) {\n  // escreva seu código aqui\n}\n',
    hints: ['Comece assumindo que o primeiro item é o maior.', 'Percorra a lista com um laço e troque o maior sempre que achar um item maior.'],
    solution: 'function maior(lista) {\n  // começa pelo primeiro item e compara com os demais\n  let atual = lista[0];\n  for (const n of lista) {\n    if (n > atual) atual = n;\n  }\n  return atual;\n}',
    tests: [
      { args: [[3, 9, 2]], expected: 9 },
      { args: [[-5, -1, -8]], expected: -1 },
      { args: [[7]], expected: 7 },
    ],
  },
  {
    id: 'contar-vogais',
    title: 'Contar vogais',
    level: 'Intermediário',
    functionName: 'contarVogais',
    statement: 'Crie contarVogais(texto) que devolve quantas vogais (a, e, i, o, u, sem acentos) existem no texto, sem diferenciar maiúsculas de minúsculas.',
    starter: 'function contarVogais(texto) {\n  // escreva seu código aqui\n}\n',
    hints: ['Converta o texto para minúsculas com toLowerCase().', 'Percorra cada letra e verifique se ela está em "aeiou".'],
    solution: 'function contarVogais(texto) {\n  // padroniza para minúsculas e conta cada vogal encontrada\n  let total = 0;\n  for (const letra of texto.toLowerCase()) {\n    if ("aeiou".includes(letra)) total += 1;\n  }\n  return total;\n}',
    tests: [
      { args: ['Programação'], expected: 4 },
      { args: ['xyz'], expected: 0 },
      { args: ['AEIOU'], expected: 5 },
    ],
  },
  {
    id: 'resumo-vendas',
    title: 'Automatizar um relatório de vendas',
    level: 'Intermediário',
    functionName: 'resumirVendas',
    statement:
      'Tarefa hipotética: um relatório diário de vendas é preparado à mão. Crie resumirVendas(valores) que devolve um objeto { total, media } com a soma dos valores e a média arredondada para 2 casas decimais. Se a lista estiver vazia, devolva { total: 0, media: 0 }.',
    starter: 'function resumirVendas(valores) {\n  // escreva seu código aqui\n}\n',
    hints: ['Some os valores com um laço.', 'A média é total dividido pela quantidade de valores. Use toFixed(2) e Number() para arredondar.', 'Trate a lista vazia antes de dividir.'],
    solution:
      'function resumirVendas(valores) {\n  // lista vazia: evita divisão por zero\n  if (valores.length === 0) return { total: 0, media: 0 };\n  let total = 0;\n  for (const v of valores) total += v;\n  const media = Number((total / valores.length).toFixed(2));\n  return { total, media };\n}',
    tests: [
      { args: [[100, 200, 300]], expected: { total: 600, media: 200 } },
      { args: [[10, 20]], expected: { total: 30, media: 15 } },
      { args: [[]], expected: { total: 0, media: 0 } },
    ],
  },
];

export function findChallenge(id) {
  return CHALLENGES.find((c) => c.id === id) ?? null;
}
