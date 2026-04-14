/* ============================================================
   AMPARAR CRM — app.js
   Beyond Bits Tecnologia © 2026
   ============================================================ */

'use strict';

/* ============================================================
   STATE
   ============================================================ */
const App = {
  currentPage: 'dashboard',
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  notifications: [],
  leads: [],
  agendamentos: [],
  ligacoes: [],
  curriculos: [],
  usuarios: [],

  // Lead counter
  leadCounter: 48,

  // Current lead being edited/viewed
  currentLead: null,
  currentLeadStage: 'lead',

  // Pending confirm callback
  confirmCallback: null,
};

/* ============================================================
   INITIAL DATA
   ============================================================ */
const INITIAL_LEADS = [
  { id: 'AMP-2026-0043', nome: 'Ana Rocha', tel: '(48) 99821-4532', fonte: 'Recomendação associado', captador: 'Carlos Mendes', tags: ['novo'], etapa: 'lead', tentativas: 0, obs: '' },
  { id: 'AMP-2026-0044', nome: 'Roberto Neves', tel: '(48) 99134-7823', fonte: 'Site', captador: 'Ana Beatriz', tags: ['atencao'], etapa: 'lead', tentativas: 0, obs: '' },
  { id: 'AMP-2026-0040', nome: 'Pedro Lima', tel: '(48) 99721-3344', fonte: 'Carteira Amparar', captador: 'Carlos Mendes', tags: ['quente'], etapa: 'ligacao', tentativas: 5, obs: 'Cliente demonstrou interesse em cobertura para importado.' },
  { id: 'AMP-2026-0039', nome: 'Lucas Ferreira', tel: '(48) 98832-9910', fonte: 'Inativo', captador: 'Carlos Mendes', tags: [], etapa: 'ligacao', tentativas: 2, obs: '' },
  { id: 'AMP-2026-0037', nome: 'Maria Costa', tel: '(48) 99234-5566', fonte: 'Redes Sociais', captador: 'Carlos Mendes', tags: ['quente'], etapa: 'agendamento', tentativas: 3, obs: 'Agendamento confirmado para 26/03.' },
  { id: 'AMP-2026-0036', nome: 'Sandra Oliveira', tel: '(48) 98877-4422', fonte: 'Site', captador: 'Ana Beatriz', tags: [], etapa: 'agendamento', tentativas: 2, obs: '' },
  { id: 'AMP-2026-0032', nome: 'Carlos Melo', tel: '(48) 99543-2211', fonte: 'Importado/Diesel', captador: 'Carlos Mendes', tags: ['delay'], etapa: 'visita', tentativas: 4, obs: 'Solicitou mais prazo.' },
  { id: 'AMP-2026-0029', nome: 'Renata Souza', tel: '(48) 98712-3399', fonte: 'Minha Carteira', captador: 'Rodrigo Lopes', tags: [], etapa: 'visita', tentativas: 3, obs: '' },
  { id: 'AMP-2026-0015', nome: 'João Silva', tel: '(48) 99911-2233', fonte: 'Recomendação associado', captador: 'Carlos Mendes', tags: ['ativo'], etapa: 'venda', tentativas: 6, obs: '' },
  { id: 'AMP-2026-0010', nome: 'Marcos Alves', tel: '(48) 99387-1122', fonte: 'Carteira Amparar', captador: 'Carlos Mendes', tags: ['ativo'], etapa: 'carteira', tentativas: 0, obs: '' },
  { id: 'AMP-2026-0009', nome: 'Priscila Gomes', tel: '(48) 98865-7744', fonte: 'Inativo', captador: 'Ana Beatriz', tags: [], etapa: 'carteira', tentativas: 0, obs: '' },
];

const INITIAL_CURRICULOS = [
  { id: 1, nome: 'Thiago Barbosa', cargo: 'Consultor Comercial', email: 'thiago@email.com', tel: '(48) 99123-4567', exp: 5, status: 'em_analise', obs: '' },
  { id: 2, nome: 'Letícia Nunes', cargo: 'Atendimento', email: 'leticia@email.com', tel: '(48) 98765-4321', exp: 2, status: 'aprovado', obs: 'Ótima comunicação.' },
  { id: 3, nome: 'Rafael Cunha', cargo: 'Vendas', email: 'rafael@email.com', tel: '(48) 99456-7890', exp: 3, status: 'reprovado', obs: 'Sem disponibilidade.' },
];

const USUARIOS_DATA = [
  { nome: 'Carlos Mendes', sigla: 'CM', filial: 'Matriz', perfil: 'especialista', status: 'ativo' },
  { nome: 'Ana Beatriz', sigla: 'AB', filial: 'Centro', perfil: 'especialista', status: 'ativo' },
  { nome: 'Rodrigo Lopes', sigla: 'RL', filial: 'São José', perfil: 'especialista', status: 'ativo' },
  { nome: 'Fernanda Costa', sigla: 'FC', filial: 'Matriz', perfil: 'supervisor', status: 'ativo' },
  { nome: 'Ricardo Almeida', sigla: 'RA', filial: 'Todas', perfil: 'gerente', status: 'ativo' },
];

const FONTES_LEAD = [
  { value: 'Carteira Amparar', desc: 'Leads provenientes da carteira inativa da Amparar' },
  { value: 'Inativo', desc: 'Clientes inativos que podem ser reativados' },
  { value: 'Associado novo Veículo', desc: 'Associado que adquiriu novo veículo' },
  { value: 'Cliente Potencial', desc: 'Contato identificado como potencial cliente' },
  { value: 'Consultor que saiu', desc: 'Leads deixados por consultor que saiu da empresa' },
  { value: 'Recomendação associado', desc: 'Indicação feita por associado ativo' },
  { value: 'Recomendação não associado', desc: 'Indicação feita por não associado' },
  { value: 'Troca de Titularidade', desc: 'Cliente que trocou a titularidade do veículo' },
  { value: 'Projeto 150 X', desc: 'Leads do Projeto 150 linha X' },
  { value: 'Projeto 150 Y', desc: 'Leads do Projeto 150 linha Y' },
  { value: 'Internos', desc: 'Leads gerados internamente pela equipe' },
  { value: 'Site', desc: 'Leads captados pelo site da Amparar' },
  { value: 'Terceiros', desc: 'Leads originados de parceiros e terceiros' },
  { value: 'Redes Sociais', desc: 'Captados via Instagram, Facebook, etc.' },
  { value: 'Externos', desc: 'Prospecção externa em eventos, ruas, etc.' },
  { value: 'Reciclagem', desc: 'Leads que voltaram ao funil após período sem contato' },
  { value: 'Minha Carteira', desc: 'Contatos da carteira pessoal do especialista' },
];

