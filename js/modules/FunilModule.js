/* ============================================================
   AMPARAR CRM — js/modules/FunilModule.js   v2.0
   Módulo do Processo de Vendas — Kanban 6 etapas + detalhe lead.
   Implementa RN-01 a RN-20 do DRS v1.2
   Beyond Bits Tecnologia © 2026
   ============================================================ */
'use strict';

class FunilModule {

  /* ---- KANBAN ---- */
  static renderKanban() {
    const $board = $('#kanban-board');
    if (!$board.length) return;
    $board.empty();
    STAGE_ORDER.forEach(key => {
      const cfg   = STAGE_CONFIG[key];
      const leads = store.leadsPorEtapa(key);
      $board.append(FunilModule._buildColuna(key, cfg, leads));
    });
    $('#badge-funil').text(store.leads.length);
  }

  static _buildColuna(key, cfg, leads) {
    const $col = $('<div>').addClass('k-col');
    $col.append($('<div>').addClass('k-col-header').css('background', cfg.color).html(`
      <span class="k-col-icon">${cfg.icon}</span>
      <span class="k-col-label">${cfg.label}</span>
      <span class="k-col-count badge bg-white text-dark">${leads.length}</span>
    `));
    const $cards = $('<div>').addClass('k-col-body');
    if (!leads.length) {
      $cards.html(`<div class="k-empty">Sem leads</div>`);
    } else {
      leads.forEach(l => $cards.append(new KanbanCard(l, cfg.color).render()));
    }
    $col.append($cards);
    if (cfg.addLabel) {
      $col.append($('<button>').addClass('k-add-btn').html(`<i class="bi bi-plus-lg"></i> ${cfg.addLabel}`)
        .css({background: cfg.color+'22', color: cfg.color, 'border-color': cfg.color+'55'})
        .on('click', () => key === 'lead' ? FunilModule.novoLead() : FunilModule.abrirDetalhePorEtapa(key)));
    }
    return $col;
  }

  /* ---- FUNIL PREVIEW (Dashboard) ---- */
  static renderFunilPreview() {
    const $c = $('#funil-preview');
    if (!$c.length) return;
    const cores = { lead:'#3B82F6', ligacao:'#10B981', agendamento:'#8B5CF6', visita:'#F59E0B', venda:'#1B6B3A', carteira:'#4A5568' };
    const labels = { lead:'Leads', ligacao:'Ligações', agendamento:'Agendamentos', visita:'Visitas', venda:'Vendas', carteira:'Carteira' };
    const totais = {};
    STAGE_ORDER.forEach(e => { totais[e] = store.leadsPorEtapa(e).length; });
    const max = Math.max(...Object.values(totais), 1);
    const base = totais['lead'] || 1;

    $c.html(STAGE_ORDER.map(e => {
      const n   = totais[e];
      const pct = Math.round((n/max)*100);
      const pctLabel = e==='lead'?'100%' : e==='carteira'?'—' : Math.round((n/base)*100)+'%';
      return `<div class="funil-row">
        <div class="funil-lbl">${labels[e]}</div>
        <div class="funil-track"><div class="funil-fill" style="width:${pct}%;background:${cores[e]};"></div></div>
        <div class="funil-val">${n}</div>
        <div class="funil-pct">${pctLabel}</div>
      </div>`;
    }).join(''));
  }

  /* ---- KPIs ---- */
  static atualizarKPIs() {
    const assoc = store.leadsPorEtapa('carteira').length;
    const lig   = store.ligacoes.length;
    $('#kpi-associados').text(312 + assoc);
    $('#kpi-ligacoes').text(38 + lig);
  }

