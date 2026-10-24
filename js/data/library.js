// Materiais próprios da plataforma (resumos escritos para este projeto).
// Referências: apenas autor, título e ano em que a obra original foi publicada, conforme
// citadas no documento-base. Não atribuímos a elas afirmações específicas: o conteúdo original
// não foi consultado para esta versão.

export const MATERIALS = [
  {
    id: 'mat-resumo-algoritmos',
    type: 'Resumo',
    title: 'Resumo: o que é um algoritmo',
    courseId: 'logica-algoritmos',
    summary: 'Algoritmo é uma sequência finita de passos bem definidos. Bons algoritmos têm entradas claras, passos sem ambiguidade e um resultado que pode ser verificado.',
  },
  {
    id: 'mat-guia-testes',
    type: 'Guia prático',
    title: 'Guia: como testar uma função',
    courseId: 'programacao-problemas',
    summary: 'Escreva três casos: um comum, um limite (como zero ou lista vazia) e um inválido. Compare o resultado com o esperado e corrija uma coisa por vez.',
  },
  {
    id: 'mat-apostila-ia',
    type: 'Apostila',
    title: 'Apostila: conceitos de IA em linguagem simples',
    courseId: 'fundamentos-ia',
    summary: 'Automação segue regras. Aprendizado de máquina ajusta o comportamento a partir de dados. A qualidade dos dados define, em grande parte, a qualidade do resultado.',
  },
  {
    id: 'mat-infografico-trabalho',
    type: 'Infográfico',
    title: 'Infográfico: tarefas que mudam, competências que pesam',
    courseId: 'futuro-do-trabalho',
    summary: 'Em vez de perguntar qual profissão vai desaparecer, pergunte quais tarefas de uma profissão mudam e quais competências ajudam a acompanhar essa mudança.',
  },
  {
    id: 'mat-guia-web',
    type: 'Guia prático',
    title: 'Guia: estrutura mínima de uma página',
    courseId: 'desenvolvimento-web',
    summary: 'Uma página mínima tem doctype, html, head com título e meta viewport, e body com o conteúdo. Use main para o conteúdo principal e teste em telas pequenas.',
  },
];

export const REFERENCES = [
  {
    id: 'ref-brynjolfsson',
    authors: 'Erik Brynjolfsson e Andrew McAfee',
    title: 'A Segunda Era das Máquinas',
    originalYear: 2014,
    note: 'Referência do documento-base. Conteúdo não reproduzido nesta plataforma.',
  },
  {
    id: 'ref-frey',
    authors: 'Carl Benedikt Frey e Michael A. Osborne',
    title: 'The Future of Employment',
    originalYear: 2013,
    note: 'Referência do documento-base. Estimativas desse estudo são debatidas por outros autores; consulte o original antes de citar.',
  },
  {
    id: 'ref-schwab',
    authors: 'Klaus Schwab',
    title: 'A Quarta Revolução Industrial',
    originalYear: 2016,
    note: 'Referência do documento-base. Conteúdo não reproduzido nesta plataforma.',
  },
  {
    id: 'ref-oit',
    authors: 'Organização Internacional do Trabalho (OIT)',
    title: 'Relatórios sobre o futuro do trabalho',
    originalYear: null,
    note: 'Consulte o site oficial da OIT para as edições disponíveis.',
  },
  {
    id: 'ref-ocde',
    authors: 'Organização para a Cooperação e Desenvolvimento Econômico (OCDE)',
    title: 'Estudos sobre automação e emprego',
    originalYear: null,
    note: 'Consulte o site oficial da OCDE para as publicações disponíveis.',
  },
];
