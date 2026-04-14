# Arquitetura do Sistema — Amparar CRM
**Beyond Bits Tecnologia © 2026**  
Versão do documento: 1.0 — 29/03/2026

---

## Índice

1. [Visão geral](#1-visão-geral)
2. [Estrutura de pastas](#2-estrutura-de-pastas)
3. [Camadas da arquitetura](#3-camadas-da-arquitetura)
4. [Papel de cada arquivo](#4-papel-de-cada-arquivo)
5. [Como os arquivos se conversam](#5-como-os-arquivos-se-conversam)
6. [A regra de ouro: jQuery vs Classes](#6-a-regra-de-ouro-jquery-vs-classes)
7. [O Store — estado centralizado](#7-o-store--estado-centralizado)
8. [Ciclo de vida de uma ação](#8-ciclo-de-vida-de-uma-ação)
9. [Boas práticas para escalar](#9-boas-práticas-para-escalar)
10. [Roadmap de integração com Supabase](#10-roadmap-de-integração-com-supabase)

---

## 1. Visão geral

O sistema é uma **SPA (Single Page Application)** construída com HTML + CSS + JavaScript puro, jQuery e Programação Orientada a Objetos (POO). Não utiliza frameworks pesados como React ou Vue — a escolha foi intencional para garantir máxima legibilidade, facilidade de manutenção e baixa curva de entrada para novos desenvolvedores.

A stack completa:

| Camada | Tecnologia | Papel |
|---|---|---|
| Interface | HTML5 + CSS3 | Estrutura e visual |
| Manipulação de DOM | jQuery 3.7.1 | Seletores, eventos, animações |
| Lógica de negócio | JavaScript ES6+ (Classes) | Estado, regras, renderização |
| Banco de dados | Supabase (futuro) | Persistência e autenticação |
| Hospedagem | Vercel / GitHub Pages | Entrega do front-end |

---

## 2. Estrutura de pastas

```
amparar/
├── index.html                  ← HTML único da SPA. Contém toda a estrutura de telas.
├── styles.css                  ← Estilo global. CSS Variables para o design system.
└── js/
    ├── constants.js            ← Constantes e dados iniciais (sem lógica)
    ├── utils.js                ← Funções utilitárias puras (sem estado, sem DOM)
    ├── store.js                ← Estado centralizado da aplicação (Singleton)
    ├── router.js               ← Navegação entre páginas da SPA
    ├── app.js                  ← Bootstrap: inicializa tudo e expõe funções ao HTML
    ├── components/
    │   ├── Toast.js            ← Notificações visuais reutilizáveis
    │   ├── Modal.js            ← Controle de modais estáticos do HTML
    │   ├── ConfirmDialog.js    ← Diálogo de confirmação (sim/não)
    │   └── KanbanCard.js       ← Card individual do funil Kanban
    ├── controllers/
    │   └── Controllers.js      ← SidebarController, DateTimeHelper, FonteSelect, ChecklistItem
    └── modules/
        ├── FunilModule.js      ← Kanban, detalhe do lead, ligação, agendamento, venda
        └── Modules.js          ← AtividadeModule, HistoricoModule, AgendaModule,
                                   RelatoriosModule, CurriculoModule, UsuarioModule
```

---

## 3. Camadas da arquitetura

A aplicação é organizada em **5 camadas**, cada uma com responsabilidade exclusiva. Nenhuma camada deve "pular" para uma camada não-adjacente.

```
┌──────────────────────────────────────────────────────┐
│  index.html  ←  única entrada do usuário             │
└────────────────────┬─────────────────────────────────┘
                     │ onclick, data-*
┌────────────────────▼─────────────────────────────────┐
│  app.js  ←  bootstrap + wrappers globais (window.*)  │
└──────┬───────────────────────────────────────────────┘
       │ chama
┌──────▼───────────────────────────────────────────────┐
│  modules/  ←  lógica de cada página/funcionalidade   │
│  controllers/  ←  lógica de UI transversal           │
└──────┬───────────────────────────────────────────────┘
       │ lê e escreve
┌──────▼───────────────────────────────────────────────┐
│  store.js  ←  estado único da aplicação              │
└──────┬───────────────────────────────────────────────┘
       │ usa
┌──────▼───────────────────────────────────────────────┐
│  constants.js  /  utils.js  ←  base imutável         │
└──────────────────────────────────────────────────────┘
```

### Regra de dependência

- `constants.js` e `utils.js` não dependem de ninguém.
- `store.js` depende apenas de `utils.js` e `constants.js`.
- `components/` e `controllers/` dependem de `store.js` e `utils.js`.
- `modules/` dependem de `store.js`, `components/` e `constants.js`.
- `app.js` depende de todos — é o único que tem visão geral.
- `index.html` chama apenas funções expostas em `window.*` pelo `app.js`.

---

## 4. Papel de cada arquivo

### `index.html`
O único arquivo HTML da aplicação. Contém toda a estrutura de telas (dashboard, kanban, agenda, modais, etc.). **Não contém lógica de negócio** — apenas estrutura e atributos `onclick` que chamam funções expostas pelo `app.js`. Quando a integração com Supabase estiver pronta, este arquivo não precisa mudar.

---

### `styles.css`
Estilo global com **CSS Variables** para o design system da Amparar (cores, tipografia, espaçamentos). Para alterar a identidade visual do sistema inteiro, basta mudar as variáveis no `:root`. Não contém JavaScript nem lógica condicional.

---

### `js/constants.js`
Contém **somente dados e configurações que não mudam em runtime**. Nenhuma função, nenhum estado. É o único arquivo que pode ser lido por qualquer outro sem risco de criar dependência circular.

O que fica aqui:
- `STAGE_ORDER` e `STAGE_CONFIG` — ordem e configuração das etapas do funil
- `TAG_CONFIG` — configuração visual das tags dos leads
- `CURRICULO_STATUS` e `CURRICULO_BORDER` — status e cores dos currículos
- `PERFIL_CONFIG` — perfis de usuário (Especialista, Supervisor, Gerente)
- `FONTES_LEAD` — lista de fontes com descrições (tooltip)
- `INITIAL_LEADS`, `INITIAL_CURRICULOS`, `INITIAL_USUARIOS`, `INITIAL_ATIVIDADES` — dados de prototipação (removidos quando o Supabase entrar)
- `AGENDA_DATA` — dados da grade semanal de agendamentos

---

### `js/utils.js`
Funções **puras e sem efeito colateral**. Não acessam o DOM, não leem o store, não têm estado próprio. São utilitários que qualquer camada pode usar com segurança.

Funções disponíveis via `Utils.*`:
- `Utils.escHtml(str)` — escapa HTML para prevenir XSS
- `Utils.getNowLocal()` — data e hora atual no formato datetime-local
- `Utils.getTodayDate()` — data de hoje no formato yyyy-mm-dd
- `Utils.getHoraAtual()` — hora atual no formato HH:MM
- `Utils.getDataAtual()` — data atual formatada em pt-BR
- `Utils.formatDate(dateStr)` — formata uma string de data para exibição
- `Utils.copyTel(tel)` — copia número de telefone (só dígitos) para o clipboard
- `Utils.gerarLeadId(contador)` — gera ID no formato `AMP-2026-00XX`

---

### `js/store.js`
**Estado centralizado** da aplicação — o coração do sistema. É um Singleton: existe uma única instância (`const store = new Store()`) acessível globalmente. Toda leitura e escrita de dados passa por aqui.

Responsabilidades:
- Guardar os dados em memória (leads, agendamentos, currículos, usuários, etc.)
- Expor métodos de leitura (`buscarLead`, `leadsPorEtapa`) e escrita (`adicionarLead`, `avancarEtapa`)
- Ser o ponto de troca pelo Supabase: quando a integração acontecer, cada método de escrita vira uma chamada assíncrona ao banco, sem mudar os módulos que o chamam

**O que não deve entrar no Store:** lógica de renderização, manipulação de DOM, regras de validação de formulário. O Store só sabe sobre dados.

---

### `js/router.js` — classe `Router`
Controla a **navegação entre páginas** da SPA. Troca a classe `active` entre os elementos `.page` e `.nav-item` conforme a rota solicitada. Também fecha a sidebar mobile ao navegar.

Uso:
```javascript
Router.ir('dashboard');   // navega para o dashboard
Router.ir('funil');       // navega para o kanban
Router.inicializar();     // vai para a página padrão (dashboard)
```

Para adicionar uma nova página: registrar a rota no `_navMap` dentro do `Router` e criar o elemento `#page-novapagina` no HTML.

---

### `js/app.js`
**Ponto de entrada e bootstrap** da aplicação. É o único arquivo que tem visão de todo o sistema. Faz três coisas:

1. No `$(document).ready`: chama `store.inicializar()`, inicializa componentes base, renderiza todos os módulos, registra eventos globais e inicia o router.
2. Expõe funções ao `window.*` para que o HTML possa chamá-las via `onclick`. Esses wrappers são a ponte entre o HTML estático e as classes JS.
3. Contém o pequeno script inline com helpers específicos do HTML (como `addRecCard` e `avancarLeadAtual`) que dependem do contexto da tela.

**Regra:** o `app.js` não deve conter lógica de negócio. Se uma função ficou grande aqui, ela pertence a um módulo ou controller.

---

### `js/components/Toast.js` — classe `Toast`
Notificações visuais que aparecem no canto da tela e somem automaticamente após ~2,8 segundos.

```javascript
Toast.show('✅ Lead salvo!', 'success');
Toast.show('⚠️ Campo obrigatório', 'warning');
Toast.show('📅 Novo agendamento', 'info');
Toast.show('Mensagem neutra', '');
```

Totalmente independente de contexto — pode ser chamado de qualquer módulo.

---

### `js/components/Modal.js` — classe `Modal`
Controla a abertura e fechamento de **modais estáticos** (aqueles que já existem no HTML como elementos `.modal-overlay`). Não cria modais dinamicamente — gerencia os que o HTML declara.

```javascript
Modal.abrir('modal-novo-lead');
Modal.fechar('modal-novo-lead');
Modal.trocarAba('ligacao', elementoContexto);   // troca aba dentro do modal do lead
Modal.inicializarBackdrops();                    // fecha ao clicar fora — chamado no boot
```

---

### `js/components/ConfirmDialog.js` — classe `ConfirmDialog`
Diálogo de confirmação reutilizável (sim/não). Usa o elemento `#confirm-overlay` do HTML. O callback de confirmação é armazenado no `store.confirmCallback`.

```javascript
ConfirmDialog.show('🗑️', 'Remover Lead', 'Deseja remover permanentemente?', () => {
  // executado apenas se o usuário clicar em "Sim"
  store.removerCurriculo(id);
});

ConfirmDialog.confirmar();  // chamado pelo botão "Sim" no HTML
ConfirmDialog.cancelar();   // chamado pelo botão "Não" no HTML
```

---

### `js/components/KanbanCard.js` — classe `KanbanCard`
Componente que encapsula a **construção visual de um card** do funil Kanban. Recebe um objeto `lead` e uma cor de borda, e retorna um elemento jQuery pronto para inserção no DOM.

```javascript
const card = new KanbanCard(lead, '#2B6CB0');
$kanbanCol.append(card.render());
```

Internamente usa `_buildTags()` e `_buildTentativas()` para montar as partes opcionais do card. Para alterar o visual de um card, é aqui que se mexe — sem impactar nenhuma outra parte do sistema.

---

### `js/controllers/Controllers.js`
Contém quatro controllers de UI **transversais** (não pertencem a nenhuma página específica):

**`SidebarController`** — abre e fecha a sidebar em desktop e mobile.

**`FonteSelect`** — atualiza o tooltip de descrição quando o usuário seleciona uma fonte de lead no formulário.

**`DateTimeHelper`** — preenche campos `datetime-local` e `date` com o valor atual, e expõe `setNow(inputId)` para o HTML.

**`ChecklistItem`** — marca e desmarca itens de checklist (pós-agendamento, pós-venda).

---

### `js/modules/FunilModule.js` — classe `FunilModule`
O módulo mais complexo do sistema. Centraliza **toda a lógica do funil de vendas**:

- `renderKanban()` — reconstrói as 6 colunas do Kanban com os leads atuais
- `renderFunilPreview()` — renderiza as barras de progresso no Dashboard
- `atualizarKPIs()` — atualiza os contadores de KPI
- `novoLead()` / `salvarNovoLead()` — abre o modal e salva um novo lead
- `abrirDetalhe(leadId)` — abre o modal de detalhe populado com dados do lead
- `registrarLigacao()` — registra uma tentativa com popup de confirmação (RF-32)
- `confirmarAgendamento()` / `confirmarVisita()` / `confirmarVenda()` — avança etapas
- `criarLeadRecomendacao(containerId)` — cria lead a partir de recomendação (RN-06)
- `selecionarResultado(el)` / `selecionarVisita(el, tipo)` — controle de botões de resultado

---

### `js/modules/Modules.js`
Agrupa seis módulos menores em um único arquivo para manter a estrutura enxuta:

**`AtividadeModule`** — gerencia o feed de atividades recentes do Dashboard. `adicionar()` registra no store e re-renderiza o feed e o histórico automaticamente.

**`HistoricoModule`** — renderiza a lista consolidada de atividades com filtro por tipo (ligação, agendamento, visita, etc.).

**`AgendaModule`** — renderiza a grade semanal no Dashboard (`renderDashboard()`) e a tabela completa de agendamentos (`renderFull()`).

**`RelatoriosModule`** — renderiza os gráficos de barras de conversão por etapa do funil.

**`CurriculoModule`** — CRUD completo de currículos: `render()`, `salvar()`, `editar(id)`, `deletar(id)`.

**`UsuarioModule`** — renderiza a tabela de usuários e salva novos cadastros.

---

## 5. Como os arquivos se conversam

O fluxo de comunicação sempre segue **uma direção**: HTML → app.js → módulo → store → constants/utils. Nunca o contrário.

### Exemplo: usuário clica em "Salvar Lead"

```
index.html
  onclick="salvarNovoLead()"
      ↓
app.js
  window.salvarNovoLead = () => FunilModule.salvarNovoLead()
      ↓
FunilModule.js  (valida campos com jQuery, lê valores do DOM)
  → Toast.show('⚠️ Campo obrigatório')   ← se inválido
  → store.adicionarLead(lead)             ← se válido
  → FunilModule.renderKanban()            ← atualiza o DOM
  → AtividadeModule.adicionar(...)        ← registra no histórico
  → Modal.fechar('modal-novo-lead')       ← fecha o modal
      ↓
store.js
  adicionarLead(lead) → this.leads.push(lead)
```

### Exemplo: usuário navega pelo menu

```
index.html
  onclick="navigate('funil')"
      ↓
app.js
  window.navigate = (page) => Router.ir(page)
      ↓
Router.js
  $('.page').removeClass('active')
  $('#page-funil').addClass('active')
  SidebarController.fecharMobile()
```

### Exemplo: confirmar remoção de currículo

```
index.html (card do currículo)
  onclick="deletarCurriculo(3)"
      ↓
app.js
  window.deletarCurriculo = (id) => CurriculoModule.deletar(id)
      ↓
CurriculoModule.js
  ConfirmDialog.show('🗑️', 'Remover', '...', () => {
    store.removerCurriculo(id)    ← callback executado se confirmar
    CurriculoModule.render()
    Toast.show('Removido', '')
  })
      ↓
index.html (botão "Sim" do diálogo)
  onclick="confirmYes()"
      ↓
app.js → ConfirmDialog.confirmar() → executa o callback armazenado
```

---

## 6. A regra de ouro: jQuery vs Classes

A divisão de responsabilidade é clara e deve ser respeitada em todo o código novo:

| jQuery faz | Classes JS fazem |
|---|---|
| Selecionar elementos (`$('#id')`) | Lógica de negócio |
| Ler valores de campos (`.val()`) | Validação de dados |
| Modificar texto e HTML (`.text()`, `.html()`) | Decisões condicionais |
| Mostrar/esconder (`.show()`, `.hide()`) | Cálculos e transformações |
| Adicionar/remover classes (`.addClass()`) | Comunicação com o Store |
| Eventos (`.on('click', ...)`) | Instanciar outros componentes |
| Animações (`.fadeIn()`, `.fadeOut()`) | Gerar HTML como string ou elemento |

**Exemplo correto:**
```javascript
// ✅ A classe decide o que fazer; jQuery executa no DOM
static salvar() {
  const nome = $('#curr-nome').val().trim();         // jQuery lê o campo
  if (!nome) { Toast.show('⚠️ Obrigatório'); return; } // classe decide
  store.adicionarCurriculo({ nome });                // classe escreve no store
  $('#curriculos-grid').html(this._buildGrid());      // jQuery atualiza o DOM
}
```

**Exemplo incorreto:**
```javascript
// ❌ Lógica de negócio misturada com manipulação de DOM
$('#btn-salvar').on('click', function() {
  if ($('#curr-nome').val() === '') {
    $('#curr-nome').css('border', '1px solid red'); // lógica dentro do jQuery
    return;
  }
  App.curriculos.push({ nome: $('#curr-nome').val() }); // estado global direto
});
```

---

## 7. O Store — estado centralizado

O `store` é um **Singleton** — existe uma única instância em toda a aplicação. Isso garante que todos os módulos trabalham com o mesmo conjunto de dados, sem conflito.

### Por que Singleton?

Em uma SPA sem framework, o estado pode facilmente se fragmentar em variáveis espalhadas por vários arquivos. O Store evita isso: toda leitura e escrita passa por um único ponto, tornando o comportamento previsível e o debug simples.

### Como ler do Store

```javascript
store.buscarLead('AMP-2026-0043');   // retorna o objeto ou null
store.leadsPorEtapa('ligacao');      // retorna array filtrado
store.curriculos;                    // acesso direto ao array (somente leitura)
```

### Como escrever no Store

Sempre via métodos — nunca modificar as propriedades diretamente de fora:

```javascript
// ✅ Correto — usa o método do Store
store.adicionarLead(novoLead);
store.avancarEtapa(lead, 'agendamento');

// ❌ Incorreto — acesso direto ao array
store.leads.push(novoLead);
lead.etapa = 'agendamento';
```

### Preparado para o Supabase

Cada método de escrita do Store já está comentado com o que vai substituí-lo:

```javascript
// Hoje:
adicionarLead(lead) {
  this.leads.push(lead);
}

// Com Supabase (apenas este método muda):
async adicionarLead(lead) {
  const { data } = await supabase.from('leads').insert(lead).single();
  this.leads.push(data);
  return data;
}
```

Os módulos que chamam `store.adicionarLead()` não precisam saber desta mudança.

---

## 8. Ciclo de vida de uma ação

Todo fluxo no sistema segue este ciclo:

```
1. EVENTO         → usuário interage com o HTML (clique, submit, change)
2. WRAPPER        → app.js roteia para o método correto da classe
3. VALIDAÇÃO      → módulo valida os dados (campos obrigatórios, regras de negócio)
4. ESCRITA        → módulo chama o Store para persistir a mudança
5. FEEDBACK UI    → Toast confirma ou alerta o usuário
6. RENDERIZAÇÃO   → módulo re-renderiza as partes afetadas do DOM
7. AUDITORIA      → AtividadeModule registra a ação no histórico (quando aplicável)
```

---

## 9. Boas práticas para escalar

### Adicionar um novo módulo de página

1. Criar o arquivo `js/modules/NomeModule.js` com uma classe estática.
2. Adicionar `<script src="js/modules/NomeModule.js"></script>` no `index.html` antes do `app.js`.
3. Chamar `NomeModule.render()` no `$(document).ready` do `app.js`.
4. Expor as funções necessárias via `window.*` no `app.js`.
5. Registrar a rota em `Router._navMap` e criar o `#page-nome` no HTML.

```javascript
// js/modules/NotificacoesModule.js
class NotificacoesModule {
  static render() { /* monta a lista de notificações */ }
  static marcarLida(id) { /* atualiza o store e re-renderiza */ }
}
```

---

### Adicionar um novo componente reutilizável

1. Criar `js/components/NomeComponente.js`.
2. Seguir o padrão: a classe recebe dados no construtor, `render()` retorna um elemento jQuery.
3. Adicionar o `<script>` no `index.html` na seção de componentes (antes dos módulos).

```javascript
// js/components/StatusBadge.js
class StatusBadge {
  constructor(status, config) {
    this.status = status;
    this.config = config;
  }
  render() {
    return $('<span>')
      .addClass('status-badge')
      .css({ background: this.config.bg, color: this.config.color })
      .text(this.config.label);
  }
}
```

---

### Adicionar novos dados ao Store

1. Declarar a propriedade no `constructor()` com valor padrão (`[]` ou `null`).
2. Criar métodos explícitos de leitura e escrita (nunca expor o array diretamente para escrita).
3. Adicionar o dado inicial em `inicializar()` se necessário para prototipação.

```javascript
// No constructor do Store:
this.notificacoes = [];

// Métodos:
adicionarNotificacao(msg) { this.notificacoes.unshift({ msg, lida: false }); }
buscarNaoLidas()          { return this.notificacoes.filter(n => !n.lida);   }
marcarTodasLidas()        { this.notificacoes.forEach(n => n.lida = true);   }
```

---

### Adicionar novas constantes

Sempre em `constants.js`. Nunca definir constantes dentro de módulos ou componentes — isso impede reutilização e cria duplicações.

```javascript
// constants.js
const LOCAL_AGENDAMENTO = {
  interno: { label: '🏢 Interno', icon: '🏢' },
  externo: { label: '📍 Externo', icon: '📍' },
  online:  { label: '💻 Online',  icon: '💻' },
};
```

---

### Separar módulos grandes

Quando `Modules.js` crescer demais, separar cada classe em seu próprio arquivo:

```
js/modules/
├── FunilModule.js
├── AtividadeModule.js      ← extraído de Modules.js
├── HistoricoModule.js      ← extraído de Modules.js
├── AgendaModule.js         ← extraído de Modules.js
├── RelatoriosModule.js     ← extraído de Modules.js
├── CurriculoModule.js      ← extraído de Modules.js
└── UsuarioModule.js        ← extraído de Modules.js
```

O critério para separar: quando o módulo ultrapassar ~150 linhas ou quando precisar de um colaborador diferente trabalhando nele simultaneamente.

---

### Não expor mais do que o necessário ao `window`

O `app.js` expõe funções ao `window.*` para compatibilidade com o HTML que usa `onclick`. Conforme o HTML for sendo refatorado para usar eventos registrados via jQuery (`.on('click', ...)`), esses wrappers podem ser removidos do `window`, reduzindo o escopo global.

**Objetivo de longo prazo:**
```javascript
// Em vez de onclick no HTML:
<button onclick="salvarNovoLead()">Salvar</button>

// Registrar o evento no módulo ou no app.js:
$(document).on('click', '#btn-salvar-lead', () => FunilModule.salvarNovoLead());
```

---

### Convenções de nomenclatura

| O que é | Convenção | Exemplo |
|---|---|---|
| Classes | PascalCase | `FunilModule`, `KanbanCard` |
| Instâncias | camelCase | `store`, `card` |
| Constantes globais | UPPER_SNAKE_CASE | `STAGE_ORDER`, `FONTES_LEAD` |
| Métodos públicos | camelCase | `renderKanban()`, `abrir()` |
| Métodos internos | `_camelCase` | `_buildTags()`, `_popularModalLead()` |
| IDs no HTML | kebab-case | `#modal-novo-lead`, `#kanban-board` |
| Classes CSS | kebab-case | `.k-card`, `.funil-item` |

---

### Comentários obrigatórios

Todo arquivo deve ter o cabeçalho padrão:
```javascript
/* ============================================================
   AMPARAR CRM — js/camada/NomeArquivo.js
   Descrição do propósito em uma linha.
   Beyond Bits Tecnologia © 2026
   ============================================================ */
```

Todo método deve ter um comentário de separação com descrição curta:
```javascript
/* ----------------------------------------------------------
   Descrição do que o método faz.
   @param {Tipo} param — descrição
   @returns {Tipo} — descrição
   ---------------------------------------------------------- */
```

---

## 10. Roadmap de integração com Supabase

A arquitetura foi desenhada para que a integração com o Supabase seja cirúrgica — sem refatoração dos módulos e componentes.

### Fase 1 — Autenticação (próxima etapa)

Criar `js/infra/SupabaseClient.js` com a instância do cliente:
```javascript
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

Criar `js/services/AuthService.js`:
```javascript
class AuthService {
  static async login(email, senha) { ... }
  static async logout()            { ... }
  static usuarioAtual()            { return supabase.auth.user(); }
}
```

### Fase 2 — Banco de dados (após autenticação)

Criar `js/services/LeadService.js`, `AgendaService.js`, etc. Cada service encapsula as queries do Supabase. O Store passa a chamar os services em vez de manipular arrays locais.

### Fase 3 — Row Level Security

Configurar as policies no painel do Supabase para garantir que:
- Especialistas veem apenas seus próprios leads (`especialista_id = auth.uid()`)
- Supervisores e Gerentes veem todos da filial
- Nenhum dado é acessível sem sessão ativa

### Fase 4 — Remoção dos dados iniciais

Remover as constantes `INITIAL_LEADS`, `INITIAL_CURRICULOS`, `INITIAL_USUARIOS` e `INITIAL_ATIVIDADES` do `constants.js`. O `store.inicializar()` passa a ser `await store.carregarDoServidor()`.

### Fase 5 — Log de auditoria (RNF-07)

Criar `js/infra/AuditLogger.js` que grava cada operação CRUD na tabela `audit_log` do Supabase com usuário, timestamp, tabela afetada, valor anterior e novo valor.

---

*Documento mantido pela Beyond Bits Tecnologia. Atualizar a cada mudança estrutural na arquitetura.*
