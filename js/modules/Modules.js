/* ============================================================
   AMPARAR CRM — js/modules/Modules.js   v2.0
   Atividade, Histórico, Agenda, Relatórios, Currículos, Usuários
   Beyond Bits Tecnologia © 2026
   ============================================================ */
'use strict';

/* ============================================================  AtividadeModule */
class AtividadeModule {
  static adicionar(icon, nome, det, extra, bg, color, tipo) {
    store.adicionarAtividade(icon, nome, det, extra, bg, color, tipo);
    AtividadeModule.renderFeed();
    HistoricoModule.render();
  }
  static renderFeed() {
    const $c = $('#atividades-feed');
    if (!$c.length) return;
    const items = store.atividades.slice(0,8);
    if (!items.length) { $c.html('<div class="empty-msg">Nenhuma atividade.</div>'); return; }
    $c.html(items.map(a => {
      const partes = a.det.split('•');
      return `<div class="ativ-item">
        <div class="ativ-dot" style="background:${a.color};"></div>
        <div class="ativ-body flex-grow-1">
          <div class="ativ-nome">${Utils.escHtml(a.nome)} <span class="text-muted">— ${Utils.escHtml(partes[0].trim())}</span></div>
          <div class="ativ-desc text-muted">${Utils.escHtml(partes.slice(1).join('•').trim())}</div>
        </div>
        <div class="ativ-hora">${a.hora}</div>
      </div>`;
    }).join(''));
  }
}

/* ============================================================  HistoricoModule */
class HistoricoModule {
  static render(filtro) {
    const $list = $('#historico-list');
    if (!$list.length) return;
    const ligFmt = store.ligacoes.map(l => ({
      icon:'📞', bg:'#D1FAE5', color:'#059669',
      nome: l.lead, det:`Ligação • ${l.resultado} • Tentativa #${l.tentativa}`,
      hora: l.hora||'—', data: l.data||'—', esp: l.esp||'—', tipo:'ligacao',
    }));
    let items = [...store.atividades, ...ligFmt];
    if (filtro && filtro !== 'todas') items = items.filter(i => i.tipo === filtro);
    if (!items.length) {
      $list.html('<div class="empty-state"><div class="empty-icon">📋</div><p>Nenhum registro encontrado</p></div>'); return;
    }
    $list.html(items.slice(0,40).map(a => `
      <div class="hist-item">
        <div class="hist-icon" style="background:${a.bg};color:${a.color};">${a.icon}</div>
        <div class="hist-body flex-grow-1">
          <div class="hist-nome fw-semibold">${Utils.escHtml(a.nome)}</div>
          <div class="hist-det text-muted small">${Utils.escHtml(a.det)}</div>
        </div>
        <div class="hist-meta text-end small text-muted">
          <div class="fw-semibold">${a.hora}</div>
          <div>${a.data}</div>
          <div>${Utils.escHtml(a.esp)}</div>
        </div>
      </div>`).join(''));
  }
}

/* ============================================================  AgendaModule */
class AgendaModule {
  static renderDashboard() {
    const $c = $('#agenda-week-dash');
    if (!$c.length) return;
    const dias  = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
    const horas = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'];

    let html = `<div class="agenda-grid">
      <div class="ag-header-cell"></div>
      ${dias.map((d,i) => `<div class="ag-header-cell${i===2?' ag-today':''}">${d}</div>`).join('')}`;

    horas.forEach(h => {
      html += `<div class="ag-time">${h}</div>`;
      dias.forEach((d,di) => {
        const slots = (AGENDA_DATA[d]?.[h] || []);
        html += `<div class="ag-cell${di===2?' ag-today-col':''}">
          ${slots.map(s => `<span class="ag-slot" title="${s}">${s}</span>`).join('')}
        </div>`;
      });
    });
    html += '</div>';
    $c.html(html);
  }