const AGENDA_DATA = {
  'Seg': { '08:00': [], '09:00': ['VR', 'LM'], '10:00': ['NB'], '11:00': ['KP', 'NB'], '12:00': ['KP'], '13:00': ['LM'], '14:00': ['IE'], '15:00': ['LM'], '16:00': ['KP'], '17:00': ['KP'], '18:00': ['DE'], '19:00': ['MM'], '20:00': [] },
  'Ter': { '08:00': ['MM'], '09:00': ['VR', 'LM'], '10:00': ['NB'], '11:00': ['KP', 'NB'], '12:00': ['KP'], '13:00': ['IE'], '14:00': ['LM'], '15:00': ['NB', 'MM'], '16:00': ['LM'], '17:00': ['KP', 'NB'], '18:00': ['KP'], '19:00': ['VR'], '20:00': [] },
  'Qua': { '08:00': ['DE'], '09:00': ['LM'], '10:00': ['IE'], '11:00': ['NB', 'IE'], '12:00': ['KP', 'VR'], '13:00': ['LM'], '14:00': ['KP', 'MM'], '15:00': ['DE'], '16:00': ['NB'], '17:00': ['SA'], '18:00': ['SA'], '19:00': ['MM'], '20:00': [] },
  'Qui': { '08:00': ['KP'], '09:00': ['LM', 'VR'], '10:00': ['KP', 'IE'], '11:00': ['SA'], '12:00': ['NB', 'MM'], '13:00': ['SA'], '14:00': ['IE'], '15:00': ['IE', 'MM'], '16:00': ['VR'], '17:00': ['NB', 'IE'], '18:00': ['MM', 'VR'], '19:00': ['KP'], '20:00': [] },
  'Sex': { '08:00': ['KP'], '09:00': ['SA'], '10:00': ['LM', 'MM'], '11:00': ['IE'], '12:00': ['DE'], '13:00': ['LM'], '14:00': ['DE', 'LM'], '15:00': ['NB'], '16:00': ['VR', 'NB'], '17:00': ['NB'], '18:00': ['LM'], '19:00': [], '20:00': [] },
  'Sáb': { '08:00': [], '09:00': ['IE'], '10:00': [], '11:00': ['NB'], '12:00': ['IE'], '13:00': ['NB'], '14:00': [], '15:00': ['MM'], '16:00': [], '17:00': [], '18:00': [], '19:00': [], '20:00': [] },
  'Dom': { '08:00': [], '09:00': [], '10:00': [], '11:00': [], '12:00': [], '13:00': [], '14:00': [], '15:00': [], '16:00': [], '17:00': [], '18:00': [], '19:00': [], '20:00': [] }
};

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  App.leads = [...INITIAL_LEADS];
  App.curriculos = [...INITIAL_CURRICULOS];
  App.usuarios = [...USUARIOS_DATA];

  initNavigation();
  initModalCloseOnBackdrop();
  initFiltroButtons();
  initDatetimeFields();
  renderKanban();
  renderAgendaDashboard();
  renderHistorico();
  renderRelatorios();
  renderCurriculos();
  renderUsuarios();
  renderAgendaFull();

  // Sidebar toggle
  document.getElementById('sidebar-toggle')?.addEventListener('click', toggleSidebar);
  document.getElementById('mobile-backdrop')?.addEventListener('click', closeMobileSidebar);

  // Init counters
  updateFunilPreview();
  updateKPIs();
});

/* ============================================================
   NAVIGATION
   ============================================================ */
function navigate(page) {
  App.currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');

  const navMap = {
    dashboard: 'nav-dashboard', funil: 'nav-funil', agenda: 'nav-agenda',
    historico: 'nav-historico', relatorios: 'nav-relatorios',
    curriculos: 'nav-curriculos', configuracoes: 'nav-configuracoes'
  };
  const navEl = document.getElementById(navMap[page]);
  if (navEl) navEl.classList.add('active');

  // Close mobile sidebar
  closeMobileSidebar();
}

function initNavigation() {
  navigate('dashboard');
}

/* ============================================================
   SIDEBAR
   ============================================================ */
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (window.innerWidth <= 600) {
    toggleMobileSidebar();
  } else {
    App.sidebarCollapsed = !App.sidebarCollapsed;
    sidebar.classList.toggle('collapsed', App.sidebarCollapsed);
  }
}

function toggleMobileSidebar() {
  App.mobileSidebarOpen = !App.mobileSidebarOpen;
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('mobile-backdrop');
  sidebar.classList.toggle('mobile-open', App.mobileSidebarOpen);
  backdrop.classList.toggle('open', App.mobileSidebarOpen);
}

function closeMobileSidebar() {
  App.mobileSidebarOpen = false;
  document.getElementById('sidebar')?.classList.remove('mobile-open');
  document.getElementById('mobile-backdrop')?.classList.remove('open');
}

/* ============================================================
   MODALS
   ============================================================ */
function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('open');
  document.body.style.overflow = '';
}

function initModalCloseOnBackdrop() {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) {
      if (e.target === this) closeModal(this.id);
    });
  });
}

/* ============================================================
   MODAL TABS (Etapas do Lead)
   ============================================================ */
function switchModalTab(tabId, contentId, containerEl) {
  const container = containerEl.closest('.modal') || document;
  container.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
  container.querySelectorAll('.modal-tab-content').forEach(c => c.classList.remove('active'));
  const tab = container.querySelector(`[data-tab="${tabId}"]`);
  const content = document.getElementById(contentId);
  if (tab) tab.classList.add('active');
  if (content) content.classList.add('active');
}

/* ============================================================
   LEAD STAGE PROGRESSION
   ============================================================ */
const STAGE_ORDER = ['lead', 'ligacao', 'agendamento', 'visita', 'venda', 'carteira'];
const STAGE_LABELS = {
  lead: 'Lead', ligacao: 'Ligação', agendamento: 'Agendamento',
  visita: 'Visita', venda: 'Venda', carteira: 'Carteira'
};
const STAGE_COLORS = {
  lead: '#2B6CB0', ligacao: '#5A8A6A', agendamento: '#7B5EA7',
  visita: '#C07828', venda: '#1B6B3A', carteira: '#4A5568'
};

function getStageIndex(stage) { return STAGE_ORDER.indexOf(stage); }

