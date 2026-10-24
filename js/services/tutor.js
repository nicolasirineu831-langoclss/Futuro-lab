// Tutor IA.
// - Se TUTOR_ENDPOINT estiver configurado (backend próprio que chama a API de IA), as perguntas são enviadas para lá.
//   A chave de API fica somente no servidor. Nunca no código do navegador.
// - Sem endpoint, o tutor opera em MODO DEMONSTRAÇÃO: respostas previamente escritas, sem IA real.
import { TUTOR_ENDPOINT } from '../config.js';

const PREPARED = [
  {
    keywords: ['variável', 'variavel'],
    answer: 'Variável é um nome que guarda um valor. Exemplo: let idade = 17; guarda o número 17 sob o nome "idade". Você pode trocar o valor depois, mas é bom manter o mesmo tipo.',
    suggestion: { label: 'Aula: variáveis e tipos', href: '#/aula/introducao-programacao/ip-m2-a1' },
  },
  {
    keywords: ['condicional', 'if', 'decisão', 'decisao'],
    answer: 'Uma condicional executa um bloco apenas se a condição for verdadeira. Pense em: "se a nota for 7 ou mais, aprovado; senão, recuperação". Tente escrever essa regra com if e else antes de olhar a solução.',
    suggestion: { label: 'Aula: condicionais', href: '#/aula/logica-algoritmos/la-m1-a2' },
  },
  {
    keywords: ['laço', 'laco', 'repetição', 'repeticao', 'for', 'while'],
    answer: 'Laços repetem um bloco enquanto a condição valer, ou para cada item de uma lista. Antes de escrever, responda: quantas vezes preciso repetir e o que muda a cada volta?',
    suggestion: { label: 'Aula: repetições', href: '#/aula/logica-algoritmos/la-m2-a1' },
  },
  {
    keywords: ['função', 'funcao', 'function'],
    answer: 'Uma função agrupa passos com um nome, recebe dados (parâmetros) e pode devolver um resultado com return. Se um trecho aparece mais de uma vez, ele costuma virar função.',
    suggestion: { label: 'Aula: funções', href: '#/aula/logica-algoritmos/la-m2-a2' },
  },
  {
    keywords: ['algoritmo'],
    answer: 'Algoritmo é uma sequência finita de passos claros para resolver um problema. Um bom teste é explicar o algoritmo a alguém sem usar código.',
    suggestion: { label: 'Aula: o que é um algoritmo', href: '#/aula/logica-algoritmos/la-m1-a1' },
  },
  {
    keywords: ['automação', 'automacao', 'automatizar'],
    answer: 'Automatizar é executar tarefas repetitivas segundo regras definidas. Tarefas com entrada previsível e regras claras são as candidatas mais comuns. Tarefas que exigem julgamento em situações novas são mais difíceis.',
    suggestion: { label: 'Aula: o que significa automatizar', href: '#/aula/automacao/au-m1-a1' },
  },
  {
    keywords: ['inteligência artificial', 'inteligencia artificial', 'ia', 'machine learning', 'aprendizado de máquina'],
    answer: 'Inteligência artificial é um campo amplo. Aprendizado de máquina é uma abordagem em que o sistema ajusta seu comportamento a partir de dados. Nem todo sistema "inteligente" aprende: alguns seguem apenas regras fixas.',
    suggestion: { label: 'Aula: IA, aprendizado e automação', href: '#/aula/fundamentos-ia/ia-m1-a1' },
  },
  {
    keywords: ['erro', 'bug', 'não funciona', 'nao funciona'],
    answer: 'Para encontrar um erro, reduza o problema: rode com um caso simples, mostre valores intermediários com console.log e compare com o esperado. Qual mensagem de erro aparece?',
  },
];

const FALLBACK = {
  answer: 'Nesta demonstração eu tenho respostas preparadas apenas para alguns temas: variáveis, condicionais, laços, funções, algoritmos, automação e IA. Tente reformular a pergunta com um desses termos.',
};

export function tutorMode() {
  return TUTOR_ENDPOINT ? 'api' : 'demo';
}

// Correspondência por palavra inteira (evita que "for" case com "formato").
function matches(question, keyword) {
  const normalized = question.toLowerCase();
  if (keyword.includes(' ')) return normalized.includes(keyword);
  const tokens = normalized.split(/[^\p{L}]+/u);
  return tokens.includes(keyword);
}

function demoAnswer(question) {
  const match = PREPARED.find((item) => item.keywords.some((k) => matches(question, k)));
  return match ? { text: match.answer, suggestion: match.suggestion ?? null } : { text: FALLBACK.answer, suggestion: null };
}

// Retorna sempre uma Promise com { text, suggestion, mode }. Erros viram mensagem clara, não exceção silenciosa.
export async function askTutor(question) {
  if (!TUTOR_ENDPOINT) {
    return { ...demoAnswer(question), mode: 'demo' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(TUTOR_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`status ${response.status}`);
    const data = await response.json();
    return { text: String(data.answer ?? ''), suggestion: null, mode: 'api' };
  } catch (error) {
    const reason = error.name === 'AbortError' ? 'O tutor demorou para responder.' : 'Não foi possível falar com o tutor agora.';
    return { text: `${reason} Tente novamente em instantes.`, suggestion: null, mode: 'error' };
  } finally {
    clearTimeout(timer);
  }
}