  static renderFull() {
    const $tbody = $('#agenda-tbody');
    if (!$tbody.length) return;
    const base = [
      { data:'26/03 14:00', cliente:'Maria Costa',    tel:'(48) 99234-5566', tipo:'Nacional Particular', local:'🏢 Interno', esp:'Carlos Mendes', status:'aguardando' },
      { data:'27/03 10:00', cliente:'Sandra Oliveira', tel:'(48) 98877-4422', tipo:'Motocicleta',         local:'📍 Externo', esp:'Carlos Mendes', status:'confirmado' },
      { data:'27/03 15:30', cliente:'Felipe Torres',  tel:'(48) 99012-8877', tipo:'Caminhão',            local:'💻 Online',  esp:'Ana Beatriz',   status:'aguardando' },
      { data:'28/03 09:00', cliente:'Roberta Maia',   tel:'(48) 98654-3300', tipo:'Importado/Diesel',    local:'🏢 Interno', esp:'Carlos Mendes', status:'realizado'  },
    ];
    const fromStore = store.agendamentos.map(a => ({
      data: Utils.formatDate(a.data), cliente: a.lead?.nome||'—', tel: a.lead?.tel||'—',
      tipo: a.categoria||'—', local: a.local||'—', esp: a.lead?.captador||'Carlos Mendes', status:'aguardando',
    }));
    const all = [...base,...fromStore];
    const sBadge = { aguardando:{bg:'#FEF3C7',c:'#D97706',l:'⏳ Aguardando'}, confirmado:{bg:'#DBEAFE',c:'#2563EB',l:'📋 Confirmado'}, realizado:{bg:'#D1FAE5',c:'#059669',l:'✅ Realizado'} };
    $tbody.html(all.map(a => {
      const s = sBadge[a.status]||sBadge.aguardando;
      return `<tr>
        <td><span class="hora-badge">${a.data}</span></td>
        <td><strong>${Utils.escHtml(a.cliente)}</strong><br><small class="text-muted">${Utils.escHtml(a.tel)}</small></td>
        <td>${Utils.escHtml(a.tipo)}</td>
        <td>${a.local}</td>
        <td>${Utils.escHtml(a.esp)}</td>
        <td><span class="badge" style="background:${s.bg};color:${s.c};">${s.l}</span></td>
      </tr>`;
    }).join(''));
  }
}

/* ============================================================  RelatoriosModule */
class RelatoriosModule {
  static render() {
    RelatoriosModule.renderFunil();
    RelatoriosModule.renderAniversariantes();
  }
  static renderFunil() {
    const $c = $('#rel-funil');
    if (!$c.length) return;
    const labels = ['Leads','Ligações','Agendamentos','Visitas','Vendas','Carteira'];
    const cores  = ['#3B82F6','#10B981','#8B5CF6','#F59E0B','#1B6B3A','#4A5568'];
    const totais = STAGE_ORDER.map(e => store.leadsPorEtapa(e).length);
    const max    = Math.max(...totais, 1);
    const base   = totais[0] || 1;
    $c.html(STAGE_ORDER.map((e,i) => `
      <div class="rel-funil-row">
        <div class="rel-funil-lbl">${labels[i]}</div>
        <div class="rel-funil-track"><div class="rel-funil-fill" style="width:${Math.round(totais[i]/max*100)}%;background:${cores[i]};"></div></div>
        <div class="rel-funil-n fw-bold">${totais[i]}</div>
        <div class="rel-funil-pct small text-muted">${i===0?'100%':Math.round(totais[i]/base*100)+'%'}</div>
      </div>`).join(''));
  }
  static renderAniversariantes() {
    const $c = $('#rel-aniv');
    if (!$c.length) return;
    const anivs = store.leads.filter(l => l.etapa==='carteira' && l.aniversario);
    if (!anivs.length) { $c.html('<p class="text-muted small">Nenhum aniversariante no período.</p>'); return; }
    $c.html(anivs.map(l => {
      const d = l.aniversario ? new Date(l.aniversario).toLocaleDateString('pt-BR') : '—';
      return `<div class="aniv-item d-flex align-items-center gap-3 mb-2 p-2 rounded">
        <div class="avatar-circle">${l.nome.split(' ').map(x=>x[0]).join('').slice(0,2)}</div>
        <div class="flex-grow-1">
          <div class="fw-semibold">${Utils.escHtml(l.nome)}</div>
          <div class="small text-muted">🎂 ${d}</div>
        </div>
        <button class="btn btn-sm btn-outline-success" onclick="Utils.copyTel('${Utils.escHtml(l.tel)}');Toast.show('Número copiado!','success')">📞 Ligar</button>
      </div>`;
    }).join(''));
  }
}