function openLeadModal(leadId) {
  const lead = App.leads.find(l => l.id === leadId);
  if (!lead) return;
  App.currentLead = lead;
  App.currentLeadStage = lead.etapa;
  populateLeadModal(lead);
  openModal('modal-lead-detail');
}

function populateLeadModal(lead) {
  const stageIdx = getStageIndex(lead.etapa);
  const modal = document.getElementById('modal-lead-detail');

  // Set header
  modal.querySelector('#mld-nome').textContent = lead.nome;
  modal.querySelector('#mld-id').textContent = lead.id;
  modal.querySelector('#mld-stage-badge').textContent = STAGE_LABELS[lead.etapa];
  modal.querySelector('#mld-stage-badge').style.background = STAGE_COLORS[lead.etapa] + '20';
  modal.querySelector('#mld-stage-badge').style.color = STAGE_COLORS[lead.etapa];

  // Configure tabs
  STAGE_ORDER.forEach((s, i) => {
    const tab = modal.querySelector(`[data-tab="${s}"]`);
    if (!tab) return;
    if (i <= stageIdx) {
      tab.classList.remove('disabled');
    } else {
      tab.classList.add('disabled');
    }
  });

  // Activate current stage tab
  const currentTab = modal.querySelector(`[data-tab="${lead.etapa}"]`);
  if (currentTab && !currentTab.classList.contains('disabled')) {
    modal.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
    modal.querySelectorAll('.modal-tab-content').forEach(c => c.classList.remove('active'));
    currentTab.classList.add('active');
    const contentEl = document.getElementById('tab-content-' + lead.etapa);
    if (contentEl) contentEl.classList.add('active');
  }

  // Populate lead tab fields
  modal.querySelector('#mld-tel').textContent = lead.tel;
  modal.querySelector('#mld-fonte').value = lead.fonte;
  modal.querySelector('#mld-captador').value = lead.captador || '';
  modal.querySelector('#mld-obs').value = lead.obs || '';

  // Ligação tab: show tentativas
  const tentEl = modal.querySelector('#mld-tentativas');
  if (tentEl) {
    tentEl.textContent = lead.tentativas + ' tentativas';
    tentEl.className = 'tentativas-badge' + (lead.tentativas >= 28 ? ' warning' : '');
  }

  // Update remarketing state
  updateRemarketingState(lead.tentativas);
}

/* ============================================================
   NOVO LEAD
   ============================================================ */
function novoLead() {
  App.leadCounter++;
  const newId = 'AMP-2026-00' + App.leadCounter;
  document.getElementById('new-lead-id').value = newId;
  // Set today
  document.getElementById('new-lead-data').value = getTodayDate();
  openModal('modal-novo-lead');
}

function salvarNovoLead() {
  const nome = document.getElementById('new-lead-nome').value.trim();
  const tel = document.getElementById('new-lead-tel').value.trim();
  const fonte = document.getElementById('new-lead-fonte').value;
  const captador = document.getElementById('new-lead-captador').value.trim();

  if (!nome) { showToast('⚠️ Nome é obrigatório', 'warning'); return; }
  if (!tel) { showToast('⚠️ Telefone é obrigatório', 'warning'); return; }
  if (!fonte) { showToast('⚠️ Fonte do lead é obrigatória', 'warning'); return; }

  const lead = {
    id: document.getElementById('new-lead-id').value,
    nome,
    tel,
    fonte,
    captador,
    tags: [],
    etapa: 'lead',
    tentativas: 0,
    obs: document.getElementById('new-lead-obs').value.trim(),
    placa: document.getElementById('new-lead-placa').value.trim(),
    fipe: document.getElementById('new-lead-fipe').value.trim(),
    quemIndicou: document.getElementById('new-lead-quem').value.trim(),
  };

  App.leads.push(lead);
  renderKanban();
  updateFunilPreview();
  addAtividade('🌱', lead.nome, 'Lead cadastrado', lead.fonte, 'var(--azul)');
  closeModal('modal-novo-lead');
  showToast('✅ Lead cadastrado com sucesso!', 'success');

  // Clear form
  document.getElementById('form-novo-lead').reset();
}

/* ============================================================
   LIGAÇÃO
   ============================================================ */
function registrarLigacao(leadId) {
  const lead = App.leads.find(l => l.id === leadId) || App.currentLead;
  if (!lead) return;

  const resultado = document.querySelector('#modal-lead-detail .res-opt.selected')?.textContent?.trim() || '';
  if (!resultado) { showToast('⚠️ Selecione um resultado', 'warning'); return; }

  // Show confirm popup (RN-02)
  showConfirm(
    '📞',
    'Confirmar Ligação',
    `Registrar ligação para ${lead.nome}?\nResultado: ${resultado}`,
    () => {
      lead.tentativas++;
      lead.obs = document.querySelector('#modal-lead-detail #mld-obs')?.value || lead.obs;

      // Log
      addLigacaoHist(lead, resultado);
      addAtividade('📞', lead.nome, `Tentativa #${lead.tentativas}`, resultado, 'var(--verde)');

      // Update kanban card
      renderKanban();
      updateFunilPreview();
      updateKPIs();

      // Check completion
      if (resultado.includes('Agendamento')) {
        setTimeout(() => showConcluirLigacaoPopup(lead, 'agendamento'), 300);
      } else if (resultado.includes('Remarketing') && lead.tentativas >= 30) {
        setTimeout(() => showConcluirLigacaoPopup(lead, 'remarketing'), 300);
      } else {
        showToast('📞 Ligação registrada! Tentativa #' + lead.tentativas, 'success');
        const tentEl = document.querySelector('#modal-lead-detail #mld-tentativas');
        if (tentEl) {
          tentEl.textContent = lead.tentativas + ' tentativas';
          tentEl.className = 'tentativas-badge' + (lead.tentativas >= 28 ? ' warning' : '');
        }
        updateRemarketingState(lead.tentativas);
      }
    }
  );
}

