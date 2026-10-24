// Cenários para análise. Não há probabilidades de substituição: a atividade pede que o estudante
// identifique tarefas, avalie o que poderia ser automatizado e proponha adaptações.

export const SCENARIOS = [
  {
    id: 'recepcao-clinica',
    title: 'Recepção de uma clínica',
    context: 'A recepção marca consultas, envia lembretes, confirma presenças e atende dúvidas básicas por telefone e mensagem.',
    tasks: [
      { id: 't1', label: 'Enviar lembretes de consulta em horário fixo', automatable: true },
      { id: 't2', label: 'Confirmar presença pelo sistema a partir de uma resposta padrão', automatable: true },
      { id: 't3', label: 'Acolher um paciente em situação de ansiedade', automatable: false },
      { id: 't4', label: 'Resolver um caso de agenda com regras especiais', automatable: false },
    ],
    prompt: 'Quais tarefas seriam mais fáceis de automatizar? Que habilidades humanas continuam essenciais no atendimento?',
  },
  {
    id: 'contabilidade',
    title: 'Escritório de contabilidade',
    context: 'A equipe organiza notas fiscais, lança dados em planilhas, confere informações e conversa com clientes sobre prazos e dúvidas.',
    tasks: [
      { id: 't1', label: 'Lançar notas fiscais padronizadas em um sistema', automatable: true },
      { id: 't2', label: 'Conferir se os valores batem entre dois documentos', automatable: true },
      { id: 't3', label: 'Orientar um cliente sobre uma situação tributária atípica', automatable: false },
      { id: 't4', label: 'Interpretar mudanças recentes na legislação', automatable: false },
    ],
    prompt: 'Que tarefas poderiam ser automatizadas sem perda de qualidade? Que nova função poderia surgir na equipe?',
  },
  {
    id: 'loja-varejo',
    title: 'Loja de varejo',
    context: 'Os funcionários repõem estoque, respondem clientes, registram vendas e fazem o relatório semanal de vendas.',
    tasks: [
      { id: 't1', label: 'Gerar o relatório semanal de vendas a partir do caixa', automatable: true },
      { id: 't2', label: 'Sugerir reposição quando o estoque chega a um mínimo', automatable: true },
      { id: 't3', label: 'Ajudar um cliente a escolher um produto para uma ocasião', automatable: false },
      { id: 't4', label: 'Decidir uma promoção considerando o contexto local', automatable: false },
    ],
    prompt: 'Como a automação mudaria o trabalho da equipe? Que competência precisaria crescer?',
  },
];

export function findScenario(id) {
  return SCENARIOS.find((s) => s.id === id) ?? null;
}