/* ============================================================  CurriculoModule */
class CurriculoModule {
  static render(filtro) {
    const $g = $('#curriculos-grid');
    if (!$g.length) return;
    const lista = filtro && filtro!=='todos'
      ? store.curriculos.filter(c => c.status===filtro)
      : store.curriculos;
    if (!lista.length) {
      $g.html('<div class="empty-state col-span-full"><div class="empty-icon">📄</div><p>Nenhum currículo encontrado.<br>Cadastre candidatos clicando em "+ Cadastrar Currículo".</p></div>'); return;
    }
    $g.html(lista.map(c => {
      const s = CURRICULO_STATUS[c.status] || CURRICULO_STATUS.em_analise;
      return `<div class="curriculo-card" style="border-top-color:${s.color};">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div>
            <div class="fw-bold fs-6">${Utils.escHtml(c.nome)}</div>
            <div class="text-muted small">${Utils.escHtml(c.cargo)} · ${c.exp} ano(s)</div>
          </div>
          <span class="badge" style="background:${s.bg};color:${s.color};">${s.label}</span>
        </div>
        <div class="small text-muted mb-1">📧 ${Utils.escHtml(c.email)}</div>
        <div class="small text-muted mb-2">📱 ${Utils.escHtml(c.tel)}</div>
        ${c.nascimento?`<div class="small text-muted mb-1">🎂 ${Utils.formatDateShort(c.nascimento)} · ${Utils.calcIdade(c.nascimento)}</div>`:''}
        ${c.endereco?`<div class="small text-muted mb-1">📍 ${Utils.escHtml(c.endereco)}</div>`:''}
        <div class="small text-muted mb-2">
          ${c.sexo?`🧬 ${c.sexo==='M'?'Masculino':'Feminino'} ·`:''}
          ${c.cnh?'🚗 CNH' : ''}
          ${c.nota!==null&&c.nota!==undefined?`· ⭐ Nota: ${c.nota}/10`:''}
        </div>
        ${c.obs?`<div class="small text-muted border-top pt-2 mt-2">${Utils.escHtml(c.obs)}</div>`:''}
        <div class="d-flex gap-2 mt-3">
          <button class="btn btn-sm btn-outline-secondary flex-grow-1" onclick="CurriculoModule.editar(${c.id})"><i class="bi bi-pencil"></i> Editar</button>
          <button class="btn btn-sm btn-outline-danger" onclick="CurriculoModule.deletar(${c.id})"><i class="bi bi-trash"></i></button>
        </div>
      </div>`;
    }).join(''));
  }

  static abrirNovo() {
    $('#form-curriculo')[0].reset();
    $('#form-curriculo').removeData('editId');
    $('#modal-curriculo .amp-modal-title').text('Cadastrar Currículo');
    Modal.abrir('modal-curriculo');
  }

  static salvar() {
    const nome   = $('#curr-nome').val().trim();
    const email  = $('#curr-email').val().trim();
    const tel    = $('#curr-tel').val().trim();
    const cargo  = $('#curr-cargo').val().trim();
    const exp    = parseInt($('#curr-exp').val()) || 0;
    const status = $('#curr-status').val() || 'em_analise';
    const obs    = $('#curr-obs').val().trim();
    const nasc   = $('#curr-nasc').val();
    const end    = $('#curr-end').val().trim();
    const sexo   = $('#curr-sexo').val();
    const cnh    = $('#curr-cnh').is(':checked');
    const nota   = $('#curr-nota').val() ? parseInt($('#curr-nota').val()) : null;

    if (!nome) { Toast.show('Nome é obrigatório','warning'); return; }

    const dados = { nome, email, tel, cargo, exp, status, obs, nascimento: nasc, endereco: end, sexo, cnh, nota };
    const editId = parseInt($('#form-curriculo').data('editId'));
    if (editId) {
      store.atualizarCurriculo(editId, dados);
      Toast.show('Currículo atualizado!','success');
    } else {
      store.adicionarCurriculo(dados);
      Toast.show('Currículo cadastrado!','success');
    }
    CurriculoModule.render();
    Modal.fechar('modal-curriculo');
  }