function showConcluirLigacaoPopup(lead, tipo) {
  // RN-03: popup para escolher Remarketing ou Agendamento
  const overlay = document.getElementById('modal-concluir-ligacao');
  document.getElementById('mcl-nome').textContent = lead.nome;
  document.getElementById('mcl-tent').textContent = lead.tentativas;

  const btnRemarketing = document.getElementById('mcl-btn-remarketing');
  if (lead.tentativas < 30) {
    btnRemarketing.disabled = true;
    btnRemarketing.title = 'Disponível após 30 tentativas';
    document.getElementById('mcl-remarketing-msg').style.display = 'block';
  } else {
    btnRemarketing.disabled = false;
    document.getElementById('mcl-remarketing-msg').style.display = 'none';
  }

  btnRemarketing.onclick = () => {
    closeModal('modal-concluir-ligacao');
    showToast('♻️ Lead enviado para Remarketing', 'info');
  };

  document.getElementById('mcl-btn-agendamento').onclick = () => {
    avançarEtapa(lead, 'agendamento');
    closeModal('modal-concluir-ligacao');
    closeModal('modal-lead-detail');
    showToast('📅 Prosseguindo para Agendamento...', 'success');
    setTimeout(() => openLeadModal(lead.id), 200);
  };

  openModal('modal-concluir-ligacao');
}

function updateRemarketingState(tentativas) {
  const remarketing = document.querySelector('#modal-lead-detail .res-opt[data-tipo="remarketing"]');
  const msg = document.querySelector('#modal-lead-detail .remarketing-warning');
  if (!remarketing) return;
  if (tentativas >= 30) {
    remarketing.classList.remove('disabled-opt');
    remarketing.title = '';
    if (msg) msg.style.display = 'none';
  } else {
    remarketing.classList.add('disabled-opt');
    remarketing.title = `Disponível após 30 tentativas (atual: ${tentativas})`;
    if (msg) msg.style.display = 'flex';
  }
}

/* ============================================================
   AGENDAMENTO
   ============================================================ */
function confirmarAgendamento(lead) {
  lead = lead || App.currentLead;
  if (!lead) return;

  const data = document.querySelector('#tab-content-agendamento #agen-data-visita')?.value;
  const categoria = document.querySelector('#tab-content-agendamento #agen-categoria')?.value;
  const local = document.querySelector('#tab-content-agendamento #agen-local')?.value;

  if (!data) { showToast('⚠️ Data/hora da visita obrigatória', 'warning'); return; }

  const agend = { lead, data, categoria, local };
  App.agendamentos.push(agend);

  avançarEtapa(lead, 'agendamento');
  renderKanban();
  renderAgendaFull();
  renderAgendaDashboard();
  addAtividade('📅', lead.nome, 'Agendamento confirmado', formatDate(data), 'var(--roxo)');

  // Notify manager (RN-04)
  addNotification(`📅 Novo agendamento: ${lead.nome} — ${formatDate(data)}`);
  showToast('📅 Agendamento confirmado! Gestor notificado.', 'success');
  closeModal('modal-lead-detail');
}

/* ============================================================
   VISITA
   ============================================================ */
function confirmarVisita(lead) {
  lead = lead || App.currentLead;
  if (!lead) return;

  const selected = document.querySelector('#tab-content-visita .vres-btn.selected');
  if (!selected) { showToast('⚠️ Selecione um resultado da visita', 'warning'); return; }

  const resultado = selected.dataset.tipo;

  if (resultado === 'venda') {
    avançarEtapa(lead, 'venda');
    renderKanban();
    addAtividade('💰', lead.nome, 'Visita — Venda realizada!', '', 'var(--verde)');
    showToast('🎉 Ótimo! Venda realizada! Avançando...', 'success');
    closeModal('modal-lead-detail');
    setTimeout(() => openLeadModal(lead.id), 200);
  } else if (resultado === 'c2') {
    addAtividade('📅', lead.nome, 'Visita — C2 agendado', '', 'var(--azul)');
    showToast('📅 C2 registrado.', 'success');
    closeModal('modal-lead-detail');
  } else {
    addAtividade('🏠', lead.nome, `Visita — ${resultado === 'delay' ? 'Delay' : 'Não fechou'}`, '', 'var(--laranja)');
    showToast('✅ Resultado registrado.', 'success');
    closeModal('modal-lead-detail');
  }
  renderKanban();
}

/* ============================================================
   VENDA
   ============================================================ */
function confirmarVenda(lead) {
  lead = lead || App.currentLead;
  if (!lead) return;

  const adesao = document.querySelector('#tab-content-venda #venda-adesao')?.value || '';
  const mensalidade = document.querySelector('#tab-content-venda #venda-mensalidade')?.value || '';

  avançarEtapa(lead, 'carteira');

  // Set sale date (RN-13)
  lead.dataVenda = getTodayDate();

  renderKanban();
  updateKPIs();
  updateFunilPreview();
  addAtividade('💰', lead.nome, `Venda concluída — ${mensalidade}/mês`, `Adesão: ${adesao}`, 'var(--verde)');

  showToast('🎉 Venda registrada! Associado na carteira.', 'success');
  closeModal('modal-lead-detail');
}

/* ============================================================
   RECOMENDAÇÕES → NOVO LEAD (RN-06)
   ============================================================ */
function criarLeadRecomendacao(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const nome = container.querySelector('input[name="rec-nome"]')?.value?.trim() || container.querySelector('.rec-nome')?.value?.trim();
  const tel  = container.querySelector('input[name="rec-tel"]')?.value?.trim() || container.querySelector('.rec-tel')?.value?.trim();

  if (!nome || !tel) {
    showToast('⚠️ Nome e telefone da recomendação são obrigatórios', 'warning');
    return;
  }

  App.leadCounter++;
  const newLead = {
    id: 'AMP-2026-00' + App.leadCounter,
    nome, tel,
    fonte: 'Recomendação associado',
    captador: 'Carlos Mendes',
    tags: ['novo'],
    etapa: 'lead',
    tentativas: 0,
    obs: `Recomendado por ${App.currentLead?.nome || 'associado'}`
  };
  App.leads.push(newLead);
  renderKanban();
  updateFunilPreview();
  addAtividade('🌱', nome, 'Lead criado via recomendação', '', 'var(--azul)');
  showToast('🌱 Lead criado automaticamente no funil!', 'success');

  // RN-06: Clear form
  container.querySelectorAll('input').forEach(i => i.value = '');
}

/* ============================================================
   AVANÇAR ETAPA
   ============================================================ */
function avançarEtapa(lead, novaEtapa) {
  lead.etapa = novaEtapa;
  renderKanban();
  updateFunilPreview();
}

/* ============================================================
   RENDER KANBAN
   ============================================================ */
