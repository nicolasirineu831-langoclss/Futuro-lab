# FuturoLab · Aprenda Hoje, Prepare-se para o Amanhã

Plataforma educacional sobre programação, automação, inteligência artificial e o futuro do trabalho.
Desenvolvida como HTML, CSS e JavaScript modulares, sem etapa de build.

## Como executar

Não há dependências para instalar. Sirva a pasta por HTTP local (módulos JavaScript não funcionam com `file://`):

```bash
cd futurolab
python3 -m http.server 5173
```

Depois acesse `http://localhost:5173`.

## Como testar

```bash
cd futurolab/tests
./run.sh
```

Requer apenas Node 18 ou superior. A suíte cobre:

- **Lógica** (`logic.mjs`): validação do nome, XP único por evento, sequência de dias, correção de provas, revisão espaçada, filtros de tarefas, calendário mensal, conquistas, avisos e tutor em modo demonstração. Também verifica que **todas as soluções dos desafios passam nos próprios testes** e que os gabaritos das provas são válidos.
- **Executor de código** (`worker-check.mjs`): roda o corpo do Worker isoladamente e confirma sucesso, falha, captura de `console.log`, erro de sintaxe e bloqueio de rede.
- **Renderização** (`smoke.mjs`): renderiza 34 rotas em um mini-DOM e falha se qualquer uma capturar erro.
- **Tarefas** (`tasks-views.mjs`): troca de visões (lista, calendário, categorias) e seleção de dia.

Os testes rodam em Node com um mini-DOM próprio. **Eles não substituem a verificação em navegador real**, que ainda deve ser feita (ver "Testes manuais recomendados").

## Estrutura

```
futurolab/
├── index.html
├── css/styles.css            # tokens, layout responsivo e componentes base
├── css/features.css          # componentes das áreas de estudo, tarefas, laboratório e avisos
├── js/
│   ├── main.js               # registro de rotas e inicialização
│   ├── router.js             # roteador por hash, com parâmetros
│   ├── layout.js             # barra lateral, topo com avisos e navegação inferior
│   ├── store.js              # estado central em localStorage, datas e exemplos removíveis
│   ├── ui.js                 # componentes e helpers (sem innerHTML com dados do usuário)
│   ├── forms.js              # formulário de nome
│   ├── config.js             # configuração pública (endpoint do tutor; sem chaves)
│   ├── data/                 # conteúdo: cursos, desafios, biblioteca, carreiras
│   ├── services/             # regras: progresso, XP, conquistas, avisos, SRS, tarefas,
│   │                         #   provas, executor de código, tutor, histórico
│   └── pages/                # uma página por área
└── tests/                    # suíte automatizada descrita acima
```

## O que funciona

- **Início:** continua de onde parou, sequência de dias, atividade da semana, meta semanal, cursos em andamento, tarefas, desempenho em provas e conquistas. Todos os números vêm do que você registrou.
- **Cursos:** 10 cursos introdutórios, com busca e filtros por categoria, nível, duração e situação. Cada curso tem objetivos, módulos e aulas.
- **Sala de aula:** conteúdo em texto e exemplos de código, anotações salvas por aula, conclusão com progresso, navegação entre aulas e link para o exercício. Vídeos só são incorporados de `youtube-nocookie.com` ou `player.vimeo.com`, por HTTPS. Nenhuma aula atual tem vídeo, e a tela informa isso.
- **Provas:** múltipla escolha, verdadeiro ou falso e associação, corrigidas por gabarito. Mostram a explicação de cada questão, histórico de tentativas, aprovação em 70% e opção de refazer. Há um simulado geral com uma questão de cada curso.
- **Estudos:** anotações organizadas em cadernos (criar, editar, excluir), favoritos, histórico, objetivos e conceitos.
- **Flashcards:** conjuntos e cartões editáveis, revelação da resposta e marcação "aprendi" ou "preciso revisar". A revisão é espaçada: acertos aumentam o intervalo (1, 3 e depois proporcional), erros reiniciam.
- **Biblioteca:** resumos e guias escritos para a plataforma, com busca, filtros e favoritos salvos. Inclui as referências do documento-base, sem afirmações atribuídas às obras.
- **Tarefas:** criar, editar, excluir, concluir e reabrir. Subtarefas, prioridade, prazo, tempo estimado e observações. Categorias derivadas (a fazer, em andamento, concluídas, atrasadas), filtros, visões de lista, de categorias e de calendário mensal. Prazo próximo (até dois dias) e atraso aparecem como avisos visuais.
- **Laboratório:** editor, executar, testar e dicas progressivas (uma por vez). A solução comentada aparece depois da primeira tentativa ou de todas as dicas. Histórico de tentativas. O código roda em Web Worker, com limite de 2 segundos e sem acesso a rede, DOM ou armazenamento.
- **Projetos:** oito modelos de projeto, com checklist, critérios, observações e link de resultado, organizados como planejado, em desenvolvimento e concluído. Portfólio com os projetos concluídos.
- **Carreiras:** três cenários de análise em que você marca tarefas que poderiam ser automatizadas e descreve adaptações. Não há probabilidades de emprego. Planejador de carreira salvo localmente.
- **Planejador:** temporizador Pomodoro real (iniciar, pausar, retomar, reiniciar), que continua contando ao trocar de tela. Sessões concluídas são registradas. Há meta semanal, plano de estudos por dia e relatório da semana calculado a partir dos registros.
- **Tutor IA:** conversa com histórico, indicador de processamento e tratamento de erros. Sem backend, opera em **modo demonstração**, com respostas preparadas para alguns temas.
- **Avisos:** gerados apenas por eventos que aconteceram (aula, prova, tarefa, revisão, meta, conquista, projeto). Podem ser marcados como lidos, removidos ou abertos.
- **Perfil:** nome, resumo, progresso por curso, conquistas, cópia dos dados em JSON, remoção dos exemplos e apagamento de todos os dados (com confirmação).