  /* ---- NÚMERO MÁGICO (dados reais + filtro período) ---- */
  static renderNumeroMagico() {
    const totais = {};
    STAGE_ORDER.forEach(e => { totais[e] = store.leadsPorEtapa(e).length; });
    const metas = { lead:20, ligacao:12, agendamento:4, visita:2, venda:1, carteira:3 };
    const labels = { lead:'Leads', ligacao:'Contatos', agendamento:'Agendamentos', visita:'Visitas', venda:'Vendas', carteira:'Recomendações' };
    const convs  = { lead:'base', ligacao:'60%', agendamento:'33%', visita:'50%', venda:'50%', carteira:'3/venda' };

    STAGE_ORDER.forEach(e => {
      const real = totais[e];
      const meta = metas[e];
      const pct  = Math.round((real/meta)*100);
      const atingido = real >= meta;
      $(`#nm-real-${e}`).text(real);
      $(`#nm-meta-${e}`).text(meta);
      $(`#nm-pct-${e}`).text(pct+'%').toggleClass('text-success', atingido).toggleClass('text-danger', !atingido);
      const $bar = $(`#nm-bar-${e}`);
      $bar.css('width', Math.min(pct,100)+'%').toggleClass('bg-success', atingido).toggleClass('bg-warning', !atingido && pct>=50).toggleClass('bg-danger', pct<50);
      $(`#nm-card-${e}`).toggleClass('nm-achieved', atingido);
    });
  }

  /* ---- NOVO LEAD ---- */
  static novoLead() {
    const id = store.proximoLeadId();
    $('#nl-id').val(id);
    $('#nl-data').val(Utils.getTodayDate());
    $('#nl-nome, #nl-tel, #nl-quem, #nl-placa, #nl-fipe, #nl-obs, #nl-mensest').val('');
    $('#nl-fonte').val('');
    $('#form-novo-lead').removeData('editId');
    Modal.abrir('modal-novo-lead');
    setTimeout(() => $('#nl-nome').focus(), 300);
  }

  static salvarNovoLead() {
    const nome     = $('#nl-nome').val().trim();
    const tel      = $('#nl-tel').val().trim();
    const fonte    = $('#nl-fonte').val();
    const captador = $('#nl-captador').val().trim();
    if (!nome)    { Toast.show('Nome é obrigatório','warning'); return; }
    if (!tel)     { Toast.show('Telefone é obrigatório','warning'); return; }
    if (!fonte)   { Toast.show('Fonte do lead é obrigatória','warning'); return; }

    const lead = {
      id: $('#nl-id').val(), nome, tel, fonte, captador,
      tags:[], etapa:'lead', tentativas:0,
      obs:      $('#nl-obs').val().trim(),
      placa:    $('#nl-placa').val().trim(),
      fipe:     $('#nl-fipe').val().trim(),
      mensalidadeEst: $('#nl-mensest').val().trim(),
      quemIndicou:    $('#nl-quem').val().trim(),
    };
    store.adicionarLead(lead);
    FunilModule.renderKanban();
    FunilModule.renderFunilPreview();
    FunilModule.renderNumeroMagico();
    AtividadeModule.adicionar('🌱', lead.nome,'Lead cadastrado',lead.fonte,'#D1FAE5','#059669','lead');
    Modal.fechar('modal-novo-lead');
    Toast.show('Lead cadastrado com sucesso!','success');
  }

  /* ---- DETALHE DO LEAD ---- */
  static abrirDetalhe(id) {
    const lead = store.buscarLead(id);
    if (!lead) return;
    store.currentLead = lead;
    FunilModule._popularModal(lead);
    Modal.abrir('modal-lead');
  }
  static abrirDetalhePorEtapa(etapa) {
    const ls = store.leadsPorEtapa(etapa);
    if (ls.length) FunilModule.abrirDetalhe(ls[0].id);
    else Toast.show('Nenhum lead nesta etapa','info');
  }