function renderKanban() {
  const etapaConfigs = [
    { key: 'lead', label: '🌱 Lead', color: '#2B6CB0', addLabel: '＋ Novo Lead', addFn: 'novoLead()' },
    { key: 'ligacao', label: '📞 Ligação', color: '#5A8A6A', addLabel: '＋ Registrar Ligação', addFn: '' },
    { key: 'agendamento', label: '📅 Agendamento', color: '#7B5EA7', addLabel: '＋ Novo Agendamento', addFn: '' },
    { key: 'visita', label: '🏠 Visita', color: '#C07828', addLabel: '＋ Registrar Visita', addFn: '' },
    { key: 'venda', label: '💰 Venda', color: '#1B6B3A', addLabel: '＋ Registrar Venda', addFn: '' },
    { key: 'carteira', label: '👛 Carteira', color: '#4A5568', addLabel: '', addFn: '' },
  ];

  const kanban = document.getElementById('kanban-board');
  if (!kanban) return;

  kanban.innerHTML = etapaConfigs.map(col => {
    const leadsNaEtapa = App.leads.filter(l => l.etapa === col.key);
    const cards = leadsNaEtapa.map(l => renderKanbanCard(l, col.color)).join('');
    const addBtn = col.addLabel
      ? `<button class="add-card-btn" onclick="${col.addFn || `openLeadModalByStage('${col.key}')`}" style="background:${col.color}30;border-color:rgba(255,255,255,0.3);">${col.addLabel}</button>`
      : '';
    return `
      <div class="kanban-col">
        <div class="kanban-col-header" style="background:${col.color};">
          <span>${col.label}</span>
          <span class="kanban-count">${leadsNaEtapa.length}</span>
        </div>
        <div class="kanban-cards">${cards || '<div style="padding:12px;text-align:center;font-size:11px;opacity:0.5;color:white;">Sem leads</div>'}</div>
        ${addBtn}
      </div>`;
  }).join('');
}

function renderKanbanCard(lead, borderColor) {
  const tagsHtml = lead.tags.map(t => {
    const tagClasses = { quente: 'tag-quente', atencao: 'tag-atencao', novo: 'tag-novo', delay: 'tag-delay', vip: 'tag-vip', ativo: 'tag-ativo' };
    const tagLabels = { quente: '🔥 Quente', atencao: '⚠️ Atenção', novo: '🆕 Novo', delay: '⏳ Delay', vip: '⭐ VIP', ativo: '✅ Ativo' };
    return `<span class="tag ${tagClasses[t] || ''}">${tagLabels[t] || t}</span>`;
  }).join('');

  const tentHtml = lead.etapa === 'ligacao' || lead.tentativas > 0
    ? `<span class="k-card-tentativas${lead.tentativas >= 25 ? ' warning' : ''}">${lead.tentativas} tent.</span>`
    : '';

  return `
    <div class="k-card" style="border-left-color:${borderColor};" onclick="openLeadModal('${lead.id}')">
      <div class="k-card-id">${lead.id}</div>
      <div class="k-card-nome">${escHtml(lead.nome)}</div>
      <div class="k-card-tel">📱 ${escHtml(lead.tel)}</div>
      ${tagsHtml ? `<div class="k-card-tags">${tagsHtml}</div>` : ''}
      <div class="k-card-footer">
        <span class="k-card-fonte">${escHtml(lead.fonte)}</span>
        ${tentHtml}
      </div>
    </div>`;
}

/* ============================================================
   FUNIL PREVIEW (DASHBOARD)
   ============================================================ */
function updateFunilPreview() {
  const etapas = ['lead', 'ligacao', 'agendamento', 'visita', 'venda', 'carteira'];
  const labels = { lead: 'Leads', ligacao: 'Ligações', agendamento: 'Agendamentos', visita: 'Visitas', venda: 'Vendas', carteira: 'Carteira' };
  const cores = { lead: 'var(--azul)', ligacao: 'var(--verde-claro)', agendamento: 'var(--roxo)', visita: 'var(--laranja)', venda: 'var(--verde)', carteira: '#4A5568' };

  const totals = {};
  etapas.forEach(e => { totals[e] = App.leads.filter(l => l.etapa === e).length; });
  const max = Math.max(...Object.values(totals), 1);

  const container = document.getElementById('funil-preview');
  if (!container) return;

  container.innerHTML = etapas.map(e => {
    const n = totals[e];
    const pct = Math.round((n / max) * 100);
    const pctLabel = e === 'lead' ? '100%' : (e === 'carteira' ? '—' : Math.round((n / (totals['lead'] || 1)) * 100) + '%');
    return `
      <div class="funil-item">
        <div class="funil-dot" style="background:${cores[e]};"></div>
        <div class="funil-label">${labels[e]}</div>
        <div class="funil-bar-wrap"><div class="funil-bar" style="width:${pct}%;background:${cores[e]};"></div></div>
        <div class="funil-num">${n}</div>
        <div class="funil-pct">${pctLabel}</div>
      </div>`;
  }).join('');
}

/* ============================================================
   KPIs
   ============================================================ */
function updateKPIs() {
  const vendas = App.leads.filter(l => l.etapa === 'carteira').length;
  const lig = App.ligacoes.length;
  const kpiVendas = document.getElementById('kpi-associados');
  const kpiLig = document.getElementById('kpi-ligacoes');
  if (kpiVendas) kpiVendas.textContent = 312 + vendas;
  if (kpiLig) kpiLig.textContent = 38 + lig;
}

/* ============================================================
   AGENDA — DASHBOARD SEMANA
   ============================================================ */
function renderAgendaDashboard() {
  const container = document.getElementById('agenda-week-container');
  if (!container) return;

  const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const horas = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'];

  let html = `<div class="agenda-week">
    <div class="agenda-week-header">
      <div>Hora</div>
      ${dias.map((d, i) => `<div class="${i === 2 ? 'today-col' : ''}">${d}</div>`).join('')}
    </div>`;

  horas.forEach(hora => {
    html += `<div class="agenda-time-col">${hora}</div>`;
    dias.forEach((d, di) => {
      const slots = AGENDA_DATA[d]?.[hora] || [];
      const isToday = di === 2;
      const slotsHtml = slots.map(s =>
        `<span class="agenda-slot" title="${s}">${s}</span>`
      ).join(' ');
      html += `<div class="agenda-cell${isToday ? ' today-col' : ''}">${slotsHtml}</div>`;
    });
  });

  html += '</div>';
  container.innerHTML = html;
}

/* ============================================================
   AGENDA FULL
   ============================================================ */