## Regras de pontuação (XP)

| Ação | XP | Quando |
|---|---|---|
| Aula concluída | 10 | Uma vez por aula |
| Prova aprovada (70% ou mais) | 30 | Na primeira aprovação de cada prova |
| Desafio resolvido | 25 | Na primeira vez que passa em todos os testes |
| Tarefa concluída | 15 | Uma vez por tarefa |
| Projeto concluído | 40 | Uma vez por projeto |
| Sessão de foco de 25 min ou mais | 5 | Uma vez por sessão |
| Revisão de 5 cartões ou mais | 10 | Uma vez por dia |

O XP recebido não é retirado se você desfizer uma conclusão. Essa é uma escolha de design, para não punir a revisão.

## Limites reais desta versão

**Não há conta nem segurança de dados de usuário.** Não existe login, senha, recuperação de senha, sincronização entre aparelhos nem painel administrativo. Os dados ficam no `localStorage` deste navegador, e qualquer pessoa com acesso ao aparelho pode vê-los. Não coloque dados sensíveis aqui.

**Não há IA real.** O tutor responde apenas com textos previamente escritos para alguns temas. Para ligá-lo a um modelo de IA, é preciso um backend próprio que guarde a chave da API no servidor e exponha um endpoint. Depois, basta definir `TUTOR_ENDPOINT` em `js/config.js`. Nenhuma chave deve ir para o código do navegador.

**O executor de código não é uma barreira de segurança.** Ele protege a página de travamentos e de acesso a dados do site, mas não foi projetado para código hostil. Serve para exercícios feitos pelo próprio estudante. Executar código de terceiros exigiria um serviço isolado no servidor.

**O conteúdo é introdutório e curto.** Cada curso tem dois módulos, com duas aulas em texto cada, e uma prova de três questões. Não há vídeos, exercícios de resposta escrita nem banco grande de questões. Os textos devem ser revisados por um professor antes de uso formal.

**Estatísticas dependem do uso.** Sem atividade registrada, os números aparecem zerados e as telas mostram estados vazios. Isso é intencional.

**Notificações são apenas dentro do aplicativo.** Não há notificações do sistema operacional.

**Desvios em relação ao pedido original:** a stack é HTML, CSS e JavaScript, em vez de React, TypeScript, Vite, Tailwind e Supabase. A troca aconteceu porque o ambiente de desenvolvimento não tinha acesso ao npm. Os módulos foram separados por responsabilidade para facilitar a migração.

## Não implementado (exige backend)

- Autenticação, cadastro, recuperação de senha e controle de acesso.
- Persistência em banco de dados e sincronização entre dispositivos.
- Painel administrativo para criar cursos, publicar conteúdo e gerenciar usuários.
- Execução segura de código no servidor.
- Vídeos hospedados e materiais para download.

### Modelo de dados sugerido para o backend

Os nomes abaixo correspondem às chaves do estado local atual, o que facilita a migração:

- `profiles`: id do usuário, nome, meta semanal, duração do foco.
- `course_progress`: usuário, aula, concluída em.
- `course`, `module`, `lesson`, `quiz`, `question`: conteúdo, com status de publicação e autor administrador.
- `quiz_attempt`: usuário, prova, pontuação, respostas, data.
- `task`, `subtask`, `deck`, `card`, `note`, `project`, `project_check`, `notification`, `xp_event`.

Regras que devem existir no servidor e nas políticas do banco, e não só na interface: leitura apenas dos próprios dados, escrita restrita ao dono, conteúdo editável só por administradores, e correção de provas feita no servidor. Hoje a correção é feita no navegador.

## Testes manuais recomendados

Antes de publicar, abra a aplicação em um navegador e confira:

1. Navegação por todas as áreas, no celular (menu inferior) e no computador (barra lateral).
2. Criar uma tarefa, concluí-la, recarregar a página e confirmar que ela continua concluída.
3. Concluir uma aula, recarregar e confirmar o progresso do curso.
4. Responder uma prova com erros e acertos e conferir a explicação e a pontuação.
5. Executar um desafio do laboratório com a solução errada e depois com a certa.
6. Iniciar o temporizador, trocar de tela e voltar, confirmando que ele continua contando.
7. Abrir o navegador com armazenamento bloqueado e confirmar que os avisos de erro aparecem.
8. Testar leitura de tela e navegação só com teclado nas telas principais.