  static _popularModal(lead) {
    const idx = STAGE_ORDER.indexOf(lead.etapa);
    const cfg = STAGE_CONFIG[lead.etapa];
    const $m  = $('#modal-lead');

    /* Header */
    $m.find('#mld-nome').text(lead.nome);
    $m.find('#mld-id').text(lead.id);
    $m.find('#mld-stage').text(cfg.icon+' '+cfg.label).css({background:cfg.color+'22',color:cfg.color});

    /* Abas progressivas — RN-11 */
    STAGE_ORDER.forEach((s,i) => {
      const $tab = $m.find(`[data-tab="${s}"]`);
      if (i <= idx) $tab.removeClass('disabled').removeAttr('disabled');
      else $tab.addClass('disabled').attr('disabled','disabled');
    });
    /* Ativa aba atual */
    $m.find('.lead-tab').removeClass('active');
    $m.find('.lead-tab-pane').removeClass('active');
    $m.find(`[data-tab="${lead.etapa}"]`).addClass('active');
    $('#tab-'+lead.etapa).addClass('active');

    /* Preenche campos */
    FunilModule._preencherAbaLead(lead);
    FunilModule._preencherAbaLigacao(lead);
    FunilModule._preencherAbaAgendamento(lead);
    FunilModule._preencherAbaVisita(lead);
    FunilModule._preencherAbaVenda(lead);
    FunilModule._preencherAbaCarteira(lead);
    FunilModule._atualizarBotoesModal(lead);
    FunilModule._atualizarRemarketing(lead.tentativas);
  }

  static _preencherAbaLead(l) {
    $('#mld-lead-nome').text(l.nome);
    $('#mld-lead-tel').text(l.tel);
    $('#mld-lead-id-show').text(l.id);
    $('#mld-fonte').val(l.fonte||'');
    $('#mld-captador').val(l.captador||'');
    $('#mld-placa').val(l.placa||'');
    $('#mld-fipe').val(l.fipe||'');
    $('#mld-mensest').val(l.mensalidadeEst||'');
    $('#mld-obs').val(l.obs||'');
    $('#mld-copy-tel').off('click').on('click', () => { Utils.copyTel(l.tel); Toast.show('Número copiado!','success'); });

    // AJUSTE 7: renderizar tags atuais e disponíveis
    const $atuais = $('#mld-tags-atuais');
    $atuais.html((l.tags || []).map(t => {
      const c = TAG_CONFIG[t] || { cls: '', label: t };
      return `<span class="amp-tag ${c.cls}" style="cursor:pointer;"
        onclick="FunilModule.removerTag('${Utils.escHtml(l.id)}','${t}')" title="Clique para remover">
        ${c.label} <i class='bi bi-x-circle-fill' style='font-size:10px;opacity:.7;'></i></span>`;
    }).join(''));

    const $disp = $('#mld-tags-disponiveis');
    $disp.html(store.tags.filter(t => !(l.tags||[]).includes(t)).map(t => {
      const c = TAG_CONFIG[t] || { cls: '', label: t };
      return `<span class="amp-tag ${c.cls}" style="cursor:pointer;opacity:0.55;"
        onclick="FunilModule.adicionarTag('${Utils.escHtml(l.id)}','${t}')" title="Clique para adicionar">
        <i class='bi bi-plus-lg' style='font-size:10px;'></i> ${c.label}</span>`;
    }).join(''));
  }

  static _preencherAbaLigacao(l) {
    $('#mld-lig-nome').text(l.nome);
    $('#mld-lig-tel').text(l.tel);
    $('#mld-lig-id').text(l.id);
    // AJUSTE 1: bind do botão copiar na aba ligação
    $('#mld-copy-lig-tel').off('click').on('click', () => {
      Utils.copyTel(l.tel);
      Toast.show('Número copiado!', 'success');
    });
    FunilModule._atualizarContadorTentativas(l.tentativas);
    $('#tab-ligacao .res-opt').removeClass('selected');
    $('#mld-lig-obs').val(l.obs||'');
    $('#lig-datetime').val(Utils.getNowLocal());
  }

  static _preencherAbaAgendamento(l) {
    $('#mld-agen-nome').text(l.nome);
    $('#mld-agen-tel').text('📱 '+l.tel);
    $('#agen-data-feito').val(Utils.getTodayDate());
    $('#agen-data-visita').val('');
    $('#mld-agen-obs').val(l.obs||'');
    $('#agen-cat').val('Nacional Particular');
    $('#agen-local').val('🏢 Interno');
    $('#tab-agendamento .check-item').removeClass('done');
    $('#tab-agendamento .check-icon').html('');
  }