function renderAgendaFull() {
  const tbody = document.getElementById('agenda-tbody');
  if (!tbody) return;

  const agendamentos = [
    { data: '26/03 14:00', cliente: 'Maria Costa', tel: '(48) 99234-5566', tipo: 'Nacional Particular', local: '🏢 Interno', esp: 'Carlos Mendes', status: 'aguardando' },
    { data: '27/03 10:00', cliente: 'Sandra Oliveira', tel: '(48) 98877-4422', tipo: 'Motocicleta', local: '📍 Externo', esp: 'Carlos Mendes', status: 'confirmado' },
    { data: '27/03 15:30', cliente: 'Felipe Torres', tel: '(48) 99012-8877', tipo: 'Caminhão', local: '💻 Online', esp: 'Ana Beatriz', status: 'aguardando' },
    { data: '28/03 09:00', cliente: 'Roberta Maia', tel: '(48) 98654-3300', tipo: 'Importado/Diesel', local: '🏢 Interno', esp: 'Carlos Mendes', status: 'realizado' },
    ...App.agendamentos.map(a => ({
      data: formatDate(a.data),
      cliente: a.lead?.nome || '—',
      tel: a.lead?.tel || '—',
      tipo: a.categoria || '—',
      local: a.local || '—',
      esp: a.lead?.captador || 'Carlos Mendes',
      status: 'aguardando'
    }))
  ];

  const statusConfig = {
    aguardando: { bg: 'var(--amarelo-suave)', color: 'var(--amarelo)', label: '⏳ Aguardando' },
    confirmado: { bg: 'var(--azul-suave)', color: 'var(--azul)', label: '📋 Confirmado' },
    realizado: { bg: 'var(--verde-suave)', color: 'var(--verde)', label: '✅ Realizado' },
  };

  tbody.innerHTML = agendamentos.map(a => {
    const s = statusConfig[a.status] || statusConfig.aguardando;
    return `<tr>
      <td><span class="hora-badge">${a.data}</span></td>
      <td><strong>${escHtml(a.cliente)}</strong><br><small style="color:var(--cinza-500)">${escHtml(a.tel)}</small></td>
      <td>${escHtml(a.tipo)}</td>
      <td>${a.local}</td>
      <td>${escHtml(a.esp)}</td>
      <td><span class="status-badge" style="background:${s.bg};color:${s.color};">${s.label}</span></td>
    </tr>`;
  }).join('');
}

/* ============================================================
   HISTÓRICO
   ============================================================ */
const ATIVIDADES = [
  { icon: '📞', bg: 'var(--verde-suave)', nome: 'João Silva', det: 'Ligação • Resultado: Agendamento • (48) 99911-2233', hora: '09:42', data: '25/03/26', esp: 'Carlos Mendes', tipo: 'ligacao' },
  { icon: '📅', bg: 'var(--azul-suave)', nome: 'Maria Costa', det: 'Agendamento • 26/03 às 14h • Local: Interno', hora: '10:15', data: '25/03/26', esp: 'Carlos Mendes', tipo: 'agendamento' },
  { icon: '📞', bg: 'var(--laranja-suave)', nome: 'Pedro Lima', det: 'Ligação • Não atendeu • Tentativa #5', hora: '10:52', data: '25/03/26', esp: 'Carlos Mendes', tipo: 'ligacao' },
  { icon: '🏠', bg: 'var(--roxo-suave)', nome: 'Carlos Melo', det: 'Visita • Resultado: Delay', hora: '13:20', data: '25/03/26', esp: 'Carlos Mendes', tipo: 'visita' },
  { icon: '💰', bg: 'var(--verde-suave)', nome: 'João Silva', det: 'Venda • Nacional Particular • R$189/mês', hora: '14:45', data: '24/03/26', esp: 'Carlos Mendes', tipo: 'venda' },
  { icon: '👛', bg: 'var(--cinza-100)', nome: 'Marcos Alves', det: 'Carteira • Pedido de recomendações', hora: '16:00', data: '24/03/26', esp: 'Carlos Mendes', tipo: 'carteira' },
];

function addAtividade(icon, nome, det, extra, color) {
  const now = new Date();
  const hora = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
  const data = now.toLocaleDateString('pt-BR').replace('/20', '/');
  ATIVIDADES.unshift({ icon, bg: 'var(--verde-suave)', nome, det: det + (extra ? ' • ' + extra : ''), hora, data, esp: 'Carlos Mendes', tipo: '' });
  renderAtividades();
  renderHistorico();
}

function renderAtividades() {
  const container = document.getElementById('atividades-recentes');
  if (!container) return;
  const recent = ATIVIDADES.slice(0, 6);
  container.innerHTML = recent.map(a => `
    <div class="atividade-item">
      <div class="ativ-dot" style="background:${a.bg === 'var(--verde-suave)' ? 'var(--verde)' : a.bg === 'var(--azul-suave)' ? 'var(--azul)' : a.bg === 'var(--laranja-suave)' ? 'var(--laranja)' : 'var(--cinza-500)'};"></div>
      <div class="ativ-body">
        <div class="ativ-nome">${escHtml(a.nome)} — ${escHtml(a.det.split('•')[0].trim())}</div>
        <div class="ativ-desc">${escHtml(a.det.split('•').slice(1).join('•').trim())}</div>
      </div>
      <div class="ativ-hora">${a.hora}</div>
    </div>`).join('');
}

function addLigacaoHist(lead, resultado) {
  App.ligacoes.unshift({ lead: lead.nome, tel: lead.tel, resultado, tentativa: lead.tentativas, esp: 'Carlos Mendes' });
}

function renderHistorico(filtro) {
  const list = document.getElementById('historico-list');
  if (!list) return;

  const items = [...ATIVIDADES, ...App.ligacoes.map(l => ({
    icon: '📞', bg: 'var(--verde-suave)',
    nome: l.lead, det: `Ligação • ${l.resultado} • Tentativa #${l.tentativa}`,
    hora: new Date().toTimeString().slice(0,5),
    data: new Date().toLocaleDateString('pt-BR').replace('/20','/'),
    esp: l.esp, tipo: 'ligacao'
  }))];

  const filtered = filtro && filtro !== 'todas'
    ? items.filter(i => i.tipo === filtro)
    : items;

  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-title">Nenhum registro encontrado</div></div>';
    return;
  }

  list.innerHTML = filtered.slice(0, 20).map(a => `
    <div class="hist-item">
      <div class="hist-icon" style="background:${a.bg};">${a.icon}</div>
      <div class="hist-body">
        <div class="hist-nome">${escHtml(a.nome)}</div>
        <div class="hist-det">${escHtml(a.det)}</div>
      </div>
      <div class="hist-meta">
        <div class="hist-time">${a.hora}</div>
        <div>${a.data}</div>
        <div>${escHtml(a.esp)}</div>
      </div>
    </div>`).join('');
}

