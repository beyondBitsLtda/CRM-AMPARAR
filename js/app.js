/* ============================================================
   AMPARAR CRM — js/app.js   v2.0
   Ponto de entrada. Inicializa tudo.
   Beyond Bits Tecnologia © 2026
   ============================================================ */
'use strict';

$(document).ready(function() {
  store.inicializar();
  Modal.inicializarBackdrops();
  DateTimeHelper.inicializar();
  SearchController.init();

  /* Render inicial */
  FunilModule.renderKanban();
  FunilModule.renderFunilPreview();
  FunilModule.renderNumeroMagico();
  FunilModule.atualizarKPIs();
  AgendaModule.renderDashboard();
  AgendaModule.renderFull();
  AtividadeModule.renderFeed();
  HistoricoModule.render();
  RelatoriosModule.render();
  CurriculoModule.render();
  UsuarioModule.render();
  AuditModule.render();

  /* Sidebar toggle */
  $('#sidebar-toggle').on('click', () => SidebarController.alternar());
  $('#sidebar-backdrop').on('click', () => SidebarController.fecharMobile());

  /* Notificações */
  $('#notif-btn').on('click', function(e) { e.stopPropagation(); NotifController.toggleDropdown(); });

  /* Filtros (histórico + currículos) */
  $(document).on('click', '.filtros .filtro-btn', function() {
    const $g = $(this).closest('.filtros');
    $g.find('.filtro-btn').removeClass('active');
    $(this).addClass('active');
    const tipo = $(this).data('filter');
    const tgt  = $g.data('target');
    if (tgt==='historico')  HistoricoModule.render(tipo);
    if (tgt==='curriculos') CurriculoModule.render(tipo);
  });

  /* Seleção de resultado de ligação */
  $(document).on('click', '.res-opt', function() { FunilModule.selecionarRes(this); });
  /* Seleção de resultado de visita */
  $(document).on('click', '.vres-btn', function() {
    FunilModule.selecionarVisita(this, $(this).data('tipo'));
  });

  /* Tabs do modal de lead */
  $(document).on('click', '.lead-tab:not(.disabled)', function() {
    Modal.trocarAba($(this).data('tab'), this);
  });

  /* Check items */
  $(document).on('click', '.check-item', function() { ChecklistItem.alternar(this); });

  /* Fonte tooltip */
  $(document).on('change', '.fonte-select', function() { FonteSelect.atualizar(this); });

  /* Botão "Agora" para datetime */
  $(document).on('click', '.btn-agora', function() {
    const targetId = $(this).data('target');
    DateTimeHelper.setNow(targetId);
  });

  Router.inicializar();
});

/* ── Funções globais (onclick inline HTML) ── */
window.navigate          = p  => Router.ir(p);
window.openModal         = id => Modal.abrir(id);
window.closeModal        = id => Modal.fechar(id);
window.confirmYes        = () => ConfirmDialog.confirmar();
window.confirmNo         = () => ConfirmDialog.cancelar();

/* Lead/Funil */
window.novoLead          = () => FunilModule.novoLead();
window.salvarNovoLead    = () => FunilModule.salvarNovoLead();
window.registrarLigacao  = () => FunilModule.registrarLigacao();
window.concluirLigacao   = () => FunilModule.concluirLigacao();
window.confirmarAgendamento = () => FunilModule.confirmarAgendamento();
window.confirmarVisita   = () => FunilModule.confirmarVisita();
window.confirmarVenda    = () => FunilModule.confirmarVenda();
window.criarLeadRec      = id => FunilModule.criarLeadRec(id);
window.avancarLeadAtual  = () => {
  const lead = store.currentLead;
  if (!lead) return;
  const idx = STAGE_ORDER.indexOf(lead.etapa);
  if (lead.etapa==='agendamento') FunilModule.confirmarAgendamento();
  else if (lead.etapa==='visita') FunilModule.confirmarVisita();
  else if (lead.etapa==='venda')  FunilModule.confirmarVenda();
  else if (lead.etapa==='carteira') { Toast.show('Interação registrada!','success'); Modal.fechar('modal-lead'); }
  else {
    const prox = STAGE_ORDER[idx+1];
    if (prox) {
      store.avancarEtapa(lead,prox);
      FunilModule.renderKanban();
      Modal.fechar('modal-lead');
      Toast.show(`Lead avançou para ${STAGE_CONFIG[prox].label}!`,'success');
      setTimeout(() => FunilModule.abrirDetalhe(lead.id), 200);
    }
  }
};

/* Currículos */
window.abrirNovoCurriculo = () => CurriculoModule.abrirNovo();
window.salvarCurriculo    = () => CurriculoModule.salvar();
window.editarCurriculo    = id => CurriculoModule.editar(id);
window.deletarCurriculo   = id => CurriculoModule.deletar(id);

/* Usuários */
window.abrirNovoUsuario   = () => UsuarioModule.abrirNovo();
window.salvarUsuario      = () => UsuarioModule.salvar();

/* UI helpers */
window.showToast          = (m,t)  => Toast.show(m,t);
window.showConfirm        = (i,tt,m,cb) => ConfirmDialog.show(i,tt,m,cb);
window.copyTel            = tel => { Utils.copyTel(tel); Toast.show('Número copiado!','success'); };
window.addRecCard         = () => {
  window._recCount = window._recCount || 1;
  if (window._recCount >= 3) { Toast.show('Máximo de 3 recomendações','warning'); return; }
  window._recCount++;
  $('#rec-card-'+window._recCount).show();
  if (window._recCount===3) $('#btn-add-rec').hide();
};