  static _preencherAbaVisita(l) {
    $('#mld-vis-nome').text(l.nome);
    $('#mld-vis-tel').text('📱 '+l.tel);
    $('#tab-visita .vres-btn').removeClass('selected');
    $('#tab-visita .resultado-detail').removeClass('active');
    $('#mld-vis-obs').val(l.obs||'');
    $('#vis-delay-dt, #vis-nao-dt').val(Utils.getNowLocal());
    $('#c2-data').val(Utils.getTodayDate());
  }

  static _preencherAbaVenda(l) {
    $('#mld-venda-nome').text(l.nome);
    $('#mld-venda-tel').text('📱 '+l.tel);
    $('#mld-venda-placa').text(l.placa||'—');
    $('#mld-venda-fonte').text(l.fonte||'—');
    $('#venda-data').val(Utils.getTodayDate());
    $('#venda-aniversario').val(l.aniversario||'');
    $('#venda-adesao, #venda-mensalidade, #venda-rastreador').val('');
    /* Limpar cards de recomendação */
    $('.rec-form').find('input').val('');
    $('#rec-card-2, #rec-card-3').hide();
    $('#btn-add-rec').show();
    window._recCount = 1;
    /* Marcar pós-venda */
    $('#tab-venda .check-item').removeClass('done');
    $('#tab-venda .check-icon').html('');
  }

  static _preencherAbaCarteira(l) {
    $('#mld-cart-nome').text(l.nome);
    $('#mld-cart-tel').text('📱 '+l.tel);
    $('#mld-cart-ultima').text(l.ultimaLigacao || '—');
    $('#cart-datetime').val(Utils.getNowLocal());
    $('#tab-carteira .res-opt').removeClass('selected');
    $('#rec-cart').find('input').val('');
  }

  static _atualizarBotoesModal(lead) {
    const idx = STAGE_ORDER.indexOf(lead.etapa);
    const $btnAvan  = $('#mld-btn-avancar');
    const $btnLig   = $('#mld-btn-lig');

    if (lead.etapa === 'ligacao') {
      $btnLig.show(); $btnAvan.hide();
    } else if (lead.etapa === 'carteira') {
      $btnLig.hide(); $btnAvan.text('Registrar ✓').show();
    } else {
      $btnLig.hide();
      const prox = STAGE_CONFIG[STAGE_ORDER[idx+1]];
      $btnAvan.text(prox ? 'Avançar: '+prox.icon+' '+prox.label+' →' : 'Salvar ✓').show();
    }
  }

  static _atualizarContadorTentativas(t) {
    const $b = $('#mld-tent-badge');
    $b.text(t+' tentativas').toggleClass('tent-warn', t>=25);
  }

  static _atualizarRemarketing(t) {
    const $rem = $('#tab-ligacao .res-opt[data-tipo="remarketing"]');
    const $warn = $('#remarketing-warn');
    if (t >= 30) { $rem.removeClass('disabled-opt'); $warn.hide(); }
    else { $rem.addClass('disabled-opt'); $warn.show().find('span').text(30-t+' tentativas restantes para Remarketing'); }
  }

  /* ---- LIGAÇÃO ---- */
  static registrarLigacao() {
    const lead = store.currentLead;
    if (!lead) return;
    const resultado = $('#tab-ligacao .res-opt.selected').text().trim();
    if (!resultado) { Toast.show('Selecione um resultado','warning'); return; }

    ConfirmDialog.show('📞','Confirmar Ligação',
      `Registrar ligação para ${lead.nome}?\nResultado: ${resultado}`, () => {
      lead.tentativas++;
      lead.obs = $('#mld-obs').val() || lead.obs;
      store.adicionarLigacao(lead, resultado);
      AtividadeModule.adicionar('📞', lead.nome, `Tentativa #${lead.tentativas}`, resultado, '#D1FAE5','#059669','ligacao');
      FunilModule.renderKanban();
      FunilModule.atualizarKPIs();
      FunilModule._atualizarContadorTentativas(lead.tentativas);
      FunilModule._atualizarRemarketing(lead.tentativas);
      HistoricoModule.render();

      if (resultado.includes('Agendamento')) {
        setTimeout(() => FunilModule._popupConcluirLigacao(lead,'agendamento'), 400);
      } else if (resultado.includes('Remarketing') && lead.tentativas >= 30) {
        setTimeout(() => FunilModule._popupConcluirLigacao(lead,'remarketing'), 400);
      } else {
        Toast.show(`Ligação registrada! Tentativa #${lead.tentativas}`,'success');
      }
    });
  }