/* ============================================================
   RELATÓRIOS
   ============================================================ */
function renderRelatorios() {
  // Funil stats in relatórios
  const funilRel = document.getElementById('rel-funil');
  if (funilRel) {
    const etapas = ['lead','ligacao','agendamento','visita','venda','carteira'];
    const cores = ['var(--azul)','var(--verde-claro)','var(--roxo)','var(--laranja)','var(--verde)','#4A5568'];
    const labels = ['Leads','Ligações','Agendamentos','Visitas','Vendas','Carteira'];
    const totals = etapas.map(e => App.leads.filter(l => l.etapa === e).length);
    const max = Math.max(...totals, 1);
    funilRel.innerHTML = etapas.map((e, i) => `
      <div class="funil-item">
        <div class="funil-label">${labels[i]}</div>
        <div class="funil-bar-wrap"><div class="funil-bar" style="width:${Math.round(totals[i]/max*100)}%;background:${cores[i]};"></div></div>
        <div class="funil-num">${totals[i]}</div>
        <div class="funil-pct">${i === 0 ? '100%' : Math.round(totals[i]/(totals[0]||1)*100)+'%'}</div>
      </div>`).join('');
  }
}

/* ============================================================
   CURRÍCULOS
   ============================================================ */
function renderCurriculos(filtro) {
  const grid = document.getElementById('curriculos-grid');
  if (!grid) return;

  const statusConfig = {
    em_analise: { bg: 'var(--amarelo-suave)', color: 'var(--amarelo)', label: '⏳ Em análise' },
    aprovado: { bg: 'var(--verde-suave)', color: 'var(--verde)', label: '✅ Aprovado' },
    reprovado: { bg: 'var(--vermelho-suave)', color: 'var(--vermelho)', label: '❌ Reprovado' },
    entrevista: { bg: 'var(--azul-suave)', color: 'var(--azul)', label: '📋 Entrevista Agendada' },
    em_espera: { bg: 'var(--cinza-100)', color: 'var(--cinza-500)', label: '⏸️ Em espera' },
  };

  const borderColors = { em_analise: 'var(--amarelo)', aprovado: 'var(--verde)', reprovado: 'var(--vermelho)', entrevista: 'var(--azul)', em_espera: 'var(--cinza-300)' };

  const filtered = filtro && filtro !== 'todos'
    ? App.curriculos.filter(c => c.status === filtro)
    : App.curriculos;

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">📄</div><div class="empty-state-title">Nenhum currículo encontrado</div><p class="empty-state-desc">Cadastre novos candidatos clicando em "Cadastrar Currículo"</p></div>';
    return;
  }

  grid.innerHTML = filtered.map(c => {
    const s = statusConfig[c.status] || statusConfig.em_analise;
    return `<div class="curriculo-card" style="border-top-color:${borderColors[c.status] || 'var(--cinza-300)'};">
      <div class="curriculo-nome">${escHtml(c.nome)}</div>
      <div class="curriculo-cargo">${escHtml(c.cargo)} • ${c.exp} ano(s) exp.</div>
      <div class="curriculo-contato">📧 ${escHtml(c.email)} • 📱 ${escHtml(c.tel)}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;gap:8px;">
        <span class="status-badge" style="background:${s.bg};color:${s.color};">${s.label}</span>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-xs btn-secondary" onclick="editarCurriculo(${c.id})">Editar</button>
          <button class="btn btn-xs btn-danger" onclick="deletarCurriculo(${c.id})">✕</button>
        </div>
      </div>
      ${c.obs ? `<div style="font-size:11px;color:var(--cinza-500);margin-top:8px;padding-top:8px;border-top:1px solid var(--cinza-200);">${escHtml(c.obs)}</div>` : ''}
    </div>`;
  }).join('');
}

function salvarCurriculo() {
  const nome = document.getElementById('curr-nome')?.value?.trim();
  const email = document.getElementById('curr-email')?.value?.trim();
  const tel = document.getElementById('curr-tel')?.value?.trim();
  const cargo = document.getElementById('curr-cargo')?.value?.trim();
  const exp = parseInt(document.getElementById('curr-exp')?.value) || 0;
  const status = document.getElementById('curr-status')?.value || 'em_analise';
  const obs = document.getElementById('curr-obs')?.value?.trim() || '';

  if (!nome) { showToast('⚠️ Nome é obrigatório', 'warning'); return; }

  const maxId = Math.max(0, ...App.curriculos.map(c => c.id));
  App.curriculos.push({ id: maxId + 1, nome, email, tel, cargo, exp, status, obs });
  renderCurriculos();
  closeModal('modal-curriculo');
  showToast('📄 Currículo cadastrado!', 'success');
  document.getElementById('form-curriculo')?.reset();
}

function editarCurriculo(id) {
  const c = App.curriculos.find(x => x.id === id);
  if (!c) return;
  // Populate form
  document.getElementById('curr-nome').value = c.nome;
  document.getElementById('curr-email').value = c.email;
  document.getElementById('curr-tel').value = c.tel;
  document.getElementById('curr-cargo').value = c.cargo;
  document.getElementById('curr-exp').value = c.exp;
  document.getElementById('curr-status').value = c.status;
  document.getElementById('curr-obs').value = c.obs;
  // Store editing id
  document.getElementById('form-curriculo').dataset.editId = id;
  openModal('modal-curriculo');
}

function deletarCurriculo(id) {
  showConfirm('🗑️', 'Remover Currículo', 'Deseja remover este currículo permanentemente?', () => {
    App.curriculos = App.curriculos.filter(c => c.id !== id);
    renderCurriculos();
    showToast('Currículo removido.', '');
  });
}

/* ============================================================
   USUÁRIOS
   ============================================================ */
function renderUsuarios() {
  const tbody = document.getElementById('usuarios-tbody');
  if (!tbody) return;

  const perfilConfig = {
    especialista: { cls: 'role-especialista', label: 'Especialista' },
    supervisor: { cls: 'role-supervisor', label: 'Supervisor' },
    gerente: { cls: 'role-gerente', label: 'Gerente' },
  };

  tbody.innerHTML = App.usuarios.map(u => {
    const p = perfilConfig[u.perfil] || perfilConfig.especialista;
    return `<tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:32px;height:32px;border-radius:50%;background:var(--verde-suave);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--verde);">${u.sigla}</div>
          <strong>${escHtml(u.nome)}</strong>
        </div>
      </td>
      <td>${u.sigla}</td>
      <td>${escHtml(u.filial)}</td>
      <td><span class="role-badge ${p.cls}">${p.label}</span></td>
      <td><span class="status-badge" style="background:var(--verde-suave);color:var(--verde);">● Ativo</span></td>
      <td><button class="btn btn-xs btn-secondary">Editar</button></td>
    </tr>`;
  }).join('');
}

