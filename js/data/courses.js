// Conteúdo didático introdutório. Material de demonstração: revise antes de uso formal.
// Aulas sem "videoUrl" são em texto. Vídeos só são exibidos de hosts de incorporação permitidos.
//
// Tipos de questão de prova:
//   mc     -> múltipla escolha: { options, answer (índice) }
//   vf     -> verdadeiro ou falso: { answer (boolean) }
//   assoc  -> associação: { pairs: [[conceito, definição], ...] } (a ordem das definições é embaralhada na tela)

export const COURSES = [
  {
    id: 'introducao-programacao',
    title: 'Introdução à programação',
    category: 'Programação',
    level: 'Iniciante',
    hours: 6,
    hue: 210,
    description: 'Entenda o que é um programa, como o computador segue instruções e escreva seus primeiros códigos.',
    objectives: ['Explicar o que é um programa', 'Usar variáveis e tipos de dados básicos', 'Ler dados do usuário e mostrar resultados'],
    modules: [
      {
        id: 'ip-m1',
        title: 'O que é programar',
        lessons: [
          {
            id: 'ip-m1-a1',
            title: 'Programas são listas de instruções',
            body: [
              'Um programa é um conjunto de instruções escritas em uma linguagem que o computador consegue executar. Cada instrução faz uma coisa pequena e precisa, como somar dois números ou mostrar uma mensagem.',
              'Quando você escreve um programa, está descrevendo, passo a passo, o que a máquina deve fazer. Ela não interpreta intenções: segue exatamente o que foi escrito.',
            ],
          },
          {
            id: 'ip-m1-a2',
            title: 'Como o computador executa as instruções',
            body: [
              'As instruções são executadas em ordem, de cima para baixo, salvo quando uma estrutura de decisão ou repetição mudar esse fluxo. Esse é o ponto de partida para entender qualquer programa.',
            ],
            example: 'console.log("Primeiro passo");\nconsole.log("Segundo passo");',
          },
        ],
      },
      {
        id: 'ip-m2',
        title: 'Primeiros passos no código',
        lessons: [
          {
            id: 'ip-m2-a1',
            title: 'Variáveis e tipos de dados',
            body: [
              'Uma variável é um nome que guarda um valor. Os tipos mais comuns são número, texto (string) e verdadeiro ou falso (booleano).',
              'O valor de uma variável pode mudar ao longo do programa, mas o tipo costuma ser mantido para evitar erros.',
            ],
            example: 'let idade = 17;\nlet nome = "Ana";\nlet estudante = true;',
          },
          {
            id: 'ip-m2-a2',
            title: 'Entrada e saída de dados',
            body: [
              'Saída é o que o programa mostra ao usuário. Entrada é o que ele recebe. Em um primeiro programa, a saída mais comum é a mensagem no console.',
            ],
            example: 'let nome = "Ana";\nconsole.log("Olá, " + nome + "!");',
            exercise: { prompt: 'Crie uma função que retorne a saudação "Olá, mundo!".', challengeId: 'ola-mundo' },
          },
        ],
      },
    ],
    quiz: {
      id: 'quiz-introducao-programacao',
      title: 'Prova: introdução à programação',
      questions: [
        { type: 'mc', prompt: 'O que é um programa?', options: ['Um tipo de hardware', 'Um conjunto de instruções executáveis', 'Um arquivo de imagem', 'Uma rede de computadores'], answer: 1, explanation: 'Um programa é uma sequência de instruções que o computador executa.' },
        { type: 'vf', prompt: 'Uma variável só pode guardar números.', answer: false, explanation: 'Variáveis podem guardar números, textos, booleanos e outros tipos.' },
        { type: 'assoc', prompt: 'Associe cada tipo ao exemplo correspondente.', pairs: [['Texto', '"Olá"'], ['Número inteiro', '42'], ['Verdadeiro ou falso', 'true']], explanation: 'Texto vai entre aspas, números são escritos sem aspas e booleanos são true ou false.' },
      ],
    },
  },
  {
    id: 'logica-algoritmos',
    title: 'Lógica de programação e algoritmos',
    category: 'Programação',
    level: 'Iniciante',
    hours: 8,
    hue: 260,
    description: 'Aprenda a decompor problemas em passos claros e a representar essas soluções como algoritmos.',
    objectives: ['Descrever soluções como sequências de passos', 'Tomar decisões com condicionais', 'Repetir ações com laços e funções'],
    modules: [
      {
        id: 'la-m1',
        title: 'Pensar em passos',
        lessons: [
          {
            id: 'la-m1-a1',
            title: 'O que é um algoritmo',
            body: [
              'Um algoritmo é uma sequência finita de passos não ambíguos que resolve um problema. Uma receita de bolo é um exemplo cotidiano.',
              'Um bom algoritmo tem entradas definidas, passos claros e um resultado verificável.',
            ],
          },
          {
            id: 'la-m1-a2',
            title: 'Condicionais: tomar decisões',
            body: [
              'Uma condicional executa um bloco de código apenas se uma condição for verdadeira. Com ela, o programa escolhe caminhos diferentes conforme os dados.',
            ],
            example: 'function situacao(nota) {\n  if (nota >= 7) {\n    return "aprovado";\n  } else {\n    return "recuperação";\n  }\n}',
            exercise: { prompt: 'Escreva a função que diz se um número é par ou ímpar.', challengeId: 'par-ou-impar' },
          },
        ],
      },
      {
        id: 'la-m2',
        title: 'Repetir e reutilizar',
        lessons: [
          {
            id: 'la-m2-a1',
            title: 'Repetições',
            body: [
              'Laços de repetição executam um bloco várias vezes. Use-os quando a mesma ação precisa ser feita para cada item de uma coleção.',
            ],
            example: 'let total = 0;\nfor (const n of [1, 2, 3]) {\n  total += n;\n}',
            exercise: { prompt: 'Encontre o maior número de uma lista.', challengeId: 'maior-da-lista' },
          },
          {
            id: 'la-m2-a2',
            title: 'Funções e resolução de problemas',
            body: [
              'Uma função agrupa passos com um nome e pode ser reutilizada. Resolver um problema costuma ser dividi-lo em funções pequenas, cada uma com uma tarefa clara.',
            ],
            example: 'function soma(a, b) {\n  return a + b;\n}',
          },
        ],
      },
    ],
    quiz: {
      id: 'quiz-logica-algoritmos',
      title: 'Prova: lógica e algoritmos',
      questions: [
        { type: 'mc', prompt: 'Qual destas é a melhor descrição de um algoritmo?', options: ['Um programa de computador qualquer', 'Uma sequência finita de passos para resolver um problema', 'Um tipo de variável', 'Um erro de código'], answer: 1, explanation: 'Algoritmo é uma sequência finita de passos bem definidos.' },
        { type: 'vf', prompt: 'Um laço de repetição é usado para executar um bloco várias vezes.', answer: true, explanation: 'Essa é a finalidade dos laços de repetição.' },
        { type: 'mc', prompt: 'Para que serve uma condicional?', options: ['Para guardar textos', 'Para decidir qual caminho seguir, conforme uma condição', 'Para apagar variáveis', 'Para criar arquivos'], answer: 1, explanation: 'Condicionais escolhem caminhos com base em uma condição.' },
      ],
    },
  },
  {
    id: 'fundamentos-ia',
    title: 'Fundamentos da inteligência artificial',
    category: 'Inteligência artificial',
    level: 'Iniciante',
    hours: 4,
    hue: 190,
    description: 'O que a IA faz de fato, o que ela não faz e como interpretar notícias e promessas sobre o tema.',
    objectives: ['Diferenciar IA, aprendizado de máquina e automação', 'Identificar exemplos do cotidiano', 'Avaliar limites e riscos de sistemas inteligentes'],
    modules: [
      {
        id: 'ia-m1',
        title: 'Conceitos',
        lessons: [
          {
            id: 'ia-m1-a1',
            title: 'Inteligência artificial, aprendizado de máquina e automação',
            body: [
              'Automação é executar tarefas segundo regras definidas. Inteligência artificial é um campo amplo que busca sistemas capazes de desempenhar tarefas que exigem algum tipo de percepção ou raciocínio.',
              'Aprendizado de máquina é uma abordagem dentro da IA em que o sistema ajusta seu comportamento a partir de dados, em vez de seguir apenas regras escritas à mão.',
            ],
          },
          {
            id: 'ia-m1-a2',
            title: 'Exemplos do cotidiano',
            body: [
              'Filtros de spam, recomendações de vídeos e correção ortográfica usam técnicas desse campo. Nem todo sistema chamado de "inteligente" aprende com dados: alguns seguem apenas regras fixas.',
            ],
          },
        ],
      },
      {
        id: 'ia-m2',
        title: 'Dados e limites',
        lessons: [
          {
            id: 'ia-m2-a1',
            title: 'Dados são a matéria-prima',
            body: [
              'Sistemas de aprendizado dependem de dados. A qualidade, a quantidade e a representatividade desses dados influenciam diretamente o resultado.',
            ],
          },
          {
            id: 'ia-m2-a2',
            title: 'Erros e vieses',
            body: [
              'Sistemas podem errar e reproduzir vieses presentes nos dados. Por isso, avaliar resultados com cuidado, em diferentes grupos de pessoas, faz parte do trabalho de quem usa IA.',
            ],
          },
        ],
      },
    ],
    quiz: {
      id: 'quiz-fundamentos-ia',
      title: 'Prova: fundamentos da IA',
      questions: [
        { type: 'vf', prompt: 'Todo sistema automatizado é necessariamente um sistema que aprende com dados.', answer: false, explanation: 'Automação pode seguir apenas regras fixas, sem aprendizado.' },
        { type: 'mc', prompt: 'O que caracteriza o aprendizado de máquina?', options: ['Seguir apenas regras escritas à mão', 'Ajustar o comportamento a partir de dados', 'Funcionar sem energia', 'Não cometer erros'], answer: 1, explanation: 'O sistema ajusta seu comportamento com base em dados.' },
        { type: 'assoc', prompt: 'Associe cada conceito à descrição.', pairs: [['Automação', 'Executa tarefas segundo regras definidas'], ['Aprendizado de máquina', 'Ajusta comportamento a partir de dados'], ['Viés', 'Erro sistemático herdado dos dados']], explanation: 'São três conceitos distintos que costumam ser confundidos.' },
      ],
    },
  },
  {
    id: 'automacao',
    title: 'Automação e suas aplicações',
    category: 'Automação',
    level: 'Iniciante',
    hours: 5,
    hue: 165,
    description: 'Como tarefas repetitivas são automatizadas em escritórios, indústrias e serviços, e quais habilidades essa mudança exige.',
    objectives: ['Identificar tarefas que podem ser automatizadas', 'Entender fluxos de trabalho automatizados', 'Relacionar automação e novas funções profissionais'],
    modules: [
      {
        id: 'au-m1',
        title: 'Fundamentos da automação',
        lessons: [
          {
            id: 'au-m1-a1',
            title: 'O que significa automatizar',
            body: [
              'Automatizar é fazer uma tarefa acontecer sem intervenção humana a cada passo, a partir de regras definidas. Tarefas repetitivas e bem descritas são as candidatas mais comuns.',
            ],
          },
          {
            id: 'au-m1-a2',
            title: 'Tarefas repetitivas e regras',
            body: [
              'Uma tarefa é boa candidata quando sua entrada é previsível, as regras são claras e o erro é fácil de detectar. Tarefas que exigem julgamento em situações novas são mais difíceis de automatizar.',
            ],
          },
        ],
      },
      {
        id: 'au-m2',
        title: 'Aplicações e pessoas',
        lessons: [
          {
            id: 'au-m2-a1',
            title: 'Automação em diferentes setores',
            body: [
              'Automação aparece em contabilidade, logística, atendimento, saúde e indústria. Em cada setor, ela muda o tipo de trabalho realizado, não apenas a quantidade.',
            ],
          },
          {
            id: 'au-m2-a2',
            title: 'Quem projeta e mantém a automação',
            body: [
              'Sistemas automatizados precisam ser desenhados, testados, monitorados e atualizados. Essas funções exigem pessoas que entendam o processo e a tecnologia.',
            ],
          },
        ],
      },
    ],
    quiz: {
      id: 'quiz-automacao',
      title: 'Prova: automação',
      questions: [
        { type: 'mc', prompt: 'Qual destas tarefas é mais fácil de automatizar?', options: ['Negociar um contrato novo', 'Copiar dados de uma planilha para outra seguindo a mesma regra', 'Criar uma campanha inédita', 'Mediar um conflito de equipe'], answer: 1, explanation: 'Tarefas repetitivas, com regras claras e entrada previsível, são as mais fáceis de automatizar.' },
        { type: 'vf', prompt: 'Automação muda o tipo de trabalho realizado, não apenas a quantidade.', answer: true, explanation: 'A automação redefine funções e as competências necessárias.' },
        { type: 'mc', prompt: 'Quem mantém um sistema automatizado faz o quê?', options: ['Nada, após a implantação', 'Monitora, testa e atualiza o sistema', 'Apenas desliga o computador', 'Cria novas regras de mercado'], answer: 1, explanation: 'Sistemas precisam de manutenção contínua.' },
      ],
    },
  },
  {
    id: 'programacao-problemas',
    title: 'Programação aplicada à resolução de problemas',
    category: 'Programação',
    level: 'Iniciante',
    hours: 6,
    hue: 230,
    description: 'Transforme um problema do cotidiano em uma solução programada, testando e melhorando o resultado.',
    objectives: ['Definir entradas, saídas e regras de um problema', 'Testar uma solução com exemplos', 'Melhorar uma solução a partir dos testes'],
    modules: [
      {
        id: 'pr-m1',
        title: 'Entender o problema',
        lessons: [
          {
            id: 'pr-m1-a1',
            title: 'Entradas, saídas e regras',
            body: [
              'Antes de programar, descreva o problema: quais dados entram, o que deve sair e quais regras transformam uma coisa na outra.',
            ],
          },
          {
            id: 'pr-m1-a2',
            title: 'Exemplos antes do código',
            body: [
              'Escreva exemplos com entrada e saída esperada. Eles guiam a solução e servirão como testes depois.',
            ],
          },
        ],
      },
      {
        id: 'pr-m2',
        title: 'Testar e melhorar',
        lessons: [
          {
            id: 'pr-m2-a1',
            title: 'Testes simples',
            body: [
              'Um teste compara o resultado do programa com o esperado. Quando não bate, o problema está na solução ou no próprio teste, e isso precisa ser investigado.',
            ],
          },
          {
            id: 'pr-m2-a2',
            title: 'Melhorar sem perder o que funciona',
            body: [
              'Faça mudanças pequenas e rode os testes a cada uma. Isso permite saber exatamente qual mudança causou um erro.',
            ],
          },
        ],
      },
    ],
    quiz: {
      id: 'quiz-programacao-problemas',
      title: 'Prova: resolução de problemas',
      questions: [
        { type: 'mc', prompt: 'Qual é o primeiro passo recomendado antes de programar?', options: ['Escolher o nome do projeto', 'Descrever entradas, saídas e regras do problema', 'Instalar bibliotecas', 'Publicar o código'], answer: 1, explanation: 'Entender o problema vem antes da escrita do código.' },
        { type: 'vf', prompt: 'Um teste serve para comparar o resultado obtido com o resultado esperado.', answer: true, explanation: 'Essa é a função básica de um teste.' },
        { type: 'assoc', prompt: 'Associe cada etapa à sua finalidade.', pairs: [['Entrada', 'Dados que o programa recebe'], ['Saída', 'Resultado que o programa entrega'], ['Teste', 'Verifica se a solução se comporta como esperado']], explanation: 'Cada etapa tem um papel distinto no desenvolvimento.' },
      ],
    },
  },
  {
    id: 'futuro-do-trabalho',
    title: 'O futuro do trabalho e as transformações digitais',
    category: 'Carreira',
    level: 'Iniciante',
    hours: 3,
    hue: 320,
    description: 'Uma leitura equilibrada sobre como a tecnologia transforma profissões, com foco em oportunidades e adaptação.',
    objectives: ['Reconhecer como a tecnologia muda funções existentes', 'Mapear competências em alta no mercado', 'Planejar uma primeira etapa de requalificação'],
    modules: [
      {
        id: 'ft-m1',
        title: 'Transformações',
        lessons: [
          {
            id: 'ft-m1-a1',
            title: 'Tecnologia e mercado de trabalho',
            body: [
              'A tecnologia altera tarefas dentro das profissões e também cria funções novas. O efeito sobre o emprego depende de políticas, da formação das pessoas e da organização do trabalho.',
              'Estudos sobre o tema divergem em projeções. Por isso, este curso evita previsões e foca em competências e adaptação.',
            ],
          },
          {
            id: 'ft-m1-a2',
            title: 'Tarefas que mudam, funções que surgem',
            body: [
              'Muitas profissões passam a combinar tarefas técnicas com supervisão, interpretação de dados e comunicação com pessoas.',
            ],
          },
        ],
      },
      {
        id: 'ft-m2',
        title: 'Adaptação',
        lessons: [
          {
            id: 'ft-m2-a1',
            title: 'Competências do novo mercado',
            body: [
              'Pensamento crítico, resolução de problemas, comunicação, aprendizagem contínua e alfabetização digital aparecem entre as competências mais valorizadas em diferentes áreas.',
            ],
          },
          {
            id: 'ft-m2-a2',
            title: 'Planejando a própria requalificação',
            body: [
              'Requalificar-se é escolher uma área, identificar lacunas de competência e dar passos pequenos e medidos. Um plano com metas semanais costuma ser mais realista do que um plano genérico.',
            ],
          },
        ],
      },
    ],
    quiz: {
      id: 'quiz-futuro-do-trabalho',
      title: 'Prova: futuro do trabalho',
      questions: [
        { type: 'vf', prompt: 'A tecnologia apenas elimina funções, sem criar novas.', answer: false, explanation: 'O debate inclui tanto a transformação de tarefas quanto a criação de novas funções.' },
        { type: 'mc', prompt: 'Qual atitude é mais útil diante das transformações digitais?', options: ['Ignorar as mudanças', 'Desenvolver competências e aprendizagem contínua', 'Evitar qualquer tecnologia', 'Esperar que o mercado se estabilize'], answer: 1, explanation: 'Adaptação depende de aprendizagem contínua e de novas competências.' },
        { type: 'vf', prompt: 'Projeções sobre emprego são sempre consensuais entre os estudos.', answer: false, explanation: 'Há divergência entre estudos, por isso é importante avaliar as fontes.' },
      ],
    },
  },
  {
    id: 'desenvolvimento-web',
    title: 'Desenvolvimento web: HTML, CSS e JavaScript',
    category: 'Programação',
    level: 'Iniciante',
    hours: 8,
    hue: 30,
    description: 'Construa páginas web: HTML organiza o conteúdo, CSS define a aparência e JavaScript adiciona comportamento.',
    objectives: ['Estruturar uma página com HTML semântico', 'Estilizar com CSS', 'Adicionar interatividade com JavaScript'],
    modules: [
      {
        id: 'dw-m1',
        title: 'Estrutura e aparência',
        lessons: [
          {
            id: 'dw-m1-a1',
            title: 'HTML: estrutura do conteúdo',
            body: [
              'HTML descreve a estrutura de uma página com elementos como título, parágrafo, lista e links. Elementos semânticos, como header e main, deixam a estrutura clara para pessoas e para leitores de tela.',
            ],
            example: '<main>\n  <h1>Minha página</h1>\n  <p>Olá!</p>\n</main>',
          },
          {
            id: 'dw-m1-a2',
            title: 'CSS: cores, espaços e layout',
            body: [
              'CSS define cores, tamanhos, espaçamentos e posições. Ele separa a aparência da estrutura, o que facilita manter o projeto.',
            ],
            example: 'h1 {\n  color: #3d8bff;\n  font-size: 2rem;\n}',
          },
        ],
      },
      {
        id: 'dw-m2',
        title: 'Comportamento',
        lessons: [
          {
            id: 'dw-m2-a1',
            title: 'JavaScript: reagir ao usuário',
            body: [
              'JavaScript permite reagir a ações, como um clique em um botão, e alterar o conteúdo da página. Essa é a base de qualquer interface interativa.',
            ],
            example: 'document.querySelector("button").addEventListener("click", () => {\n  alert("Olá!");\n});',
          },
          {
            id: 'dw-m2-a2',
            title: 'Validar dados em formulários',
            body: [
              'Validar significa verificar se os dados seguem regras antes de usá-los. Mostre mensagens claras quando algo estiver errado, explicando como corrigir.',
            ],
          },
        ],
      },
    ],
    quiz: {
      id: 'quiz-desenvolvimento-web',
      title: 'Prova: desenvolvimento web',
      questions: [
        { type: 'assoc', prompt: 'Associe cada linguagem à sua função principal.', pairs: [['HTML', 'Estrutura o conteúdo'], ['CSS', 'Define a aparência'], ['JavaScript', 'Adiciona comportamento']], explanation: 'Cada tecnologia tem um papel distinto na página.' },
        { type: 'mc', prompt: 'Qual elemento é semântico e indica o conteúdo principal da página?', options: ['div', 'main', 'span', 'br'], answer: 1, explanation: 'O elemento main indica o conteúdo principal.' },
        { type: 'vf', prompt: 'CSS é usado para validar dados enviados por um formulário.', answer: false, explanation: 'A validação de dados é feita com JavaScript.' },
      ],
    },
  },
  {
    id: 'pensamento-computacional',
    title: 'Pensamento computacional',
    category: 'Lógica',
    level: 'Iniciante',
    hours: 4,
    hue: 275,
    description: 'Quatro habilidades para resolver problemas complexos: decomposição, reconhecimento de padrões, abstração e algoritmos.',
    objectives: ['Decompor problemas grandes', 'Reconhecer padrões que se repetem', 'Abstrair detalhes irrelevantes'],
    modules: [
      {
        id: 'pc-m1',
        title: 'Decompor e reconhecer padrões',
        lessons: [
          {
            id: 'pc-m1-a1',
            title: 'Decomposição',
            body: [
              'Decompor é dividir um problema grande em partes menores que podem ser resolvidas separadamente. Cada parte pode, por sua vez, ser decomposta.',
            ],
          },
          {
            id: 'pc-m1-a2',
            title: 'Reconhecimento de padrões',
            body: [
              'Padrões são semelhanças entre partes de um problema. Quando um padrão aparece mais de uma vez, ele costuma indicar uma função ou um laço.',
            ],
          },
        ],
      },
      {
        id: 'pc-m2',
        title: 'Abstrair e generalizar',
        lessons: [
          {
            id: 'pc-m2-a1',
            title: 'Abstração',
            body: [
              'Abstrair é ignorar detalhes que não importam para a solução. Um mapa de metrô omite distâncias reais e ainda assim é útil para planejar uma viagem.',
            ],
          },
          {
            id: 'pc-m2-a2',
            title: 'Generalização',
            body: [
              'Uma solução generalizada funciona para várias entradas parecidas, não apenas para um caso. Teste sempre com casos diferentes.',
            ],
          },
        ],
      },
    ],
    quiz: {
      id: 'quiz-pensamento-computacional',
      title: 'Prova: pensamento computacional',
      questions: [
        { type: 'mc', prompt: 'Dividir um problema grande em partes menores chama-se:', options: ['Abstração', 'Decomposição', 'Generalização', 'Depuração'], answer: 1, explanation: 'Decomposição é dividir o problema.' },
        { type: 'vf', prompt: 'Abstração consiste em incluir todos os detalhes do problema na solução.', answer: false, explanation: 'Abstração consiste em ignorar detalhes irrelevantes.' },
        { type: 'mc', prompt: 'Quando um mesmo padrão se repete, o que costuma ser útil criar?', options: ['Uma função ou um laço', 'Um novo computador', 'Um erro proposital', 'Nada'], answer: 0, explanation: 'Padrões repetidos sugerem reutilização por função ou laço.' },
      ],
    },
  },
  {
    id: 'etica-inclusao',
    title: 'Ética, tecnologia e inclusão digital',
    category: 'Sociedade',
    level: 'Iniciante',
    hours: 3,
    hue: 140,
    description: 'Discuta responsabilidade, privacidade e acesso à tecnologia, e como fazer escolhas técnicas mais justas.',
    objectives: ['Identificar riscos éticos em sistemas digitais', 'Entender o que é exclusão digital', 'Propor práticas mais inclusivas'],
    modules: [
      {
        id: 'ei-m1',
        title: 'Ética e privacidade',
        lessons: [
          {
            id: 'ei-m1-a1',
            title: 'Responsabilidade sobre sistemas',
            body: [
              'Quem projeta um sistema decide quais dados coletar, como usá-los e quem é afetado. Essas decisões têm consequências reais para as pessoas.',
            ],
          },
          {
            id: 'ei-m1-a2',
            title: 'Privacidade',
            body: [
              'Coletar apenas os dados necessários, explicar o uso e proteger as informações são práticas básicas de respeito à privacidade.',
            ],
          },
        ],
      },
      {
        id: 'ei-m2',
        title: 'Inclusão digital',
        lessons: [
          {
            id: 'ei-m2-a1',
            title: 'Exclusão digital',
            body: [
              'Exclusão digital é a dificuldade de acesso a equipamentos, conexão ou habilidades para usar tecnologias. Ela afeta oportunidades de estudo e de trabalho.',
            ],
          },
          {
            id: 'ei-m2-a2',
            title: 'Práticas inclusivas',
            body: [
              'Textos alternativos para imagens, contraste adequado, navegação por teclado e linguagem clara ampliam o acesso a um sistema.',
            ],
          },
        ],
      },
    ],
    quiz: {
      id: 'quiz-etica-inclusao',
      title: 'Prova: ética e inclusão digital',
      questions: [
        { type: 'vf', prompt: 'Textos alternativos em imagens ajudam pessoas que usam leitores de tela.', answer: true, explanation: 'Eles permitem que o conteúdo da imagem seja lido por tecnologias assistivas.' },
        { type: 'mc', prompt: 'Qual prática respeita a privacidade?', options: ['Coletar todos os dados possíveis', 'Coletar apenas os dados necessários e explicar o uso', 'Vender dados sem avisar', 'Guardar senhas em texto aberto'], answer: 1, explanation: 'Minimização de dados e transparência são princípios básicos.' },
        { type: 'assoc', prompt: 'Associe cada termo ao significado.', pairs: [['Exclusão digital', 'Dificuldade de acesso à tecnologia e às habilidades para usá-la'], ['Texto alternativo', 'Descrição de uma imagem para quem não pode vê-la']], explanation: 'Os dois conceitos tratam de acesso e inclusão.' },
      ],
    },
  },
  {
    id: 'carreiras-requalificacao',
    title: 'Carreiras tecnológicas e requalificação profissional',
    category: 'Carreira',
    level: 'Iniciante',
    hours: 4,
    hue: 15,
    description: 'Conheça áreas tecnológicas, compare caminhos de formação e monte um plano de requalificação realista.',
    objectives: ['Conhecer áreas de atuação em tecnologia', 'Comparar caminhos de formação', 'Montar um plano de requalificação com metas'],
    modules: [
      {
        id: 'cr-m1',
        title: 'Áreas e caminhos',
        lessons: [
          {
            id: 'cr-m1-a1',
            title: 'Áreas de atuação em tecnologia',
            body: [
              'Desenvolvimento de software, análise de dados, suporte e manutenção de sistemas, segurança e automação são áreas com perfis de trabalho diferentes.',
            ],
          },
          {
            id: 'cr-m1-a2',
            title: 'Comparar caminhos de formação',
            body: [
              'Cursos técnicos, graduação, cursos livres e projetos práticos podem ser combinados. Compare carga horária, conteúdo prático e reconhecimento na sua região.',
            ],
          },
        ],
      },
      {
        id: 'cr-m2',
        title: 'Plano de requalificação',
        lessons: [
          {
            id: 'cr-m2-a1',
            title: 'Lacunas de competência',
            body: [
              'Liste as competências que você já tem, as que a área de interesse exige e a diferença entre as duas listas. Essa diferença é o seu plano de estudo.',
            ],
          },
          {
            id: 'cr-m2-a2',
            title: 'Metas pequenas e medidas',
            body: [
              'Defina metas semanais, mensuráveis e possíveis de cumprir com a sua rotina. Revise o plano a cada mês.',
            ],
          },
        ],
      },
    ],
    quiz: {
      id: 'quiz-carreiras-requalificacao',
      title: 'Prova: carreiras e requalificação',
      questions: [
        { type: 'mc', prompt: 'Qual é o primeiro passo de um plano de requalificação?', options: ['Pagar um curso caro', 'Listar competências atuais e as exigidas pela área escolhida', 'Trocar de cidade', 'Desistir dos estudos'], answer: 1, explanation: 'O plano começa com o diagnóstico das lacunas.' },
        { type: 'vf', prompt: 'Metas genéricas, sem prazo, costumam ser mais eficazes que metas semanais mensuráveis.', answer: false, explanation: 'Metas claras e mensuráveis tendem a ser mais úteis para acompanhar o progresso.' },
        { type: 'assoc', prompt: 'Associe cada termo ao significado.', pairs: [['Lacuna de competência', 'Diferença entre o que você sabe e o que a área exige'], ['Requalificação', 'Nova formação para atuar em outra função ou área']], explanation: 'Os dois termos são centrais no planejamento de carreira.' },
      ],
    },
  },
];

export function allLessons(course) {
  return course.modules.flatMap((module) =>
    module.lessons.map((lesson) => ({ ...lesson, moduleId: module.id, moduleTitle: module.title, courseId: course.id })),
  );
}

export function findCourse(id) {
  return COURSES.find((course) => course.id === id) ?? null;
}

export function findLesson(courseId, lessonId) {
  const course = findCourse(courseId);
  if (!course) return null;
  const lessons = allLessons(course);
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index === -1) return null;
  return {
    course,
    lesson: lessons[index],
    index,
    previous: lessons[index - 1] ?? null,
    next: lessons[index + 1] ?? null,
  };
}

export function findQuiz(quizId) {
  for (const course of COURSES) {
    if (course.quiz.id === quizId) return { course, quiz: course.quiz };
  }
  return null;
}