  static _popupConcluirLigacao(lead, tipo) {
    $('#mcl-nome').text(lead.nome);
    $('#mcl-tent').text(lead.tentativas);
    const bloq = lead.tentativas < 30;
    $('#mcl-btn-remarketing').prop('disabled', bloq);
    $('#mcl-remarketing-warn').toggle(bloq);
    $('#mcl-btn-agendamento').off('click').on('click', () => {
      store.avancarEtapa(lead,'agendamento');
      Modal.fechar('modal-concluir-lig');
      Modal.fechar('modal-lead');
      Toast.show('Prosseguindo para Agendamento...','success');
      FunilModule.renderKanban();
      setTimeout(() => FunilModule.abrirDetalhe(lead.id), 250);
    });
    $('#mcl-btn-remarketing').off('click').on('click', () => {
      Modal.fechar('modal-concluir-lig');
      Toast.show('Lead enviado para Remarketing','info');
    });
    Modal.abrir('modal-concluir-lig');
  }

  static concluirLigacao() {
    const lead = store.currentLead;
    if (!lead) return;
    FunilModule._popupConcluirLigacao(lead, 'menu');
  }

  /* ---- AGENDAMENTO ---- */
  static confirmarAgendamento() {
    const lead = store.currentLead;
    if (!lead) return;
    const data     = $('#agen-data-visita').val();
    const cat      = $('#agen-cat').val();
    const local    = $('#agen-local').val();
    if (!data) { Toast.show('Data/hora da visita obrigatória','warning'); return; }

    store.adicionarAgendamento({ lead, data, categoria: cat, local });
    store.avancarEtapa(lead,'agendamento');
    store.adicionarNotificacao(`📅 Novo agendamento: ${lead.nome} — ${Utils.formatDate(data)}`);
    FunilModule.renderKanban();
    FunilModule.renderFunilPreview();
    FunilModule.renderNumeroMagico();
    AgendaModule.renderFull();
    AtividadeModule.adicionar('📅', lead.nome,'Agendamento confirmado',Utils.formatDate(data),'#DBEAFE','#2563EB','agendamento');
    NotifController.atualizar();
    Toast.show('Agendamento confirmado! Gestor notificado.','success');
    Modal.fechar('modal-lead');
  }

  /* ---- VISITA ---- */
  static confirmarVisita() {
    const lead = store.currentLead;
    if (!lead) return;
    const $sel = $('#tab-visita .vres-btn.selected');
    if (!$sel.length) { Toast.show('Selecione o resultado da visita','warning'); return; }
    const tipo = $sel.data('tipo');
    lead.obs = $('#mld-vis-obs').val() || lead.obs;

    if (tipo === 'venda') {
      store.avancarEtapa(lead,'venda');
      FunilModule.renderKanban();
      AtividadeModule.adicionar('💰',lead.nome,'Visita — Venda realizada!','','#D1FAE5','#059669','venda');
      Toast.show('🎉 Venda realizada! Avançando...','success');
      Modal.fechar('modal-lead');
      setTimeout(() => FunilModule.abrirDetalhe(lead.id), 250);
    } else if (tipo === 'c2') {
      const c2data = $('#c2-data').val();
      const c2hora = $('#c2-hora').val();
      if (!c2data||!c2hora) { Toast.show('Preencha data e hora do C2','warning'); return; }
      store.adicionarAgendamento({ lead, data: c2data+'T'+c2hora, categoria:'C2', local: $('#c2-local').val() });
      store.adicionarNotificacao(`📅 C2 agendado: ${lead.nome}`);
      NotifController.atualizar();
      AtividadeModule.adicionar('📅',lead.nome,'Visita — C2 agendado','','#DBEAFE','#2563EB','agendamento');
      Toast.show('C2 registrado. Gestor notificado.','success');
      Modal.fechar('modal-lead');
    } else {
      const det = tipo==='delay'?'Delay':'Não fechou';
      AtividadeModule.adicionar('🏠',lead.nome,`Visita — ${det}`,'','#FEF3C7','#D97706','visita');
      Toast.show('Resultado registrado.','success');
      Modal.fechar('modal-lead');
    }
    FunilModule.renderKanban();
    FunilModule.renderNumeroMagico();
  }

