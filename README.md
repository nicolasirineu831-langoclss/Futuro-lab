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

---

## Conta online (Supabase)

Por padrão o site funciona **sem conta**, com dados no navegador. Para ativar contas, banco e áreas de estudante e professor, siga os passos abaixo. Até concluí-los, as telas de conta mostram que a conta não está configurada.

### 1. Criar o projeto

1. Crie uma conta gratuita em https://supabase.com e um projeto novo.
2. Em **SQL Editor**, cole o conteúdo de `supabase/migrations/0001_schema.sql` e execute **uma única vez** em projeto novo.
3. Em **Project Settings → API**, copie a **Project URL** e a chave **anon / publishable**.

### 2. Configurar o site

Edite `js/config.js` e preencha:

```js
export const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
export const SUPABASE_ANON_KEY = 'SUA-CHAVE-PUBLICA-ANON';
```

A chave anon é pública por desenho: a segurança depende das regras RLS do banco, não de esconder a chave. **Nunca** coloque a chave `service_role` no código.

### 3. Configurar a autenticação

Em **Authentication → URL Configuration**:

- **Site URL**: a URL publicada, por exemplo `https://SEU-USUARIO.github.io/futurolab/`.
- **Redirect URLs**: inclua a mesma URL com `/**` no fim, por exemplo `https://SEU-USUARIO.github.io/futurolab/**`.

Em **Authentication → Providers → Email**, mantenha a confirmação de e-mail ligada (recomendado). Os modelos de e-mail de confirmação e recuperação podem ser traduzidos em **Authentication → Email Templates**.

### 4. Criar o primeiro administrador

Todo cadastro público vira **estudante**. Para tornar uma conta administradora (ou professora), cadastre-a normalmente e depois execute no **SQL Editor**:

```sql
update public.profiles set role = 'teacher' where id = (
  select id from auth.users where email = 'professor@exemplo.com'
);
```

Use `'admin'` para administrador. Essa alteração só funciona pelo SQL Editor (sem usuário autenticado); a própria aplicação não consegue elevar um papel.

### O que o banco garante

- Estudante só vê cursos publicados, e só vê atividades e entregas dos cursos em que está matriculado.
- Rascunhos ficam visíveis apenas ao professor responsável e ao administrador.
- Cursos com acesso **aberto** permitem matrícula do próprio estudante; os demais exigem que o professor libere a matrícula.
- Estudante não consegue ver a nota de outro estudante, nem alterar a própria nota.
- Uma entrega corrigida não pode mais ser alterada pelo estudante.
- A nota não pode passar do valor da atividade.
- Entregas são recusadas depois do prazo.
- Professores só gerenciam os próprios cursos. Administradores gerenciam todos.
- Estudante não consegue mudar o próprio papel.

### O que está pronto e o que falta

**Funcionando com conta (verificado com cliente falso, não com o Supabase real):**
- Cadastro, entrada, saída, recuperação e redefinição de senha.
- Cartão de conta no perfil, com edição do nome.
- Catálogo de cursos online, matrícula e abertura de curso.
- Envio de entrega (rascunho ou definitiva) e visualização da nota e do feedback.
- Área do professor: criar e publicar cursos, criar atividades, ver entregas e corrigir com nota e feedback.
- Migração SQL com RLS, triggers de integridade e notificações de atividade publicada e de correção.

**Ainda não implementado:**
- Módulos e aulas no banco (hoje os cursos online têm atividades, sem aulas próprias).
- Importação de PDF, DOCX, PPTX e outros arquivos. Exige armazenamento de arquivos no Supabase (Storage) e extração de texto.
- Inteligência artificial para resumos e exercícios. Exige endpoint próprio (ver `TUTOR_ENDPOINT`).
- Certificados com verificação.
- Notificações por e-mail.
- Lista de notificações do banco dentro da interface (os avisos ainda são locais).
- Progresso, anotações e favoritos salvos na conta (hoje ficam no navegador).
- Novos conteúdos de informática, Office, redes e programação no formato online.
- Estratégia de backup documentada: o Supabase faz backups automáticos nos planos pagos. Em plano gratuito, exporte o banco periodicamente pelo SQL Editor.

### Testes dessa parte

- `tests/backend-smoke.mjs` percorre as telas de conta com um cliente falso e verifica que elas renderizam, que o modo conta é ativado e que nenhuma promessa fica sem tratamento.
- **As regras de RLS e os triggers não foram executados contra um Postgres real.** Eles precisam ser testados no seu projeto Supabase: crie uma conta de estudante e tente, pelo navegador ou pela API, acessar um rascunho, a nota de outro estudante e alterar um papel. Todas essas tentativas devem falhar.