function salvarUsuario() {
  const nome = document.getElementById('usr-nome')?.value?.trim();
  const sigla = document.getElementById('usr-sigla')?.value?.trim().toUpperCase();
  const filial = document.getElementById('usr-filial')?.value;
  const perfil = document.getElementById('usr-perfil')?.value;

  if (!nome || !sigla || !filial || !perfil) {
    showToast('⚠️ Preencha todos os campos obrigatórios', 'warning');
    return;
  }

  App.usuarios.push({ nome, sigla, filial, perfil, status: 'ativo' });
  renderUsuarios();
  closeModal('modal-usuario');
  showToast('👤 Usuário cadastrado!', 'success');
  document.getElementById('form-usuario')?.reset();
}

/* ============================================================
   NOTIFICATIONS
   ============================================================ */
function addNotification(msg) {
  App.notifications.unshift({ msg, read: false, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) });
  const badge = document.getElementById('notif-badge');
  if (badge) badge.style.display = 'block';
  showToast(msg, 'info');
}

/* ============================================================
   CONFIRM DIALOG
   ============================================================ */
function showConfirm(icon, title, msg, onConfirm) {
  document.getElementById('confirm-icon').textContent = icon;
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-msg').textContent = msg;
  App.confirmCallback = onConfirm;
  document.getElementById('confirm-overlay').classList.add('open');
}

function confirmYes() {
  document.getElementById('confirm-overlay').classList.remove('open');
  if (App.confirmCallback) { App.confirmCallback(); App.confirmCallback = null; }
}

function confirmNo() {
  document.getElementById('confirm-overlay').classList.remove('open');
  App.confirmCallback = null;
}

/* ============================================================
   TOAST
   ============================================================ */
function showToast(msg, type) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast' + (type ? ' ' + type : '');
  toast.innerHTML = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'opacity 0.3s, transform 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

/* ============================================================
   CHECKLIST
   ============================================================ */
function toggleCheck(el) {
  el.classList.toggle('done');
  el.querySelector('.check-box').textContent = el.classList.contains('done') ? '✓' : '';
}

/* ============================================================
   RESULTADO OPTIONS
   ============================================================ */
function selectRes(el) {
  const container = el.closest('.resultado-options');
  if (!container) return;
  container.querySelectorAll('.res-opt').forEach(r => r.classList.remove('selected'));
  el.classList.add('selected');
}

/* ============================================================
   VISITA BUTTONS
   ============================================================ */
function selectVisita(el, tipo) {
  const modal = el.closest('.modal');
  modal.querySelectorAll('.vres-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  modal.querySelectorAll('.resultado-detail').forEach(d => d.classList.remove('show'));
  const det = document.getElementById('detail-' + tipo);
  if (det) det.classList.add('show');
}

/* ============================================================
   FILTRO BUTTONS
   ============================================================ */
function initFiltroButtons() {
  document.querySelectorAll('.filtros').forEach(group => {
    group.addEventListener('click', e => {
      const btn = e.target.closest('.filtro-btn');
      if (!btn) return;
      group.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // Specific handlers
      const tipo = btn.dataset.filter;
      const target = group.dataset.target;
      if (target === 'historico') renderHistorico(tipo);
      if (target === 'curriculos') renderCurriculos(tipo);
    });
  });
}

/* ============================================================
   DATETIME HELPERS
   ============================================================ */
function initDatetimeFields() {
  const now = getNowLocal();
  document.querySelectorAll('input[type="datetime-local"]').forEach(i => {
    if (!i.value) i.value = now;
  });
  document.querySelectorAll('input[type="date"]').forEach(i => {
    if (!i.value) i.value = getTodayDate();
  });
}

function setNow(inputId) {
  const el = document.getElementById(inputId) || document.querySelector('input[type="datetime-local"]');
  if (el) el.value = getNowLocal();
}

function getNowLocal() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch { return dateStr; }
}

/* ============================================================
   COPY TO CLIPBOARD
   ============================================================ */
function copyTel(tel) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(tel.replace(/\D/g, '')).then(() => showToast('📋 Número copiado!', 'success'));
  } else {
    const el = document.createElement('textarea');
    el.value = tel.replace(/\D/g, '');
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast('📋 Número copiado!', 'success');
  }
}

/* ============================================================
   FONTE SELECT TOOLTIP
   ============================================================ */
function updateFonteTooltip(selectEl) {
  const val = selectEl.value;
  const fonte = FONTES_LEAD.find(f => f.value === val);
  const tip = selectEl.closest('.form-group')?.querySelector('.fonte-tooltip-text');
  if (tip && fonte) tip.textContent = fonte.desc;
}

/* ============================================================
   UTILITY
   ============================================================ */
function escHtml(str) {
  if (typeof str !== 'string') return str || '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Make available globally
window.navigate = navigate;
window.openModal = openModal;
window.closeModal = closeModal;
window.openLeadModal = openLeadModal;
window.novoLead = novoLead;
window.salvarNovoLead = salvarNovoLead;
window.registrarLigacao = registrarLigacao;
window.confirmarAgendamento = confirmarAgendamento;
window.confirmarVisita = confirmarVisita;
window.confirmarVenda = confirmarVenda;
window.criarLeadRecomendacao = criarLeadRecomendacao;
window.salvarCurriculo = salvarCurriculo;
window.editarCurriculo = editarCurriculo;
window.deletarCurriculo = deletarCurriculo;
window.salvarUsuario = salvarUsuario;
window.toggleCheck = toggleCheck;
window.selectRes = selectRes;
window.selectVisita = selectVisita;
window.setNow = setNow;
window.copyTel = copyTel;
window.updateFonteTooltip = updateFonteTooltip;
window.showToast = showToast;
window.showConfirm = showConfirm;
window.confirmYes = confirmYes;
window.confirmNo = confirmNo;
window.renderHistorico = renderHistorico;
window.renderCurriculos = renderCurriculos;
window.renderAtividades = renderAtividades;
window.updateRemarketingState = updateRemarketingState;