  /* ---- VENDA ---- */
  static confirmarVenda() {
    const lead = store.currentLead;
    if (!lead) return;
    const adesao  = $('#venda-adesao').val();
    const mensal  = $('#venda-mensalidade').val();
    const rastr   = $('#venda-rastreador').val();
    const aniv    = $('#venda-aniversario').val();
    if (!adesao) { Toast.show('Valor de adesão obrigatório','warning'); return; }

    lead.adesao     = adesao;
    lead.mensalidade= mensal;
    lead.rastreador = rastr;
    lead.aniversario= aniv;
    lead.dataVenda  = Utils.getTodayDate();
    store.avancarEtapa(lead,'carteira');
    FunilModule.renderKanban();
    FunilModule.atualizarKPIs();
    FunilModule.renderFunilPreview();
    FunilModule.renderNumeroMagico();
    AtividadeModule.adicionar('💰',lead.nome,`Venda concluída — ${mensal}/mês`,`Adesão: ${adesao}`,'#D1FAE5','#059669','venda');
    Toast.show('🎉 Venda registrada! Associado na carteira.','success');
    Modal.fechar('modal-lead');
  }

  /* ---- RECOMENDAÇÃO → LEAD (RN-06) ---- */
  static criarLeadRec(containerId) {
    const $c    = $('#'+containerId);
    const nome  = $c.find('.rec-nome').val()?.trim();
    const tel   = $c.find('.rec-tel').val()?.trim();
    const grau  = $c.find('.rec-grau').val()?.trim();
    if (!nome||!tel) { Toast.show('Nome e telefone são obrigatórios','warning'); return; }
    if (!grau)       { Toast.show('Grau de proximidade é obrigatório','warning'); return; }

    const newLead = {
      id: store.proximoLeadId(), nome, tel,
      fonte: 'Recomendação Associado',
      captador: 'Carlos Mendes',
      tags: ['novo'], etapa:'lead', tentativas:0,
      obs: `Recomendado por ${store.currentLead?.nome||'associado'} — ${grau}`,
      placa:'', fipe:'', mensalidadeEst:'',
    };
    store.adicionarLead(newLead);
    FunilModule.renderKanban();
    FunilModule.renderFunilPreview();
    AtividadeModule.adicionar('🌱',nome,'Lead criado via recomendação','','#DBEAFE','#2563EB','lead');
    Toast.show('Lead criado automaticamente no funil!','success');
    $c.find('input, textarea').val(''); /* RN-06: limpa formulário */
  }

  /* ---- TAGS (AJUSTE 7) ---- */
  static adicionarTag(leadId, tag) {
    const lead = store.buscarLead(leadId);
    if (!lead || (lead.tags||[]).includes(tag)) return;
    lead.tags = [...(lead.tags||[]), tag];
    store._logAudit('Carlos Mendes', `Tag (${leadId})`, '—', TAG_CONFIG[tag]?.label || tag);
    FunilModule._preencherAbaLead(lead);
    FunilModule.renderKanban();
    Toast.show('Tag adicionada!', 'success');
  }