  static editar(id) {
    const c = store.buscarCurriculo(id);
    if (!c) return;
    $('#curr-nome').val(c.nome); $('#curr-email').val(c.email); $('#curr-tel').val(c.tel);
    $('#curr-cargo').val(c.cargo); $('#curr-exp').val(c.exp); $('#curr-status').val(c.status);
    $('#curr-obs').val(c.obs); $('#curr-nasc').val(c.nascimento||'');
    $('#curr-end').val(c.endereco||''); $('#curr-sexo').val(c.sexo||'');
    $('#curr-cnh').prop('checked', c.cnh); $('#curr-nota').val(c.nota!==null?c.nota:'');
    $('#form-curriculo').data('editId', id);
    $('#modal-curriculo .amp-modal-title').text('Editar Currículo');
    Modal.abrir('modal-curriculo');
  }

  static deletar(id) {
    ConfirmDialog.show('🗑️','Remover Currículo','Deseja remover este currículo permanentemente?', () => {
      store.removerCurriculo(id);
      CurriculoModule.render();
      Toast.show('Currículo removido.','');
    });
  }
}

/* ============================================================  UsuarioModule */
class UsuarioModule {
  static render() {
    const $tb = $('#usuarios-tbody');
    if (!$tb.length) return;
    $tb.html(store.usuarios.map(u => {
      const p = PERFIL_CONFIG[u.perfil] || PERFIL_CONFIG.especialista;
      return `<tr>
        <td>
          <div class="d-flex align-items-center gap-2">
            <div class="avatar-circle">${u.sigla}</div>
            <div>
              <div class="fw-semibold">${Utils.escHtml(u.nome)}</div>
              <div class="small text-muted">${Utils.escHtml(u.email||'')}</div>
            </div>
          </div>
        </td>
        <td><code>${u.sigla}</code></td>
        <td>${Utils.escHtml(u.filial)}</td>
        <td><span class="badge ${p.cls}">${p.label}</span></td>
        <td>${u.meta_vendas?u.meta_vendas+' vendas / R$'+u.meta_mensalidade.toLocaleString('pt-BR',{minimumFractionDigits:2}):'—'}</td>
        <td><span class="badge text-bg-success">● Ativo</span></td>
        <td><button class="btn btn-sm btn-outline-secondary" onclick="UsuarioModule.editar('${u.sigla}')"><i class="bi bi-pencil"></i></button></td>
      </tr>`;
    }).join(''));
  }

  static abrirNovo() {
    $('#form-usuario')[0].reset();
    $('#form-usuario').removeData('editSigla');
    Modal.abrir('modal-usuario');
  }

  static salvar() {
    const nome    = $('#usr-nome').val().trim();
    const sigla   = $('#usr-sigla').val().trim().toUpperCase();
    const filial  = $('#usr-filial').val();
    const perfil  = $('#usr-perfil').val();
    const email   = $('#usr-email').val().trim();
    const metaV   = parseFloat($('#usr-meta-vendas').val()) || 0;
    const metaM   = parseFloat($('#usr-meta-mensal').val()) || 0;
    if (!nome||!sigla||!filial||!perfil) { Toast.show('Preencha todos os campos obrigatórios','warning'); return; }
    store.adicionarUsuario({ nome, sigla, filial, perfil, email, status:'ativo', meta_vendas: metaV, meta_mensalidade: metaM });
    UsuarioModule.render();
    Modal.fechar('modal-usuario');
    Toast.show('Usuário cadastrado!','success');
  }

  static editar(sigla) {
    const u = store.usuarios.find(x => x.sigla === sigla);
    if (!u) return;
    $('#usr-nome').val(u.nome); $('#usr-sigla').val(u.sigla); $('#usr-filial').val(u.filial);
    $('#usr-perfil').val(u.perfil); $('#usr-email').val(u.email||'');
    $('#usr-meta-vendas').val(u.meta_vendas||0); $('#usr-meta-mensal').val(u.meta_mensalidade||0);
    Modal.abrir('modal-usuario');
  }
}

/* ============================================================  AuditModule */
class AuditModule {
  static render() {
    const $tb = $('#audit-tbody');
    if (!$tb.length) return;
    $tb.html(store.auditLog.slice(0,30).map(a => `
      <tr>
        <td>${Utils.escHtml(a.usuario)}</td>
        <td>${Utils.escHtml(a.campo)}</td>
        <td class="text-muted">${Utils.escHtml(a.anterior)}</td>
        <td class="fw-semibold">${Utils.escHtml(a.novo)}</td>
        <td><code class="small">${a.datahora}</code></td>
      </tr>`).join(''));
  }
}