  static removerTag(leadId, tag) {
    const lead = store.buscarLead(leadId);
    if (!lead) return;
    lead.tags = (lead.tags||[]).filter(t => t !== tag);
    store._logAudit('Carlos Mendes', `Tag (${leadId})`, TAG_CONFIG[tag]?.label || tag, '—');
    FunilModule._preencherAbaLead(lead);
    FunilModule.renderKanban();
    Toast.show('Tag removida.', '');
  }

  /* ---- IMPORTAÇÃO DE LEADS VIA CSV (AJUSTE 4) ---- */
  static processarImportacao() {
    const file = document.getElementById('import-file')?.files?.[0];
    if (!file) { Toast.show('Selecione um arquivo CSV', 'warning'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const linhas = e.target.result.split(/\r?\n/).filter(l => l.trim()).slice(1); // pula header
      let importados = 0, ignorados = 0;
      linhas.forEach(linha => {
        const cols = linha.split(',');
        const nome  = cols[0]?.trim();
        const tel   = cols[1]?.trim();
        const fonte = cols[2]?.trim() || 'Carteira Amparar';
        if (nome && tel) {
          store.adicionarLead({
            id: store.proximoLeadId(), nome, tel, fonte,
            captador: 'Carlos Mendes', tags: [], etapa: 'lead',
            tentativas: 0, obs: '', placa: '', fipe: '', mensalidadeEst: ''
          });
          importados++;
        } else { ignorados++; }
      });
      FunilModule.renderKanban();
      FunilModule.renderFunilPreview();
      FunilModule.renderNumeroMagico();
      document.getElementById('import-file').value = '';
      $('#import-preview').html('');
      Toast.show(`${importados} leads importados${ignorados ? ` (${ignorados} ignorados)` : ''}!`, 'success');
      Modal.fechar('modal-importar-leads');
    };
    reader.onerror = () => Toast.show('Erro ao ler o arquivo', 'danger');
    reader.readAsText(file, 'UTF-8');
  }

  /* ---- FILTRO POR FILIAL (AJUSTE 6) ---- */
  static filtrarPorFilial(filialId) {
    // AJUSTE 6: filtra kanban pela filial selecionada
    const $board = $('#kanban-board');
    if (!filialId) {
      $board.find('.k-card').show();
      return;
    }
    const filial = store.filiais.find(f => f.id === filialId);
    if (!filial) return;
    $board.find('.k-card').each(function() {
      const captador = $(this).find('.k-captador').text().trim();
      const matchUser = store.usuarios.find(u => u.nome === captador && (u.filial === filial.nome || u.filial === 'Todas'));
      $(this).toggle(!!matchUser);
    });
  }

  /* ---- RESULTADO LIGAÇÃO ---- */
  static selecionarRes(el) {
    const $opt = $(el);
    if ($opt.hasClass('disabled-opt')) {
      Toast.show('Remarketing disponível após 30 tentativas','warning'); return;
    }
    // AJUSTE 2: desseleciona TODOS os res-opt da aba atual (não só do mesmo grupo)
    const $pane = $opt.closest('.lead-tab-pane');
    $pane.find('.res-opt').removeClass('selected');
    $opt.addClass('selected');

    // AJUSTE 8: atualizar texto do botão de ligação conforme resultado
    const texto = $opt.text().trim();
    const isAvanco = texto.includes('Agendamento') || texto.includes('Remarketing');
    $('#mld-btn-lig').text(isAvanco ? '→ Registrar e Avançar' : '✓ Registrar Resultado');
  }

  /* ---- RESULTADO VISITA ---- */
  static selecionarVisita(el, tipo) {
    $('#tab-visita .vres-btn').removeClass('selected');
    $(el).addClass('selected');
    $('#tab-visita .resultado-detail').removeClass('active');
    $('#vis-detail-'+tipo).addClass('active');

    // AJUSTE 8: atualizar texto do botão principal conforme resultado da visita
    const $btnAvan = $('#mld-btn-avancar');
    if (tipo === 'venda') {
      $btnAvan.text('Avançar: 💰 Venda →');
    } else {
      $btnAvan.text('✓ Registrar Resultado');
    }
  }
}
