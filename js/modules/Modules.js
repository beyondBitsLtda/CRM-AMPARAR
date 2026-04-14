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

  /* ---- CONFIG ---- */
  static _offset    = 0;   // semanas relativas a hoje
  static _view      = 'semana';
  static _HORAS_INI = 7;   // 07:00
  static _HORAS_FIM = 21;  // 21:00 (exclusive)
  static _PX_HORA   = 48;  // altura de cada hora em px

  /* Paleta de cores por índice de especialista */
  static _COR_ESP   = ['gcal-ev-0','gcal-ev-1','gcal-ev-2','gcal-ev-3','gcal-ev-4'];

  /* Mapeamento sigla → nome completo / cor */
  static _ESP_MAP = {
    VR: { nome:'Rodrigo Lopes',  cor: 0 },
    LM: { nome:'Lucas Melo',     cor: 1 },
    NB: { nome:'Nathalia B.',    cor: 2 },
    KP: { nome:'Karina P.',      cor: 3 },
    IE: { nome:'Igor E.',        cor: 4 },
    DE: { nome:'Daniela E.',     cor: 1 },
    MM: { nome:'Marcos M.',      cor: 2 },
    SA: { nome:'Sandra A.',      cor: 3 },
  };

  /* ---- ALGORITMO DE LAYOUT DE COLISÃO ---- */
  static _calcLayout(evts) {
    /* 
      Percorre os eventos ordenados por startMin.
      Mantém uma lista de "colunas ativas" — cada coluna guarda
      o endMin do último evento alocado nela.
      Ao alocar um evento, usa a primeira coluna livre (endMin <= startMin).
      Ao final de cada cluster, define totalCols = n° de colunas usadas.
    */
    if (!evts.length) return;

    const cols = []; // cols[i] = endMin do último evento na coluna i

    // 1ª passagem: alocar coluna a cada evento
    evts.forEach(ev => {
      let placed = false;
      for (let c = 0; c < cols.length; c++) {
        if (cols[c] <= ev.startMin) {
          ev._col = c;
          cols[c] = ev.endMin;
          placed = true;
          break;
        }
      }
      if (!placed) {
        ev._col = cols.length;
        cols.push(ev.endMin);
      }
    });

    // 2ª passagem: calcular totalCols por cluster (grupo de sobreposição)
    // Um cluster termina quando nenhum evento em andamento se sobrepõe ao próximo
    let clusterStart = 0;
    let maxEnd = evts[0].endMin;

    for (let i = 1; i <= evts.length; i++) {
      const novoCluster = i === evts.length || evts[i].startMin >= maxEnd;
      if (novoCluster) {
        // Descobrir quantas colunas foram usadas neste cluster
        const totalCols = Math.max(...evts.slice(clusterStart, i).map(e => e._col)) + 1;
        for (let j = clusterStart; j < i; j++) {
          evts[j]._totalCols = totalCols;
        }
        clusterStart = i;
        if (i < evts.length) maxEnd = evts[i].endMin;
      } else {
        if (evts[i].endMin > maxEnd) maxEnd = evts[i].endMin;
      }
    }
  }

  /* Eventos estáticos da grade (AGENDA_DATA → eventos reais) */
  static _getEventosEstaticos() {
    const eventos = [];
    const dias = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
    dias.forEach((dia, di) => {
      const dados = AGENDA_DATA[dia] || {};
      Object.entries(dados).forEach(([hora, siglas]) => {
        const [hh] = hora.split(':').map(Number);
        siglas.forEach(sigla => {
          const esp = AgendaModule._ESP_MAP[sigla] || { nome: sigla, cor: 0 };
          eventos.push({
            diaIdx: di, hora: hh, minuto: 0, durMin: 55,
            titulo: `${sigla} — ${esp.nome}`,
            consultor: esp.nome, sigla,
            cliente: '—', tipo: '—', local: '—',
            corCls: AgendaModule._COR_ESP[esp.cor % 5],
          });
        });
      });
    });
    return eventos;
  }

  /* Eventos do store (agendamentos registrados) */
  static _getEventosStore(inicioSemana) {
    const fim = new Date(inicioSemana); fim.setDate(fim.getDate() + 6);
    return store.agendamentos
      .filter(a => {
        if (!a.data) return false;
        const d = new Date(a.data);
        return d >= inicioSemana && d <= fim;
      })
      .map(a => {
        const d = new Date(a.data);
        const diaIdx = (d.getDay() + 6) % 7;
        return {
          diaIdx, hora: d.getHours(), minuto: d.getMinutes(), durMin: 60,
          titulo: a.lead?.nome || 'Agendamento',
          consultor: a.lead?.captador || 'Carlos Mendes',
          sigla: (a.lead?.captador || 'CM').split(' ').map(x=>x[0]).join('').slice(0,2),
          cliente: a.lead?.nome || '—',
          tipo: a.categoria || '—',
          local: a.local || '—',
          corCls: 'gcal-ev-store',
        };
      });
  }

  /* ---- CALCULAR INÍCIO DA SEMANA ---- */
  static _inicioSemana() {
    const hoje = new Date();
    const dow = hoje.getDay(); // 0=Dom
    const seg = new Date(hoje);
    seg.setDate(hoje.getDate() - (dow === 0 ? 6 : dow - 1) + AgendaModule._offset * 7);
    seg.setHours(0,0,0,0);
    return seg;
  }

  /* ---- RENDER PRINCIPAL ---- */
  static renderFull() {
    AgendaModule._renderGCal();
  }

  static renderDashboard() {
    // Mini-grade do dashboard (mantida simples)
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
          ${slots.map(s => `<span class="ag-slot" title="${s}" onclick="AgendaModule.abrirDetalheSlot('${d}','${h}','${s}')">${s}</span>`).join('')}
        </div>`;
      });
    });
    html += '</div>';
    $c.html(html);
  }

  /* ---- RENDER GCAL COMPLETO ---- */
  static _renderGCal() {
    const $wrap = $('#gcal-container');
    if (!$wrap.length) return;

    const ini = AgendaModule._inicioSemana();
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const dias = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
    const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

    /* Label período */
    const fim = new Date(ini); fim.setDate(ini.getDate() + 6);
    const sameMonth = ini.getMonth() === fim.getMonth();
    const label = sameMonth
      ? `${ini.getDate()} – ${fim.getDate()} de ${meses[fim.getMonth()].charAt(0).toUpperCase()+meses[fim.getMonth()].slice(1)} de ${fim.getFullYear()}`
      : `${ini.getDate()} ${meses[ini.getMonth()]} – ${fim.getDate()} ${meses[fim.getMonth()]} ${fim.getFullYear()}`;
    $('#gcal-periodo-label').text(label);

    const HINI = AgendaModule._HORAS_INI;
    const HFIM = AgendaModule._HORAS_FIM;
    const PX   = AgendaModule._PX_HORA;
    const totalH = HFIM - HINI;
    const cols = AgendaModule._view === 'dia' ? 1 : 7;
    const diasVisiveis = AgendaModule._view === 'dia'
      ? [0] // só segunda (simplificado — pode ser o dia atual)
      : [0,1,2,3,4,5,6];

    /* Colunas: gutter + N dias */
    const colTemplate = `52px repeat(${diasVisiveis.length}, 1fr)`;

    /* ---- CABEÇALHO ---- */
    let headerHtml = `<div class="gcal-header-row" style="grid-template-columns:${colTemplate};">
      <div class="gcal-header-gutter"></div>`;
    diasVisiveis.forEach(di => {
      const dt = new Date(ini); dt.setDate(ini.getDate() + di);
      dt.setHours(0,0,0,0);
      const isHoje = dt.getTime() === hoje.getTime();
      headerHtml += `<div class="gcal-header-day${isHoje?' is-today':''}">
        <span class="gcal-day-name">${dias[di]}</span>
        <div class="gcal-day-num">${dt.getDate()}</div>
      </div>`;
    });
    headerHtml += '</div>';

    /* ---- CORPO ---- */
    let bodyHtml = `<div class="gcal-body" style="grid-template-columns:${colTemplate}; position:relative;">`;

    /* Coluna de horas */
    bodyHtml += `<div class="gcal-time-col">`;
    for (let h = HINI; h < HFIM; h++) {
      const label12 = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h-12} PM`;
      const labelBR = h.toString().padStart(2,'0') + ':00';
      bodyHtml += `<div class="gcal-time-label">${labelBR}</div>`;
    }
    bodyHtml += `</div>`;

    /* Colunas de dias */
    diasVisiveis.forEach(di => {
      const dt = new Date(ini); dt.setDate(ini.getDate() + di);
      dt.setHours(0,0,0,0);
      const isHoje = dt.getTime() === hoje.getTime();
      bodyHtml += `<div class="gcal-day-col${isHoje?' is-today':''}" id="gcal-col-${di}">`;
      for (let h = HINI; h < HFIM; h++) {
        bodyHtml += `<div class="gcal-hour-line"><div class="gcal-half-line"></div></div>`;
      }
      bodyHtml += `</div>`;
    });
    bodyHtml += `</div>`;

    $wrap.html(headerHtml + bodyHtml);

    /* ---- EVENTOS ---- */
    const eventosEst   = AgendaModule._getEventosEstaticos();
    const eventosStore = AgendaModule._getEventosStore(ini);
    const todosEvt     = [...eventosEst, ...eventosStore];

    diasVisiveis.forEach(di => {
      const $col = $(`#gcal-col-${di}`);
      if (!$col.length) return;
      const evtsDia = todosEvt.filter(e => e.diaIdx === di);
      if (!evtsDia.length) return;

      /* --- ALGORITMO DE LAYOUT (Google Calendar style) ---
         1. Converter cada evento em { start, end } em minutos desde HINI
         2. Agrupar em "clusters" de eventos sobrepostos
         3. Dentro de cada cluster, atribuir colunas evitando sobreposição
         4. Renderizar com left/width calculados em %
      */
      const toMin = ev => (ev.hora - HINI) * 60 + ev.minuto;
      const evts = evtsDia
        .filter(ev => ev.hora >= HINI && ev.hora < HFIM)
        .map(ev => ({
          ...ev,
          startMin: toMin(ev),
          endMin:   toMin(ev) + ev.durMin,
        }))
        .sort((a, b) => a.startMin - b.startMin);

      /* Atribuir colSlot e totalSlots a cada evento */
      AgendaModule._calcLayout(evts);

      const PADDING = 2; // px entre eventos
      evts.forEach(ev => {
        if (ev.hora < HINI || ev.hora >= HFIM) return;
        const topPx  = ev.startMin * PX / 60;
        const hgtPx  = Math.max(ev.durMin / 60 * PX - 1, 18);
        const wPct   = (100 / ev._totalCols) - PADDING;
        const lPct   = (100 / ev._totalCols) * ev._col;
        const evHtml = `<div class="gcal-event ${ev.corCls}"
          style="top:${topPx}px;height:${hgtPx}px;left:calc(${lPct}% + ${PADDING}px);width:calc(${wPct}% - ${PADDING}px);"
          onclick="AgendaModule._abrirEvento(event, ${JSON.stringify(ev).replace(/"/g,'&quot;')})">
          <div class="gcal-event-title">${Utils.escHtml(ev.titulo)}</div>
          <div class="gcal-event-time">${ev.hora.toString().padStart(2,'0')}:${ev.minuto.toString().padStart(2,'0')}</div>
        </div>`;
        $col.append(evHtml);
      });
    });

    /* ---- LINHA DO AGORA ---- */
    if (AgendaModule._offset === 0) {
      const agora = new Date();
      const hAtual = agora.getHours() + agora.getMinutes() / 60;
      if (hAtual >= HINI && hAtual < HFIM) {
        const topPx = (hAtual - HINI) * PX;
        const diaAtual = (agora.getDay() + 6) % 7;
        if (diasVisiveis.includes(diaAtual)) {
          $(`#gcal-col-${diaAtual}`).append(
            `<div class="gcal-now-line" style="top:${topPx}px;">
              <div class="gcal-now-dot"></div>
              <div class="gcal-now-bar"></div>
            </div>`
          );
        }
      }
    }

    /* Scroll até 07:00 */
    setTimeout(() => {
      const $w = $('.gcal-wrapper')[0];
      if ($w) $w.scrollTop = HINI * PX;
    }, 50);
  }

  /* ---- NAVEGAÇÃO ---- */
  static navSemana(delta) {
    AgendaModule._offset += delta;
    AgendaModule._renderGCal();
  }
  static irHoje() {
    AgendaModule._offset = 0;
    AgendaModule._renderGCal();
  }
  static setView(v) {
    AgendaModule._view = v;
    document.querySelectorAll('.gcal-view-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`gcal-btn-${v}`);
    if (btn) btn.classList.add('active');
    AgendaModule._renderGCal();
  }

  /* ---- POPOVER DE EVENTO ---- */
  static _abrirEvento(ev, evento) {
    ev.stopPropagation();
    const $pop = $('#gcal-popover');
    const hora  = `${evento.hora.toString().padStart(2,'0')}:${evento.minuto.toString().padStart(2,'0')} — ${Math.floor(evento.hora + evento.durMin/60).toString().padStart(2,'0')}:${((evento.minuto + evento.durMin) % 60).toString().padStart(2,'0')}`;
    $('#gcal-pop-titulo').text(evento.titulo);
    $('#gcal-pop-horario').text(hora);
    $('#gcal-pop-consultor').text(evento.consultor);
    $('#gcal-pop-cliente').text(evento.cliente);
    $('#gcal-pop-tipo').text(evento.tipo);
    $('#gcal-pop-local').text(evento.local);
    $('#gcal-pop-cliente-row').toggle(evento.cliente !== '—');
    $('#gcal-pop-tipo-row').toggle(evento.tipo !== '—');
    $('#gcal-pop-local-row').toggle(evento.local !== '—');

    $pop.show();
    // Posicionar próximo ao clique
    const x = Math.min(ev.clientX + 12, window.innerWidth  - 340);
    const y = Math.min(ev.clientY - 10, window.innerHeight - 250);
    $pop.css({ left: x, top: y });

    // Fechar ao clicar fora
    setTimeout(() => {
      $(document).one('click.gcalpop', () => $pop.hide());
    }, 10);
  }

  static fecharPopover() {
    $('#gcal-popover').hide();
  }

  /* AJUSTE 5: detalhe slot (manter compatibilidade dashboard) */
  static abrirDetalheSlot(dia, hora, sigla) {
    const esp = AgendaModule._ESP_MAP[sigla];
    Toast.show(`📅 ${sigla}${esp ? ' — '+esp.nome : ''} | ${dia} às ${hora}`, 'info');
  }

  static novoAgendamento() {
    Toast.show('Abra um lead no funil para agendar uma visita.', 'info');
  }

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
          ${slots.map(s => `<span class="ag-slot" title="${s}" onclick="AgendaModule.abrirDetalheSlot('${d}','${h}','${s}')">${s}</span>`).join('')}
        </div>`;
      });
    });
    html += '</div>';
    $c.html(html);
  }

  /* AJUSTE 5: Popover/detalhe ao clicar em slot da agenda */
  static abrirDetalheSlot(dia, hora, sigla) {
    // Mantido para compatibilidade com o dashboard mini
    const esp = AgendaModule._ESP_MAP?.[sigla];
    Toast.show(`📅 ${sigla}${esp ? ' — '+esp.nome : ''} | ${dia} às ${hora}`, 'info');
  }

}

/* ============================================================  RelatoriosModule */
class RelatoriosModule {

  static render() {
    RelatoriosModule._renderDashboard();
  }

  /* ================================================================
     PAINEL PRINCIPAL — renderiza tudo em #rel-dashboard
     ================================================================ */
  static _renderDashboard() {
    const $c = $('#rel-dashboard');
    if (!$c.length) return;

    /* ── Calcular todos os dados ── */
    const leads     = store.leads;
    const total     = leads.length || 1;
    const carteira  = leads.filter(l => l.etapa === 'carteira');
    const ligacoes  = store.ligacoes;
    const usuarios  = store.usuarios.filter(u => u.perfil === 'especialista');

    /* Totais por etapa */
    const porEtapa = {};
    STAGE_ORDER.forEach(e => { porEtapa[e] = leads.filter(l => l.etapa === e).length; });

    /* Score de saúde do funil (0-100) */
    const taxaConv = carteira.length / total;
    const eficLig  = ligacoes.length > 0 ? Math.min(ligacoes.filter(l => l.resultado?.includes('Agendamento')).length / ligacoes.length, 1) : 0;
    const cobMeta  = usuarios.length ? usuarios.filter(u => (porEtapa['carteira']||0) >= u.meta_vendas && u.meta_vendas > 0).length / usuarios.length : 0;
    const score    = Math.round((taxaConv * 40 + eficLig * 35 + cobMeta * 25) * 100);
    const scoreColor = score >= 70 ? '#10A64A' : score >= 40 ? '#F59E0B' : '#D91A3C';
    const scoreLabel = score >= 70 ? 'Saudável' : score >= 40 ? 'Atenção' : 'Crítico';

    /* Métricas por especialista */
    const espStats = {};
    usuarios.forEach(u => {
      espStats[u.nome] = { nome: u.nome, sigla: u.sigla, filial: u.filial, metaV: u.meta_vendas||0, metaM: u.meta_mensalidade||0, lig: 0, agend: 0, visitas: 0, vendas: 0, mensal: 0 };
    });
    ligacoes.forEach(l => { if (espStats[l.esp]) espStats[l.esp].lig++; });
    leads.forEach(l => {
      const e = espStats[l.captador]; if (!e) return;
      if (['agendamento','visita','venda','carteira'].includes(l.etapa)) e.agend++;
      if (['visita','venda','carteira'].includes(l.etapa)) e.visitas++;
      if (l.etapa === 'carteira') {
        e.vendas++;
        e.mensal += parseFloat((l.mensalidade||'0').replace(/[^0-9.,]/g,'').replace(',','.')) || 0;
      }
    });
    const espArr = Object.values(espStats).sort((a,b) => b.vendas - a.vendas);

    /* Por fonte */
    const porFonte = {};
    leads.forEach(l => { porFonte[l.fonte||'—'] = (porFonte[l.fonte||'—']||0)+1; });
    const fontesArr = Object.entries(porFonte).sort((a,b)=>b[1]-a[1]).slice(0,8);

    /* Leads quentes (tags quente ou muitas tentativas) */
    const quentes = leads
      .filter(l => l.tags?.includes('quente') || l.tentativas >= 3)
      .sort((a,b) => b.tentativas - a.tentativas)
      .slice(0,8);

    /* Alertas automáticos */
    const alertas = RelatoriosModule._gerarAlertas(leads, espArr, ligacoes);

    /* Aniversariantes */
    const hoje = new Date();
    const anivs = carteira.filter(l => l.aniversario).map(l => {
      const d = new Date(l.aniversario);
      const prox = new Date(hoje.getFullYear(), d.getMonth(), d.getDate());
      if (prox < hoje) prox.setFullYear(hoje.getFullYear()+1);
      const dias = Math.ceil((prox - hoje) / 86400000);
      return { ...l, diasRestantes: dias, dataFmt: d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}) };
    }).sort((a,b)=>a.diasRestantes-b.diasRestantes).slice(0,6);

    /* Cores do funil */
    const etapaConf = {
      lead:        { label:'Lead',        icon:'🌱', cor:'#3B82F6' },
      ligacao:     { label:'Ligação',     icon:'📞', cor:'#10B981' },
      agendamento: { label:'Agendamento', icon:'📅', cor:'#8B5CF6' },
      visita:      { label:'Visita',      icon:'🏠', cor:'#F59E0B' },
      venda:       { label:'Venda',       icon:'💰', cor:'#1B6B3A' },
      carteira:    { label:'Carteira',    icon:'👛', cor:'#4A5568' },
    };
    const maxEtapa = Math.max(...STAGE_ORDER.map(e=>porEtapa[e]), 1);

    /* ── Montar HTML ── */
    let html = '';

    /* ---- SEÇÃO 1: KPIs HERO ---- */
    html += `<div class="rdash-section">
      <div class="rdash-section-title"><i class="bi bi-speedometer2"></i> Indicadores Principais</div>
      <div class="rdash-kpi-grid">
        ${RelatoriosModule._kpi('#3B82F6','🌱', total, 'Total de Leads','','neu')}
        ${RelatoriosModule._kpi('#10B981','📞', ligacoes.length, 'Ligações Realizadas', ligacoes.length>38?'+'+((ligacoes.length-38)/38*100).toFixed(0)+'%':'—', ligacoes.length>38?'up':'neu')}
        ${RelatoriosModule._kpi('#8B5CF6','📅', porEtapa.agendamento, 'Agendamentos Ativos','','neu')}
        ${RelatoriosModule._kpi('#F59E0B','🏠', porEtapa.visita, 'Visitas Realizadas','','neu')}
        ${RelatoriosModule._kpi('#1B6B3A','💰', carteira.length, 'Vendas Concluídas', carteira.length > 0 ? '+'+carteira.length : '—', carteira.length>0?'up':'neu')}
        ${RelatoriosModule._kpi('#D91A3C','🎂', anivs.filter(a=>a.diasRestantes<=30).length, 'Aniversários em 30d','','info')}
      </div>
    </div>`;

    /* ---- SEÇÃO 2: FUNIL + SCORE + ALERTAS ---- */
    html += `<div class="rdash-section">
      <div class="rdash-section-title"><i class="bi bi-funnel-fill"></i> Funil de Vendas</div>
      <div class="rdash-3col">

        <!-- Funil visual -->
        <div class="rdash-card" style="grid-column:span 2;">
          <div class="rdash-card-hd">
            <div class="rdash-card-title"><i class="bi bi-funnel-fill"></i> Conversão por Etapa</div>
          </div>
          <div class="rdash-card-body">
            ${STAGE_ORDER.map((e,i) => {
              const n = porEtapa[e]; const prev = i>0 ? porEtapa[STAGE_ORDER[i-1]]||1 : total;
              const pctTotal = Math.round(n/total*100);
              const pctConv  = i===0 ? '100%' : Math.round(n/prev*100)+'%';
              const w = Math.round(n/maxEtapa*100);
              const cfg = etapaConf[e];
              return `<div class="rfunil-row">
                <div class="rfunil-icon">${cfg.icon}</div>
                <div class="rfunil-lbl">${cfg.label}</div>
                <div class="rfunil-track"><div class="rfunil-fill" style="width:${w}%;background:${cfg.cor};"></div></div>
                <div class="rfunil-n">${n}</div>
                <div class="rfunil-pct">${pctTotal}%</div>
                <div class="rfunil-conv" title="Conversão da etapa anterior">${i===0?'base':pctConv}</div>
              </div>`;
            }).join('')}
            <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border);display:flex;gap:20px;flex-wrap:wrap;">
              <div class="small text-muted">Taxa de conversão total: <strong style="color:var(--verde);">${(carteira.length/total*100).toFixed(1)}%</strong></div>
              <div class="small text-muted">Lead → Carteira média do setor: <strong>~15%</strong></div>
              <div class="small text-muted">Ticket médio estimado: <strong style="color:var(--marinho);">R$ ${RelatoriosModule._ticketMedio(leads)}</strong></div>
            </div>
          </div>
        </div>

        <!-- Score de saúde -->
        <div class="rdash-card">
          <div class="rdash-card-hd">
            <div class="rdash-card-title"><i class="bi bi-heart-pulse-fill"></i> Saúde do Funil</div>
          </div>
          <div class="rdash-card-body rhealthscore">
            <div class="rhs-circle" style="border-color:${scoreColor}22;">
              <div class="rhs-val" style="color:${scoreColor};">${score}</div>
            </div>
            <div class="rhs-lbl">Score geral</div>
            <div class="rhs-status" style="background:${scoreColor}18;color:${scoreColor};">${scoreLabel}</div>
            <div style="margin-top:14px;width:100%;">
              ${RelatoriosModule._miniBar('Conversão', Math.round(taxaConv*100), '#10A64A')}
              ${RelatoriosModule._miniBar('Efic. Ligações', Math.round(eficLig*100), '#3B82F6')}
              ${RelatoriosModule._miniBar('Metas atingidas', Math.round(cobMeta*100), '#8B5CF6')}
            </div>
          </div>
        </div>

      </div>
    </div>`;

    /* ---- SEÇÃO 3: ESPECIALISTAS + METAS ---- */
    html += `<div class="rdash-section">
      <div class="rdash-section-title"><i class="bi bi-people-fill"></i> Desempenho dos Especialistas</div>
      <div class="rdash-2col">

        <!-- Ranking -->
        <div class="rdash-card">
          <div class="rdash-card-hd">
            <div class="rdash-card-title"><i class="bi bi-trophy-fill"></i> Ranking de Vendas</div>
          </div>
          <div class="rdash-card-body">
            ${espArr.map((e,i) => {
              const rankCls = i===0?'gold':i===1?'silver':i===2?'bronze':'';
              const medalha  = i===0?'🥇':i===1?'🥈':i===2?'🥉':'';
              return `<div class="resp-row">
                <div class="resp-rank ${rankCls}">${medalha||i+1}</div>
                <div class="resp-avatar" style="background:${['#DBEAFE','#D1FAE5','#EDE9FE'][i%3]};color:${['#1D4ED8','#059669','#7C3AED'][i%3]};">${e.sigla}</div>
                <div class="resp-info">
                  <div class="resp-nome">${Utils.escHtml(e.nome)}</div>
                  <div class="resp-detalhe">${Utils.escHtml(e.filial)}</div>
                </div>
                <div class="resp-stats">
                  <div class="resp-stat"><div class="resp-stat-val">${e.lig}</div><div class="resp-stat-lbl">Lig.</div></div>
                  <div class="resp-stat"><div class="resp-stat-val">${e.agend}</div><div class="resp-stat-lbl">Agend.</div></div>
                  <div class="resp-stat"><div class="resp-stat-val" style="color:var(--verde);">${e.vendas}</div><div class="resp-stat-lbl">Vendas</div></div>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>

        <!-- Metas -->
        <div class="rdash-card">
          <div class="rdash-card-hd">
            <div class="rdash-card-title"><i class="bi bi-bullseye"></i> Atingimento de Metas</div>
          </div>
          <div class="rdash-card-body">
            ${espArr.filter(e=>e.metaV>0).map(e => {
              const pctV = Math.min(Math.round(e.vendas/e.metaV*100), 100);
              const pctM = e.metaM ? Math.min(Math.round(e.mensal/e.metaM*100), 100) : 0;
              const corV = pctV>=100?'#10A64A':pctV>=60?'#F59E0B':'#DC2626';
              const corM = pctM>=100?'#10A64A':pctM>=60?'#F59E0B':'#DC2626';
              return `<div class="rmeta-row">
                <div class="rmeta-head">
                  <span class="rmeta-nome">${Utils.escHtml(e.nome)}</span>
                  <span class="rmeta-vals">${e.vendas}/${e.metaV} vendas</span>
                </div>
                <div class="rmeta-track"><div class="rmeta-fill" style="width:${pctV}%;background:${corV};"></div></div>
                <div style="display:flex;justify-content:space-between;margin-top:3px;">
                  <span class="rmeta-badge" style="background:${corV}18;color:${corV};">${pctV>=100?'✅ Meta atingida':'⏳ '+pctV+'% da meta'}</span>
                  ${e.metaM?`<span style="font-size:10px;color:var(--text-muted);">R$${e.mensal.toFixed(0)} / R$${e.metaM.toLocaleString('pt-BR')}</span>`:''}
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>

      </div>
    </div>`;

    /* ---- SEÇÃO 4: FONTES + LEADS QUENTES ---- */
    html += `<div class="rdash-section">
      <div class="rdash-section-title"><i class="bi bi-bar-chart-fill"></i> Origem & Oportunidades</div>
      <div class="rdash-2col">

        <!-- Fonte dos leads -->
        <div class="rdash-card">
          <div class="rdash-card-hd">
            <div class="rdash-card-title"><i class="bi bi-pin-map-fill"></i> Fonte dos Leads</div>
          </div>
          <div class="rdash-card-body rchart-wrap">
            ${fontesArr.map(([f,n]) => {
              const w = Math.round(n/fontesArr[0][1]*100);
              const hue = Math.abs(f.split('').reduce((a,c)=>a+c.charCodeAt(0),0)) % 360;
              const cor = `hsl(${hue},60%,42%)`;
              return `<div class="rchart-bar-row">
                <div class="rchart-bar-lbl" title="${Utils.escHtml(f)}">${Utils.escHtml(f)}</div>
                <div class="rchart-bar-track">
                  <div class="rchart-bar-fill" style="width:${w}%;background:${cor};">${n}</div>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>

        <!-- Leads quentes -->
        <div class="rdash-card">
          <div class="rdash-card-hd">
            <div class="rdash-card-title"><i class="bi bi-fire"></i> Leads com Alta Prioridade</div>
            <span style="font-size:10px;color:var(--text-muted);">tag quente ou ≥3 tentativas</span>
          </div>
          <div class="rdash-card-body">
            ${quentes.length ? quentes.map(l => {
              const cfg = etapaConf[l.etapa];
              return `<div class="rleads-row" style="cursor:pointer;" onclick="FunilModule.abrirDetalhe('${l.id}');navigate('funil');">
                <div class="rleads-dot" style="background:${cfg.cor};"></div>
                <div class="rleads-nome">${Utils.escHtml(l.nome)}<br><span style="font-size:10px;color:var(--text-muted);">${l.id} · ${Utils.escHtml(l.captador)}</span></div>
                <span class="rleads-etapa" style="background:${cfg.cor}18;color:${cfg.cor};">${cfg.icon} ${cfg.label}</span>
                <span class="rleads-tent" title="Tentativas">${l.tentativas}</span>
              </div>`;
            }).join('') : '<p class="text-muted small text-center py-3">Nenhum lead prioritário no momento.</p>'}
          </div>
        </div>

      </div>
    </div>`;

    /* ---- SEÇÃO 5: ALERTAS + ANIVERSARIANTES ---- */
    html += `<div class="rdash-section">
      <div class="rdash-section-title"><i class="bi bi-bell-fill"></i> Alertas & Ações Recomendadas</div>
      <div class="rdash-2col">

        <div class="rdash-card">
          <div class="rdash-card-hd">
            <div class="rdash-card-title"><i class="bi bi-exclamation-triangle-fill"></i> Alertas Automáticos</div>
          </div>
          <div class="rdash-card-body">
            ${alertas.length ? alertas.map(a=>`<div class="ralerta ${a.tipo}"><div class="ralerta-icon">${a.icon}</div><div class="ralerta-txt">${a.msg}</div></div>`).join('') : '<div class="ralerta success"><div class="ralerta-icon">✅</div><div class="ralerta-txt"><strong>Tudo em ordem!</strong> Nenhum alerta no momento.</div></div>'}
          </div>
        </div>

        <div class="rdash-card">
          <div class="rdash-card-hd">
            <div class="rdash-card-title"><i class="bi bi-cake2-fill"></i> Aniversariantes (próximos 30 dias)</div>
          </div>
          <div class="rdash-card-body">
            ${anivs.length ? anivs.map(l => {
              const isHoje = l.diasRestantes === 0;
              const isSemana = l.diasRestantes <= 7;
              const cor = isHoje?'var(--vermelho)':isSemana?'var(--amarelo)':'var(--verde)';
              const bg  = isHoje?'var(--vermelho-s)':isSemana?'var(--amarelo-s)':'var(--verde-s)';
              const txt = isHoje?'🎉 Hoje!':isSemana?`em ${l.diasRestantes}d`:`em ${l.diasRestantes}d`;
              return `<div class="raniv-row">
                <div class="raniv-avatar">${l.nome.split(' ').map(x=>x[0]).join('').slice(0,2)}</div>
                <div class="raniv-info">
                  <div class="raniv-nome">${Utils.escHtml(l.nome)}</div>
                  <div class="raniv-data">🎂 ${l.dataFmt} · 📱 ${Utils.escHtml(l.tel)}</div>
                </div>
                <span class="raniv-dias" style="background:${bg};color:${cor};">${txt}</span>
              </div>`;
            }).join('') : '<p class="text-muted small text-center py-3">Nenhum aniversário nos próximos 30 dias.</p>'}
          </div>
        </div>

      </div>
    </div>`;

    /* ---- SEÇÃO 6: TABELA GERAL DE LEADS ---- */
    html += `<div class="rdash-section">
      <div class="rdash-section-title"><i class="bi bi-table"></i> Visão Geral — Todos os Leads</div>
      <div class="rdash-card">
        <div class="rdash-card-hd">
          <div class="rdash-card-title"><i class="bi bi-list-ul"></i> Leads Ativos no Sistema</div>
          <span style="font-size:11px;color:var(--text-muted);">${leads.length} registros</span>
        </div>
        <div style="overflow-x:auto;">
          <table class="amp-table w-100">
            <thead><tr>
              <th>ID</th><th>Nome</th><th>Etapa</th><th>Fonte</th><th>Captador</th>
              <th>Tentativas</th><th>Tags</th><th>Mensalidade Est.</th><th>Ação</th>
            </tr></thead>
            <tbody>
              ${leads.map(l => {
                const cfg = etapaConf[l.etapa]||{label:l.etapa,cor:'#6B7280',icon:''};
                const tagsHtml = (l.tags||[]).map(t=>{const c=TAG_CONFIG[t]||{cls:'',label:t};return`<span class="amp-tag ${c.cls}" style="font-size:10px;">${c.label}</span>`;}).join('');
                return `<tr>
                  <td><code style="font-size:10px;">${l.id}</code></td>
                  <td><strong>${Utils.escHtml(l.nome)}</strong><br><small class="text-muted">${Utils.escHtml(l.tel)}</small></td>
                  <td><span style="background:${cfg.cor}18;color:${cfg.cor};padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600;">${cfg.icon} ${cfg.label}</span></td>
                  <td style="font-size:11px;">${Utils.escHtml(l.fonte||'—')}</td>
                  <td style="font-size:11px;">${Utils.escHtml(l.captador||'—')}</td>
                  <td style="text-align:center;font-family:'JetBrains Mono';font-size:12px;"><span class="${l.tentativas>=25?'tent-warn':''}">${l.tentativas}</span></td>
                  <td>${tagsHtml||'<span style="color:var(--text-light);font-size:11px;">—</span>'}</td>
                  <td style="font-size:11px;font-family:'JetBrains Mono';">${Utils.escHtml(l.mensalidadeEst||l.mensalidade||'—')}</td>
                  <td><button class="btn btn-sm btn-outline-secondary" style="font-size:10px;padding:2px 8px;" onclick="FunilModule.abrirDetalhe('${l.id}');navigate('funil');">Abrir</button></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;

    $c.html(html);

    /* Animar barras após render */
    setTimeout(() => {
      $c.find('.rfunil-fill, .rmeta-fill, .rchart-bar-fill').each(function() {
        const w = $(this).css('width'); $(this).css('width','0').animate({width:w},600);
      });
    }, 50);
  }

  /* ── Helpers ── */
  static _kpi(cor, icon, val, lbl, delta, deltaTipo) {
    return `<div class="rdash-kpi">
      <div class="rdash-kpi-accent" style="background:${cor};"></div>
      <div class="rdash-kpi-icon">${icon}</div>
      <div class="rdash-kpi-val" style="color:${cor};">${val}</div>
      <div class="rdash-kpi-lbl">${lbl}</div>
      ${delta ? `<div class="rdash-kpi-delta ${deltaTipo}">${delta}</div>` : ''}
    </div>`;
  }

  static _miniBar(lbl, pct, cor) {
    return `<div style="margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px;">
        <span style="color:var(--text-muted);">${lbl}</span>
        <span style="font-weight:700;color:${cor};font-family:'JetBrains Mono';">${pct}%</span>
      </div>
      <div style="background:var(--bg);border-radius:99px;height:5px;">
        <div style="width:${Math.min(pct,100)}%;background:${cor};height:5px;border-radius:99px;transition:width .6s;"></div>
      </div>
    </div>`;
  }

  static _ticketMedio(leads) {
    const vals = leads.map(l => parseFloat((l.mensalidadeEst||l.mensalidade||'0').replace(/[^0-9.,]/g,'').replace(',','.'))).filter(v=>v>0);
    if (!vals.length) return '—';
    return (vals.reduce((a,b)=>a+b,0)/vals.length).toLocaleString('pt-BR',{minimumFractionDigits:2});
  }

  static _gerarAlertas(leads, espArr, ligacoes) {
    const alertas = [];
    /* Leads em delay */
    const delay = leads.filter(l=>l.tags?.includes('delay'));
    if (delay.length) alertas.push({ tipo:'warning', icon:'⏳', msg: `<strong>${delay.length} lead(s) em Delay</strong> — revisão necessária para reengajamento.` });
    /* Leads sem contato há mais de 5 tentativas */
    const sem = leads.filter(l=>l.tentativas>=5 && l.etapa==='ligacao');
    if (sem.length) alertas.push({ tipo:'danger', icon:'🔴', msg: `<strong>${sem.length} lead(s)</strong> na Ligação com 5+ tentativas sem conversão.` });
    /* Metas abaixo de 50% */
    espArr.forEach(e => {
      if (e.metaV>0 && e.vendas/e.metaV < 0.5) alertas.push({ tipo:'warning', icon:'⚠️', msg: `<strong>${e.nome}</strong> está em ${Math.round(e.vendas/e.metaV*100)}% da meta de vendas.` });
    });
    /* Bons resultados */
    espArr.forEach(e => {
      if (e.metaV>0 && e.vendas>=e.metaV) alertas.push({ tipo:'success', icon:'🎉', msg: `<strong>${e.nome}</strong> atingiu 100% da meta de vendas este mês!` });
    });
    /* Sem ligações */
    if (!ligacoes.length) alertas.push({ tipo:'info', icon:'📞', msg: '<strong>Nenhuma ligação registrada</strong> ainda. Comece a registrar pelo Funil.' });
    /* Agendamentos pendentes */
    const agend = leads.filter(l=>l.etapa==='agendamento').length;
    if (agend>0) alertas.push({ tipo:'info', icon:'📅', msg: `<strong>${agend} agendamento(s)</strong> pendente(s) de visita esta semana.` });
    return alertas.slice(0,6);
  }

  /* renderFunil e renderAniversariantes mantidos para compatibilidade interna */
  static renderFunil() { /* incorporado em _renderDashboard */ }
  static renderAniversariantes() { /* incorporado em _renderDashboard */ }

  /* ================================================================
     EXPORTAÇÃO EXCEL — ExcelJS com identidade visual Amparar
     Cores: Vermelho #D91A3C | Marinho #1E2358 | Branco #FFFFFF
     Usa window.ExcelJS (carregado via CDN no index.html)
     ================================================================ */

  /* ── Paleta Amparar ── */
  static get _COR() {
    return {
      vermelho:  'D91A3C', vermelhoClaro: 'FDF1F4', vermelhoMed: 'F7B8C4',
      marinho:   '1E2358', marinhoClaro:  'EDEEF9', marinhoMed:  'C5C8EC',
      verde:     '10A64A', verdeClaro:    'E8F8EE',
      amarelo:   'F59E0B', amareloClaro:  'FEF3C7',
      roxo:      '8B5CF6', roxoClaro:     'EDE9FE',
      azul:      '3B82F6', azulClaro:     'DBEAFE',
      cinza:     '6B7095', cinzaClaro:    'F5F6FA',
      branco:    'FFFFFF', texto:         '0E1023',
      borda:     'E5E7F0',
    };
  }

  /* ── Criar workbook novo com configurações base ── */
  static _wb() {
    const wb = new ExcelJS.Workbook();
    wb.creator    = 'Amparar CRM — Beyond Bits Tecnologia';
    wb.created    = new Date();
    wb.properties = { date1904: false };
    return wb;
  }

  /* ── Estilos reutilizáveis ── */
  static _estilos() {
    const C = RelatoriosModule._COR;
    return {
      /* Título principal da aba (linha 1) */
      titulo: {
        font:      { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF'+C.branco } },
        fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF'+C.marinho } },
        alignment: { vertical: 'middle', horizontal: 'left', indent: 1 },
        border:    {},
      },
      /* Subtítulo (gerado em / usuário) */
      subtitulo: {
        font:      { name: 'Calibri', size: 10, color: { argb: 'FF'+C.cinza } },
        fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF'+C.cinzaClaro } },
        alignment: { vertical: 'middle', horizontal: 'left', indent: 1 },
      },
      /* Cabeçalho de tabela */
      header: {
        font:      { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF'+C.branco } },
        fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF'+C.vermelho } },
        alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
        border: {
          top:    { style: 'thin', color: { argb: 'FF'+C.vermelhoMed } },
          bottom: { style: 'thin', color: { argb: 'FF'+C.vermelhoMed } },
          left:   { style: 'thin', color: { argb: 'FF'+C.vermelhoMed } },
          right:  { style: 'thin', color: { argb: 'FF'+C.vermelhoMed } },
        },
      },
      /* Cabeçalho secundário (tabelas menores, seções) */
      headerSec: {
        font:      { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF'+C.branco } },
        fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF'+C.marinho } },
        alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
        border: {
          top:    { style: 'thin', color: { argb: 'FF'+C.marinhoMed } },
          bottom: { style: 'thin', color: { argb: 'FF'+C.marinhoMed } },
          left:   { style: 'thin', color: { argb: 'FF'+C.marinhoMed } },
          right:  { style: 'thin', color: { argb: 'FF'+C.marinhoMed } },
        },
      },
      /* Linha par (zebrada) */
      rowPar: {
        font: { name: 'Calibri', size: 10, color: { argb: 'FF'+C.texto } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF'+C.branco } },
        border: {
          bottom: { style: 'hair', color: { argb: 'FF'+C.borda } },
          left:   { style: 'hair', color: { argb: 'FF'+C.borda } },
          right:  { style: 'hair', color: { argb: 'FF'+C.borda } },
        },
        alignment: { vertical: 'middle', wrapText: false },
      },
      /* Linha ímpar (zebrada) */
      rowImpar: {
        font: { name: 'Calibri', size: 10, color: { argb: 'FF'+C.texto } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF'+C.marinhoClaro } },
        border: {
          bottom: { style: 'hair', color: { argb: 'FF'+C.borda } },
          left:   { style: 'hair', color: { argb: 'FF'+C.borda } },
          right:  { style: 'hair', color: { argb: 'FF'+C.borda } },
        },
        alignment: { vertical: 'middle', wrapText: false },
      },
      /* Número / valor */
      numero: {
        font:      { name: 'Calibri', size: 10, color: { argb: 'FF'+C.texto } },
        alignment: { vertical: 'middle', horizontal: 'center' },
        numFmt:    '#,##0',
      },
      /* Moeda */
      moeda: {
        font:      { name: 'Calibri', size: 10, color: { argb: 'FF'+C.texto } },
        alignment: { vertical: 'middle', horizontal: 'right' },
        numFmt:    '"R$"#,##0.00',
      },
      /* Percentual */
      pct: {
        font:      { name: 'Calibri', size: 10, color: { argb: 'FF'+C.texto } },
        alignment: { vertical: 'middle', horizontal: 'center' },
        numFmt:    '0.0"%"',
      },
      /* Destaque verde (meta atingida) */
      verde: {
        font: { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF'+C.verde } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF'+C.verdeClaro } },
        alignment: { vertical: 'middle', horizontal: 'center' },
      },
      /* Destaque vermelho (alerta) */
      alerta: {
        font: { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF'+C.vermelho } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF'+C.vermelhoClaro } },
        alignment: { vertical: 'middle', horizontal: 'center' },
      },
      /* Destaque amarelo (atenção) */
      atencao: {
        font: { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF'+C.amarelo } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF'+C.amareloClaro } },
        alignment: { vertical: 'middle', horizontal: 'center' },
      },
      /* Célula de seção (label de agrupamento) */
      secao: {
        font: { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF'+C.marinho } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF'+C.marinhoClaro } },
        alignment: { vertical: 'middle', horizontal: 'left', indent: 1 },
        border: { left: { style: 'medium', color: { argb: 'FF'+C.vermelho } } },
      },
    };
  }

  /* ── Helper: aplicar estilo a uma célula ── */
  static _estilo(cell, estilo) {
    if (estilo.font)      cell.font      = estilo.font;
    if (estilo.fill)      cell.fill      = estilo.fill;
    if (estilo.alignment) cell.alignment = estilo.alignment;
    if (estilo.border)    cell.border    = estilo.border;
    if (estilo.numFmt)    cell.numFmt    = estilo.numFmt;
  }

  /* ── Helper: linha de título da aba ── */
  static _addTitulo(ws, titulo, ncols) {
    const C = RelatoriosModule._COR;
    const E = RelatoriosModule._estilos();
    const agora = new Date().toLocaleString('pt-BR');
    const usuario = store.usuarios[0]?.nome || 'Carlos Mendes';

    // Linha 1: título
    ws.addRow([titulo]);
    const r1 = ws.lastRow;
    r1.height = 36;
    ws.mergeCells(r1.number, 1, r1.number, ncols);
    RelatoriosModule._estilo(r1.getCell(1), E.titulo);

    // Linha 2: meta info
    ws.addRow([`Gerado em ${agora}  |  Usuário: ${usuario}  |  Amparar CRM © 2026`]);
    const r2 = ws.lastRow;
    r2.height = 18;
    ws.mergeCells(r2.number, 1, r2.number, ncols);
    RelatoriosModule._estilo(r2.getCell(1), E.subtitulo);

    // Linha 3: separador vazio
    ws.addRow([]);
    ws.lastRow.height = 6;
  }

  /* ── Helper: adicionar tabela com header + rows + zebra ── */
  static _addTabela(ws, headers, rows, estiloHeader = 'header', ncols = null) {
    const E = RelatoriosModule._estilos();
    const nc = ncols || headers.length;

    // Header
    ws.addRow(headers);
    const rh = ws.lastRow;
    rh.height = 22;
    headers.forEach((_, i) => RelatoriosModule._estilo(rh.getCell(i+1), E[estiloHeader]));

    // Dados
    rows.forEach((row, ri) => {
      ws.addRow(row);
      const rd = ws.lastRow;
      rd.height = 18;
      const estiloBase = ri % 2 === 0 ? E.rowPar : E.rowImpar;
      row.forEach((val, ci) => {
        const cell = rd.getCell(ci+1);
        RelatoriosModule._estilo(cell, estiloBase);
        // Aplicar formato especial por tipo de dado
        if (typeof val === 'number') {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      });
    });

    // Linha final de fechamento
    ws.addRow([]);
    ws.lastRow.height = 8;
  }

  /* ── Helper: larguras automáticas ── */
  static _autoWidth(ws, headers, rows, min = 8, max = 40) {
    const allRows = [headers, ...rows];
    const widths = [];
    allRows.forEach(row => {
      row.forEach((cell, i) => {
        const len = cell != null ? String(cell).length : 0;
        widths[i] = Math.max(widths[i] || min, Math.min(len + 3, max));
      });
    });
    ws.columns = widths.map((w, i) => ({ key: String(i), width: w }));
  }

  /* ── Helper: download ── */
  static async _baixarExcelJS(wb, nome) {
    try {
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = nome; a.click();
      URL.revokeObjectURL(url);
      Toast.show(`✅ "${nome}" exportado com sucesso!`, 'success');
    } catch(err) {
      console.error(err);
      Toast.show('Erro ao gerar o arquivo. Verifique o console.', 'danger');
    }
  }

  /* ── Helper: adicionar gráfico de barras nativo ── */
  static _addGrafico(wb, ws, titulo, categorias, series, startRow, startCol, endRow, endCol) {
    try {
      // ExcelJS suporta gráficos via addChart
      const chart = wb.addChart({ type: 'bar', series });
      // Posicionar na planilha (nota: suporte limitado do ExcelJS, mas funciona no xlsx)
    } catch(e) { /* silencioso se não suportar */ }
  }

  /* ================================================================
     1. LEADS POR ETAPA
     ================================================================ */
  static async exportarLeads() {
    const C = RelatoriosModule._COR;
    const E = RelatoriosModule._estilos();
    const wb = RelatoriosModule._wb();
    const etapas = { lead:'Lead', ligacao:'Ligação', agendamento:'Agendamento', visita:'Visita', venda:'Venda', carteira:'Carteira' };
    const total = store.leads.length || 1;

    /* ── ABA 1: PAINEL RESUMO ── */
    const ws1 = wb.addWorksheet('📊 Resumo', { properties: { tabColor: { argb: 'FF'+C.vermelho } } });
    ws1.views = [{ showGridLines: false }];
    RelatoriosModule._addTitulo(ws1, '📊 AMPARAR CRM — Leads por Etapa — Painel Resumo', 6);

    // Seção métricas principais
    ws1.addRow(['MÉTRICAS PRINCIPAIS']);
    const rs = ws1.lastRow; rs.height = 20;
    ws1.mergeCells(rs.number, 1, rs.number, 6);
    RelatoriosModule._estilo(rs.getCell(1), E.secao);

    ws1.addRow(['Total de Leads', total, '', 'Carteira (convertidos)', store.leadsPorEtapa('carteira').length, '']);
    ws1.addRow(['Taxa de Conversão', (store.leadsPorEtapa('carteira').length/total*100).toFixed(1)+'%', '', 'Ligações Registradas', store.ligacoes.length, '']);
    ws1.addRow([]);

    // Tabela funil
    ws1.addRow(['FUNIL DE CONVERSÃO']);
    const rf = ws1.lastRow; rf.height = 20;
    ws1.mergeCells(rf.number, 1, rf.number, 6);
    RelatoriosModule._estilo(rf.getCell(1), E.secao);

    const funilHeaders = ['Etapa', 'Total', '% do Total', 'Conversão p/ Próxima', 'Status', 'Meta'];
    const funilRows = STAGE_ORDER.map((e, i) => {
      const n = store.leadsPorEtapa(e).length;
      const prev = i > 0 ? store.leadsPorEtapa(STAGE_ORDER[i-1]).length || 1 : total;
      const conv = i === 0 ? 100 : Math.round(n/prev*100);
      const meta = { lead:20, ligacao:12, agendamento:4, visita:2, venda:1, carteira:3 }[e];
      return [etapas[e], n, (n/total*100).toFixed(1)+'%', i===0?'100% (base)':conv+'%', n>=meta?'✅ Atingido':'⚠️ Abaixo', meta];
    });
    RelatoriosModule._addTabela(ws1, funilHeaders, funilRows);

    // Colorir coluna Status
    const statusRowStart = ws1.rowCount - funilRows.length;
    funilRows.forEach((row, i) => {
      const cell = ws1.getRow(statusRowStart + i).getCell(5);
      if (row[4].includes('✅')) RelatoriosModule._estilo(cell, E.verde);
      else RelatoriosModule._estilo(cell, E.atencao);
    });

    ws1.columns = [{width:18},{width:10},{width:14},{width:22},{width:16},{width:10}];

    /* ── ABAS POR ETAPA ── */
    const coresEtapa = { lead:'3B82F6', ligacao:'10B981', agendamento:'8B5CF6', visita:'F59E0B', venda:'1B6B3A', carteira:'4A5568' };
    STAGE_ORDER.forEach(etapa => {
      const leads = store.leadsPorEtapa(etapa);
      if (!leads.length) return;
      const wsE = wb.addWorksheet(etapas[etapa], { properties: { tabColor: { argb: 'FF'+coresEtapa[etapa] } } });
      wsE.views = [{ showGridLines: false }];
      RelatoriosModule._addTitulo(wsE, `${etapas[etapa].toUpperCase()} — ${leads.length} leads`, 11);

      const headers = ['ID', 'Nome', 'Telefone', 'Fonte', 'Captador', 'Tentativas', 'Tags', 'Placa', 'FIPE', 'Mensalidade Est.', 'Observações'];
      const rows = leads.map(l => [
        l.id, l.nome, l.tel, l.fonte||'', l.captador||'',
        l.tentativas||0, (l.tags||[]).join(', '),
        l.placa||'', l.fipe||'', l.mensalidadeEst||'', l.obs||'',
      ]);
      RelatoriosModule._addTabela(wsE, headers, rows);
      wsE.columns = [{width:16},{width:20},{width:16},{width:22},{width:18},{width:12},{width:16},{width:10},{width:12},{width:16},{width:30}];

      // Congelar primeira linha de dados
      wsE.views = [{ showGridLines: false, state: 'frozen', ySplit: 4 }];
    });

    await RelatoriosModule._baixarExcelJS(wb, 'Amparar_Leads.xlsx');
  }

  /* ================================================================
     2. HISTÓRICO DE LIGAÇÕES
     ================================================================ */
  static async exportarLigacoes() {
    if (!store.ligacoes.length) { Toast.show('Nenhuma ligação registrada ainda.', 'warning'); return; }
    const C = RelatoriosModule._COR;
    const E = RelatoriosModule._estilos();
    const wb = RelatoriosModule._wb();

    /* ── ABA 1: LIGAÇÕES DETALHADAS ── */
    const ws1 = wb.addWorksheet('📞 Ligações', { properties: { tabColor: { argb: 'FF'+C.verde } } });
    ws1.views = [{ showGridLines: false, state: 'frozen', ySplit: 4 }];
    RelatoriosModule._addTitulo(ws1, `📞 HISTÓRICO DE LIGAÇÕES — ${store.ligacoes.length} registros`, 7);
    const headers = ['Lead', 'Telefone', 'Resultado', 'Nº Tentativa', 'Especialista', 'Hora', 'Data'];
    const rows = store.ligacoes.map(l => [l.lead, l.tel, l.resultado||'', l.tentativa||0, l.esp||'', l.hora||'', l.data||'']);
    RelatoriosModule._addTabela(ws1, headers, rows);
    // Colorir resultado
    const dataStart = 5;
    rows.forEach((row, i) => {
      const cell = ws1.getRow(dataStart + i).getCell(3);
      if ((row[2]||'').includes('Agendamento')) RelatoriosModule._estilo(cell, E.verde);
      else if ((row[2]||'').includes('Errado') || (row[2]||'').includes('Não Atendeu')) RelatoriosModule._estilo(cell, E.alerta);
    });
    ws1.columns = [{width:22},{width:16},{width:22},{width:14},{width:20},{width:8},{width:12}];

    /* ── ABA 2: RESUMO POR RESULTADO ── */
    const ws2 = wb.addWorksheet('📊 Por Resultado', { properties: { tabColor: { argb: 'FF'+C.marinho } } });
    ws2.views = [{ showGridLines: false }];
    RelatoriosModule._addTitulo(ws2, '📊 RESUMO POR RESULTADO', 4);
    const contagem = {};
    store.ligacoes.forEach(l => { contagem[l.resultado||'—'] = (contagem[l.resultado||'—']||0)+1; });
    const total = store.ligacoes.length || 1;
    const resRows = Object.entries(contagem).sort((a,b)=>b[1]-a[1]).map(([r,n]) => [r, n, (n/total*100).toFixed(1)+'%', n > total*0.3 ? '⬆️ Alto' : '➡️ Normal']);
    RelatoriosModule._addTabela(ws2, ['Resultado', 'Qtd', '% do Total', 'Destaque'], resRows);
    ws2.columns = [{width:26},{width:10},{width:14},{width:14}];

    /* ── ABA 3: POR ESPECIALISTA ── */
    const ws3 = wb.addWorksheet('👤 Por Especialista', { properties: { tabColor: { argb: 'FF'+C.roxo } } });
    ws3.views = [{ showGridLines: false }];
    RelatoriosModule._addTitulo(ws3, '👤 LIGAÇÕES POR ESPECIALISTA', 4);
    const porEsp = {};
    store.ligacoes.forEach(l => {
      if (!porEsp[l.esp]) porEsp[l.esp] = { total: 0, agend: 0 };
      porEsp[l.esp].total++;
      if ((l.resultado||'').includes('Agendamento')) porEsp[l.esp].agend++;
    });
    const espRows = Object.entries(porEsp).sort((a,b)=>b[1].total-a[1].total).map(([e,v]) => [
      e, v.total, v.agend, (v.agend/v.total*100).toFixed(1)+'%'
    ]);
    RelatoriosModule._addTabela(ws3, ['Especialista', 'Total Ligações', 'Agendamentos', 'Taxa Conv.'], espRows, 'headerSec');
    ws3.columns = [{width:24},{width:16},{width:16},{width:14}];

    await RelatoriosModule._baixarExcelJS(wb, 'Amparar_Ligacoes.xlsx');
  }

  /* ================================================================
     3. VENDAS
     ================================================================ */
  static async exportarVendas() {
    const C = RelatoriosModule._COR;
    const E = RelatoriosModule._estilos();
    const wb = RelatoriosModule._wb();
    const carteira = store.leads.filter(l => l.etapa === 'carteira');
    if (!carteira.length) { Toast.show('Nenhuma venda registrada ainda.', 'warning'); return; }

    /* ── ABA 1: VENDAS DETALHADAS ── */
    const ws1 = wb.addWorksheet('💰 Vendas', { properties: { tabColor: { argb: 'FF'+C.verde } } });
    ws1.views = [{ showGridLines: false, state: 'frozen', ySplit: 4 }];
    RelatoriosModule._addTitulo(ws1, `💰 RELATÓRIO DE VENDAS — ${carteira.length} associados`, 13);
    const headers = ['ID', 'Nome', 'Telefone', 'Fonte', 'Captador', 'Data Venda', 'Adesão (R$)', 'Mensalidade (R$)', 'Rastreador (R$)', 'Placa', 'FIPE', 'Aniversário', 'Obs.'];
    const rows = carteira.map(l => [
      l.id, l.nome, l.tel, l.fonte||'', l.captador||'',
      l.dataVenda||'',
      parseFloat((l.adesao||'0').replace(/[^0-9.,]/g,'').replace(',','.')) || 0,
      parseFloat((l.mensalidade||l.mensalidadeEst||'0').replace(/[^0-9.,]/g,'').replace(',','.')) || 0,
      parseFloat((l.rastreador||'0').replace(/[^0-9.,]/g,'').replace(',','.')) || 0,
      l.placa||'', l.fipe||'', l.aniversario||'', l.obs||'',
    ]);
    RelatoriosModule._addTabela(ws1, headers, rows);
    // Formatar colunas de moeda
    const dataRowStart = 5;
    rows.forEach((_, i) => {
      [7, 8, 9].forEach(col => {
        const cell = ws1.getRow(dataRowStart + i).getCell(col);
        cell.numFmt = '"R$"#,##0.00';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      });
    });
    // Linha de TOTAL
    const totalRow = ws1.addRow(['', 'TOTAL', '', '', '', '',
      carteira.reduce((s,l) => s + (parseFloat((l.adesao||'0').replace(/[^0-9.,]/g,'').replace(',','.')) || 0), 0),
      carteira.reduce((s,l) => s + (parseFloat((l.mensalidade||l.mensalidadeEst||'0').replace(/[^0-9.,]/g,'').replace(',','.')) || 0), 0),
      carteira.reduce((s,l) => s + (parseFloat((l.rastreador||'0').replace(/[^0-9.,]/g,'').replace(',','.')) || 0), 0),
    ]);
    totalRow.height = 22;
    for (let c = 1; c <= 13; c++) RelatoriosModule._estilo(totalRow.getCell(c), E.headerSec);
    [7, 8, 9].forEach(col => { totalRow.getCell(col).numFmt = '"R$"#,##0.00'; });
    ws1.columns = [{width:16},{width:22},{width:16},{width:22},{width:18},{width:14},{width:14},{width:16},{width:14},{width:10},{width:12},{width:14},{width:28}];

    /* ── ABA 2: RESUMO POR CAPTADOR ── */
    const ws2 = wb.addWorksheet('👤 Por Captador', { properties: { tabColor: { argb: 'FF'+C.marinho } } });
    ws2.views = [{ showGridLines: false }];
    RelatoriosModule._addTitulo(ws2, '👤 VENDAS POR CAPTADOR', 5);
    const porCap = {};
    carteira.forEach(l => {
      if (!porCap[l.captador]) porCap[l.captador] = { vendas:0, adesao:0, mensal:0 };
      porCap[l.captador].vendas++;
      porCap[l.captador].adesao  += parseFloat((l.adesao||'0').replace(/[^0-9.,]/g,'').replace(',','.')) || 0;
      porCap[l.captador].mensal  += parseFloat((l.mensalidade||l.mensalidadeEst||'0').replace(/[^0-9.,]/g,'').replace(',','.')) || 0;
    });
    const capRows = Object.entries(porCap).sort((a,b)=>b[1].vendas-a[1].vendas).map(([c,v], i) => [
      i+1, c, v.vendas, v.adesao, v.mensal
    ]);
    RelatoriosModule._addTabela(ws2, ['Pos.','Captador','Vendas','Total Adesão (R$)','Total Mensalidade (R$)'], capRows, 'headerSec');
    const cr = 5;
    capRows.forEach((_, i) => {
      ws2.getRow(cr+i).getCell(4).numFmt = '"R$"#,##0.00';
      ws2.getRow(cr+i).getCell(5).numFmt = '"R$"#,##0.00';
    });
    ws2.columns = [{width:6},{width:24},{width:12},{width:20},{width:24}];

    /* ── ABA 3: POR FONTE ── */
    const ws3 = wb.addWorksheet('📌 Por Fonte', { properties: { tabColor: { argb: 'FF'+C.azul } } });
    ws3.views = [{ showGridLines: false }];
    RelatoriosModule._addTitulo(ws3, '📌 VENDAS POR FONTE DE LEAD', 4);
    const porFonte = {};
    carteira.forEach(l => { porFonte[l.fonte||'—'] = (porFonte[l.fonte||'—']||0)+1; });
    const totalC = carteira.length || 1;
    const fonteRows = Object.entries(porFonte).sort((a,b)=>b[1]-a[1]).map(([f,n]) => [f, n, (n/totalC*100).toFixed(1)+'%']);
    RelatoriosModule._addTabela(ws3, ['Fonte','Vendas','% do Total'], fonteRows, 'headerSec');
    ws3.columns = [{width:28},{width:12},{width:14}];

    await RelatoriosModule._baixarExcelJS(wb, 'Amparar_Vendas.xlsx');
  }

  /* ================================================================
     4. CARTEIRA DE ASSOCIADOS
     ================================================================ */
  static async exportarCarteira() {
    const C = RelatoriosModule._COR;
    const E = RelatoriosModule._estilos();
    const wb = RelatoriosModule._wb();
    const carteira = store.leads.filter(l => l.etapa === 'carteira');
    if (!carteira.length) { Toast.show('Nenhum associado na carteira.', 'warning'); return; }

    /* ── ABA 1: CARTEIRA COMPLETA ── */
    const ws1 = wb.addWorksheet('👛 Carteira', { properties: { tabColor: { argb: 'FF4A5568' } } });
    ws1.views = [{ showGridLines: false, state: 'frozen', ySplit: 4 }];
    RelatoriosModule._addTitulo(ws1, `👛 CARTEIRA DE ASSOCIADOS — ${carteira.length} registros`, 13);
    const headers = ['ID','Nome','Telefone','Placa','FIPE','Mensalidade (R$)','Adesão (R$)','Rastreador (R$)','Data Venda','Aniversário','Fonte','Captador','Obs.'];
    const rows = carteira.map(l => [
      l.id, l.nome, l.tel, l.placa||'', l.fipe||'',
      parseFloat((l.mensalidade||l.mensalidadeEst||'0').replace(/[^0-9.,]/g,'').replace(',','.')) || 0,
      parseFloat((l.adesao||'0').replace(/[^0-9.,]/g,'').replace(',','.')) || 0,
      parseFloat((l.rastreador||'0').replace(/[^0-9.,]/g,'').replace(',','.')) || 0,
      l.dataVenda||'', l.aniversario||'', l.fonte||'', l.captador||'', l.obs||'',
    ]);
    RelatoriosModule._addTabela(ws1, headers, rows);
    rows.forEach((_, i) => {
      [6,7,8].forEach(c => { const cell = ws1.getRow(5+i).getCell(c); cell.numFmt = '"R$"#,##0.00'; cell.alignment = {horizontal:'right',vertical:'middle'}; });
    });
    ws1.columns = [{width:16},{width:22},{width:16},{width:10},{width:12},{width:16},{width:14},{width:14},{width:14},{width:14},{width:22},{width:18},{width:28}];

    /* ── ABA 2: ANIVERSARIANTES ── */
    const hoje = new Date();
    const anivs = carteira.filter(l => l.aniversario).map(l => {
      const d = new Date(l.aniversario);
      const prox = new Date(hoje.getFullYear(), d.getMonth(), d.getDate());
      if (prox < hoje) prox.setFullYear(hoje.getFullYear()+1);
      return { ...l, diasRestantes: Math.ceil((prox-hoje)/86400000), dataFmt: d.toLocaleDateString('pt-BR') };
    }).sort((a,b) => a.diasRestantes - b.diasRestantes);

    const ws2 = wb.addWorksheet('🎂 Aniversariantes', { properties: { tabColor: { argb: 'FF'+C.vermelho } } });
    ws2.views = [{ showGridLines: false }];
    RelatoriosModule._addTitulo(ws2, '🎂 ANIVERSARIANTES DA CARTEIRA', 5);
    const anivRows = anivs.map(l => [l.nome, l.tel, l.dataFmt, l.diasRestantes, l.diasRestantes===0?'🎉 HOJE!':l.diasRestantes<=7?'Esta semana':'Próximo']);
    RelatoriosModule._addTabela(ws2, ['Nome','Telefone','Data Aniversário','Dias Restantes','Status'], anivRows, 'header');
    // Destacar quem faz aniversário logo
    anivRows.forEach((row, i) => {
      const cell = ws2.getRow(5+i).getCell(5);
      if (row[3] === 0) RelatoriosModule._estilo(cell, E.alerta);
      else if (row[3] <= 7) RelatoriosModule._estilo(cell, E.atencao);
      else RelatoriosModule._estilo(cell, E.verde);
    });
    ws2.columns = [{width:24},{width:16},{width:18},{width:16},{width:16}];

    await RelatoriosModule._baixarExcelJS(wb, 'Amparar_Carteira.xlsx');
  }

  /* ================================================================
     5. CONVERSÃO DO FUNIL
     ================================================================ */
  static async exportarFunil() {
    const C = RelatoriosModule._COR;
    const E = RelatoriosModule._estilos();
    const wb = RelatoriosModule._wb();
    const etapas = { lead:'Lead', ligacao:'Ligação', agendamento:'Agendamento', visita:'Visita', venda:'Venda', carteira:'Carteira' };
    const totais = STAGE_ORDER.map(e => store.leadsPorEtapa(e).length);
    const base = totais[0] || 1;

    /* ── ABA 1: FUNIL PRINCIPAL ── */
    const ws1 = wb.addWorksheet('🔻 Funil', { properties: { tabColor: { argb: 'FF'+C.vermelho } } });
    ws1.views = [{ showGridLines: false }];
    RelatoriosModule._addTitulo(ws1, '🔻 ANÁLISE DE CONVERSÃO DO FUNIL', 6);

    const funilHeaders = ['Etapa','Total Leads','% do Total','Conversão Etapa Anterior','Status vs Meta','Meta'];
    const metas = { lead:20, ligacao:12, agendamento:4, visita:2, venda:1, carteira:3 };
    const funilRows = STAGE_ORDER.map((e, i) => {
      const n = totais[i];
      const prev = i > 0 ? totais[i-1]||1 : base;
      const meta = metas[e];
      const statusMeta = n >= meta ? '✅ Atingido' : n >= meta*0.7 ? '⚠️ Próximo' : '❌ Abaixo';
      return [etapas[e], n, (n/base*100).toFixed(1)+'%', i===0?'Base (100%)':((n/prev)*100).toFixed(1)+'%', statusMeta, meta];
    });
    RelatoriosModule._addTabela(ws1, funilHeaders, funilRows);
    funilRows.forEach((row, i) => {
      const cell = ws1.getRow(5+i).getCell(5);
      if (row[4].includes('✅')) RelatoriosModule._estilo(cell, E.verde);
      else if (row[4].includes('⚠️')) RelatoriosModule._estilo(cell, E.atencao);
      else RelatoriosModule._estilo(cell, E.alerta);
    });
    ws1.columns = [{width:18},{width:14},{width:14},{width:24},{width:18},{width:8}];

    /* ── ABA 2: CONVERSÃO POR FONTE ── */
    const ws2 = wb.addWorksheet('📌 Por Fonte', { properties: { tabColor: { argb: 'FF'+C.azul } } });
    ws2.views = [{ showGridLines: false }];
    RelatoriosModule._addTitulo(ws2, '📌 CONVERSÃO POR FONTE DE LEAD', 5);
    const porFonte = {};
    store.leads.forEach(l => {
      const f = l.fonte||'—';
      if (!porFonte[f]) porFonte[f] = { total:0, carteira:0, agend:0 };
      porFonte[f].total++;
      if (l.etapa==='carteira') porFonte[f].carteira++;
      if (['agendamento','visita','venda','carteira'].includes(l.etapa)) porFonte[f].agend++;
    });
    const fonteRows = Object.entries(porFonte).sort((a,b)=>b[1].total-a[1].total).map(([f,v]) => [
      f, v.total, v.agend, v.carteira, v.total>0?(v.carteira/v.total*100).toFixed(1)+'%':'—'
    ]);
    RelatoriosModule._addTabela(ws2, ['Fonte','Total Leads','Chegaram ao Agend.','Convertidos','Taxa Conv.'], fonteRows, 'headerSec');
    ws2.columns = [{width:28},{width:14},{width:22},{width:16},{width:14}];

    await RelatoriosModule._baixarExcelJS(wb, 'Amparar_Funil.xlsx');
  }

  /* ================================================================
     6. DESEMPENHO POR ESPECIALISTA
     ================================================================ */
  static async exportarDesempenho() {
    const C = RelatoriosModule._COR;
    const E = RelatoriosModule._estilos();
    const wb = RelatoriosModule._wb();

    // Calcular métricas
    const esp = {};
    store.usuarios.filter(u => u.perfil==='especialista').forEach(u => {
      esp[u.nome] = { nome:u.nome, sigla:u.sigla, filial:u.filial, metaV:u.meta_vendas||0, metaM:u.meta_mensalidade||0, lig:0, agend:0, visitas:0, vendas:0, mensal:0 };
    });
    store.ligacoes.forEach(l => { if (esp[l.esp]) esp[l.esp].lig++; });
    store.leads.forEach(l => {
      const e = esp[l.captador]; if (!e) return;
      if (['agendamento','visita','venda','carteira'].includes(l.etapa)) e.agend++;
      if (['visita','venda','carteira'].includes(l.etapa)) e.visitas++;
      if (l.etapa==='carteira') {
        e.vendas++;
        e.mensal += parseFloat((l.mensalidade||'0').replace(/[^0-9.,]/g,'').replace(',','.')) || 0;
      }
    });
    const espArr = Object.values(esp).sort((a,b)=>b.vendas-a.vendas);

    /* ── ABA 1: DESEMPENHO COMPLETO ── */
    const ws1 = wb.addWorksheet('🏆 Desempenho', { properties: { tabColor: { argb: 'FF'+C.vermelho } } });
    ws1.views = [{ showGridLines: false }];
    RelatoriosModule._addTitulo(ws1, '🏆 DESEMPENHO DOS ESPECIALISTAS', 11);
    const headers = ['Especialista','Filial','Ligações','Agendamentos','Visitas','Vendas','Meta Vendas','% Meta Vendas','Mensal. (R$)','Meta Mensal (R$)','% Meta Mensal'];
    const rows = espArr.map(e => [
      e.nome, e.filial, e.lig, e.agend, e.visitas, e.vendas,
      e.metaV, e.metaV ? (e.vendas/e.metaV*100).toFixed(1)+'%' : '—',
      e.mensal, e.metaM, e.metaM ? (e.mensal/e.metaM*100).toFixed(1)+'%' : '—',
    ]);
    RelatoriosModule._addTabela(ws1, headers, rows);
    // Colorir % meta vendas
    rows.forEach((row, i) => {
      const pct = parseFloat(row[7]) || 0;
      const cell = ws1.getRow(5+i).getCell(8);
      if (pct >= 100) RelatoriosModule._estilo(cell, E.verde);
      else if (pct >= 60) RelatoriosModule._estilo(cell, E.atencao);
      else if (pct > 0) RelatoriosModule._estilo(cell, E.alerta);
      // Moeda
      ws1.getRow(5+i).getCell(9).numFmt = '"R$"#,##0.00';
      ws1.getRow(5+i).getCell(10).numFmt = '"R$"#,##0.00';
    });
    ws1.columns = [{width:24},{width:20},{width:12},{width:16},{width:12},{width:12},{width:14},{width:16},{width:16},{width:18},{width:16}];

    /* ── ABA 2: RANKING ── */
    const ws2 = wb.addWorksheet('🥇 Ranking', { properties: { tabColor: { argb: 'FF'+C.amarelo } } });
    ws2.views = [{ showGridLines: false }];
    RelatoriosModule._addTitulo(ws2, '🥇 RANKING DE VENDAS', 5);
    const rankRows = espArr.map((e, i) => [
      i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1, e.nome, e.filial, e.vendas, e.mensal
    ]);
    RelatoriosModule._addTabela(ws2, ['Pos.','Especialista','Filial','Vendas','Mensalidade Total (R$)'], rankRows, 'header');
    rankRows.forEach((_, i) => {
      ws2.getRow(5+i).getCell(5).numFmt = '"R$"#,##0.00';
      if (i < 3) {
        const corMedalha = i===0?C.amarelo:i===1?'9CA3AF':'92400E';
        [1,2,3,4,5].forEach(c => {
          ws2.getRow(5+i).getCell(c).fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'FF'+corMedalha+'22' } };
          ws2.getRow(5+i).getCell(c).font = { name:'Calibri', size:10, bold:true };
        });
      }
    });
    ws2.columns = [{width:8},{width:24},{width:20},{width:12},{width:22}];

    await RelatoriosModule._baixarExcelJS(wb, 'Amparar_Desempenho.xlsx');
  }

  /* ================================================================
     7. RELATÓRIO COMPLETO
     ================================================================ */
  static async exportarCompleto() {
    const C = RelatoriosModule._COR;
    const E = RelatoriosModule._estilos();
    const wb = RelatoriosModule._wb();
    const etapas = { lead:'Lead', ligacao:'Ligação', agendamento:'Agendamento', visita:'Visita', venda:'Venda', carteira:'Carteira' };
    const agora = new Date().toLocaleString('pt-BR');

    /* ── CAPA ── */
    const wsCapa = wb.addWorksheet('📋 Capa', { properties: { tabColor: { argb: 'FF'+C.marinho } } });
    wsCapa.views = [{ showGridLines: false }];
    wsCapa.columns = [{width:40},{width:30}];

    wsCapa.addRow([]); wsCapa.lastRow.height = 20;
    const rTitle = wsCapa.addRow(['AMPARAR CRM']);
    rTitle.height = 50; wsCapa.mergeCells(rTitle.number,1,rTitle.number,2);
    RelatoriosModule._estilo(rTitle.getCell(1), { font:{name:'Calibri',size:28,bold:true,color:{argb:'FF'+C.branco}}, fill:{type:'pattern',pattern:'solid',fgColor:{argb:'FF'+C.marinho}}, alignment:{vertical:'middle',horizontal:'center'} });

    const rSub = wsCapa.addRow(['Relatório Completo — Painel Comercial']);
    rSub.height = 30; wsCapa.mergeCells(rSub.number,1,rSub.number,2);
    RelatoriosModule._estilo(rSub.getCell(1), { font:{name:'Calibri',size:16,bold:false,color:{argb:'FF'+C.branco}}, fill:{type:'pattern',pattern:'solid',fgColor:{argb:'FF'+C.vermelho}}, alignment:{vertical:'middle',horizontal:'center'} });

    wsCapa.addRow([]); wsCapa.lastRow.height = 20;

    const metaInfo = [
      ['Gerado em', agora],
      ['Usuário', store.usuarios[0]?.nome || 'Carlos Mendes'],
      ['Total de Leads', store.leads.length],
      ['Ligações Registradas', store.ligacoes.length],
      ['Associados na Carteira', store.leadsPorEtapa('carteira').length],
      ['Taxa de Conversão', (store.leadsPorEtapa('carteira').length/(store.leads.length||1)*100).toFixed(1)+'%'],
      ['Especialistas Ativos', store.usuarios.filter(u=>u.perfil==='especialista').length],
    ];
    metaInfo.forEach(([k,v]) => {
      const row = wsCapa.addRow([k, v]);
      row.height = 22;
      RelatoriosModule._estilo(row.getCell(1), { font:{name:'Calibri',size:11,bold:true,color:{argb:'FF'+C.marinho}}, alignment:{vertical:'middle',horizontal:'left',indent:1} });
      RelatoriosModule._estilo(row.getCell(2), { font:{name:'Calibri',size:11,color:{argb:'FF'+C.texto}}, alignment:{vertical:'middle'} });
    });

    wsCapa.addRow([]); wsCapa.lastRow.height = 20;
    const rConteudo = wsCapa.addRow(['CONTEÚDO DESTE ARQUIVO']);
    rConteudo.height = 24; wsCapa.mergeCells(rConteudo.number,1,rConteudo.number,2);
    RelatoriosModule._estilo(rConteudo.getCell(1), E.secao);
    ['📊 Resumo Geral','📋 Leads','📞 Ligações','💰 Vendas','👛 Carteira','🎂 Aniversariantes','🔻 Funil','🏆 Desempenho'].forEach((s,i) => {
      const row = wsCapa.addRow([`${i+1}. ${s}`, '→ ver aba']);
      row.height = 18;
      row.getCell(1).font = { name:'Calibri', size:10, color:{argb:'FF'+C.texto} };
      row.getCell(2).font = { name:'Calibri', size:10, color:{argb:'FF'+C.cinza}, italic:true };
    });
    wsCapa.addRow(['', 'Beyond Bits Tecnologia © 2026']);
    wsCapa.lastRow.getCell(2).font = { name:'Calibri', size:9, italic:true, color:{argb:'FF'+C.cinza} };

    /* ── RESUMO GERAL ── */
    const wsR = wb.addWorksheet('📊 Resumo Geral', { properties:{ tabColor:{ argb:'FF'+C.marinho } } });
    wsR.views = [{ showGridLines:false }];
    RelatoriosModule._addTitulo(wsR, '📊 RESUMO GERAL DO FUNIL', 6);
    const totais = STAGE_ORDER.map(e => store.leadsPorEtapa(e).length);
    const base = totais[0]||1;
    const resRows = STAGE_ORDER.map((e,i) => [
      etapas[e], totais[i], (totais[i]/base*100).toFixed(1)+'%',
      i===0?'—':((totais[i]/(totais[i-1]||1))*100).toFixed(1)+'%',
      i===0?100:Math.round(totais[i]/(totais[i-1]||1)*100),
    ]);
    RelatoriosModule._addTabela(wsR, ['Etapa','Total','% Base','Conversão','Score'], resRows);
    wsR.columns = [{width:18},{width:10},{width:12},{width:16},{width:10}];

    /* ── TODOS OS LEADS ── */
    const wsL = wb.addWorksheet('📋 Leads', { properties:{ tabColor:{ argb:'FF3B82F6' } } });
    wsL.views = [{ showGridLines:false, state:'frozen', ySplit:4 }];
    RelatoriosModule._addTitulo(wsL, `📋 TODOS OS LEADS — ${store.leads.length} registros`, 12);
    const lHeaders = ['ID','Nome','Telefone','Etapa','Fonte','Captador','Tentativas','Tags','Placa','FIPE','Mensalidade Est.','Obs.'];
    const lRows = store.leads.map(l => [l.id,l.nome,l.tel,etapas[l.etapa]||l.etapa,l.fonte||'',l.captador||'',l.tentativas,(l.tags||[]).join(', '),l.placa||'',l.fipe||'',l.mensalidadeEst||'',l.obs||'']);
    RelatoriosModule._addTabela(wsL, lHeaders, lRows);
    wsL.columns = [{width:16},{width:22},{width:16},{width:16},{width:22},{width:18},{width:12},{width:16},{width:10},{width:12},{width:16},{width:28}];

    /* ── LIGAÇÕES ── */
    if (store.ligacoes.length) {
      const wsLig = wb.addWorksheet('📞 Ligações', { properties:{ tabColor:{ argb:'FF'+C.verde } } });
      wsLig.views = [{ showGridLines:false }];
      RelatoriosModule._addTitulo(wsLig, `📞 LIGAÇÕES — ${store.ligacoes.length} registros`, 7);
      const ligRows = store.ligacoes.map(l => [l.lead,l.tel,l.resultado||'',l.tentativa||0,l.esp||'',l.hora||'',l.data||'']);
      RelatoriosModule._addTabela(wsLig, ['Lead','Telefone','Resultado','Tentativa','Especialista','Hora','Data'], ligRows);
      wsLig.columns = [{width:22},{width:16},{width:24},{width:12},{width:20},{width:8},{width:12}];
    }

    /* ── VENDAS / CARTEIRA ── */
    const carteira = store.leads.filter(l=>l.etapa==='carteira');
    if (carteira.length) {
      const wsV = wb.addWorksheet('💰 Vendas', { properties:{ tabColor:{ argb:'FF'+C.verde } } });
      wsV.views = [{ showGridLines:false }];
      RelatoriosModule._addTitulo(wsV, `💰 VENDAS / CARTEIRA — ${carteira.length} associados`, 10);
      const vRows = carteira.map(l => [l.id,l.nome,l.tel,l.placa||'',l.fipe||'',l.mensalidade||l.mensalidadeEst||'',l.adesao||'',l.dataVenda||'',l.aniversario||'',l.captador||'']);
      RelatoriosModule._addTabela(wsV, ['ID','Nome','Telefone','Placa','FIPE','Mensalidade','Adesão','Data Venda','Aniversário','Captador'], vRows);
      wsV.columns = [{width:16},{width:22},{width:16},{width:10},{width:12},{width:16},{width:14},{width:14},{width:14},{width:18}];

      /* Aniversariantes */
      const wsA = wb.addWorksheet('🎂 Aniversariantes', { properties:{ tabColor:{ argb:'FF'+C.vermelho } } });
      wsA.views = [{ showGridLines:false }];
      const hoje = new Date();
      const anivs = carteira.filter(l=>l.aniversario).map(l => {
        const d = new Date(l.aniversario);
        const prox = new Date(hoje.getFullYear(), d.getMonth(), d.getDate());
        if (prox < hoje) prox.setFullYear(hoje.getFullYear()+1);
        return { ...l, dias: Math.ceil((prox-hoje)/86400000), fmt: d.toLocaleDateString('pt-BR') };
      }).sort((a,b)=>a.dias-b.dias);
      RelatoriosModule._addTitulo(wsA, '🎂 ANIVERSARIANTES', 4);
      RelatoriosModule._addTabela(wsA, ['Nome','Telefone','Data Aniversário','Dias Restantes'], anivs.map(l=>[l.nome,l.tel,l.fmt,l.dias]));
      wsA.columns = [{width:24},{width:16},{width:18},{width:16}];
    }

    /* ── DESEMPENHO ── */
    const esp = {};
    store.usuarios.filter(u=>u.perfil==='especialista').forEach(u => { esp[u.nome]={nome:u.nome,filial:u.filial,metaV:u.meta_vendas||0,lig:0,agend:0,vendas:0,mensal:0}; });
    store.ligacoes.forEach(l => { if(esp[l.esp]) esp[l.esp].lig++; });
    store.leads.forEach(l => {
      const e=esp[l.captador]; if(!e) return;
      if(['agendamento','visita','venda','carteira'].includes(l.etapa)) e.agend++;
      if(l.etapa==='carteira') { e.vendas++; e.mensal+=parseFloat((l.mensalidade||'0').replace(/[^0-9.,]/g,'').replace(',','.'))||0; }
    });
    const wsD = wb.addWorksheet('🏆 Desempenho', { properties:{ tabColor:{ argb:'FF'+C.amarelo } } });
    wsD.views = [{ showGridLines:false }];
    RelatoriosModule._addTitulo(wsD, '🏆 DESEMPENHO DOS ESPECIALISTAS', 7);
    const dRows = Object.values(esp).sort((a,b)=>b.vendas-a.vendas).map((e,i) => [
      i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1, e.nome, e.filial, e.lig, e.agend, e.vendas, e.mensal
    ]);
    RelatoriosModule._addTabela(wsD, ['Pos.','Especialista','Filial','Ligações','Agendamentos','Vendas','Mensalidade (R$)'], dRows, 'header');
    dRows.forEach((_,i) => { wsD.getRow(5+i).getCell(7).numFmt = '"R$"#,##0.00'; });
    wsD.columns = [{width:8},{width:24},{width:20},{width:12},{width:16},{width:12},{width:18}];

    await RelatoriosModule._baixarExcelJS(wb, 'Amparar_Relatorio_Completo.xlsx');
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
  /* AJUSTE 3: Painel de performance/comissões do usuário logado */
  static renderMinhaPerformance() {
    const $c = $('#minha-performance-content');
    if (!$c.length) return;
    const u = store.usuarios[0];
    if (!u || !u.meta_vendas) { $c.html('<p class="text-muted small">Sem metas configuradas para este perfil.</p>'); return; }
    $('#perf-usuario-nome').text(u.nome);

    const vendasReais = store.leadsPorEtapa('carteira').filter(l => l.captador === u.nome).length;
    const mensal      = u.comissoes?.mes_atual || 0;
    const metaVendas  = u.meta_vendas || 1;
    const metaMensal  = u.meta_mensalidade || 1;
    const pctVendas   = Math.min(Math.round(vendasReais / metaVendas * 100), 100);
    const pctMensal   = Math.min(Math.round(mensal / metaMensal * 100), 100);
    const corV        = pctVendas  >= 100 ? '#059669' : pctVendas  >= 60 ? '#D97706' : '#DC2626';
    const corM        = pctMensal  >= 100 ? '#059669' : pctMensal  >= 60 ? '#D97706' : '#DC2626';

    const historico = (u.comissoes?.historico || []).map(h =>
      `<div class="d-flex align-items-center gap-2 mb-1">
        <span style="width:30px;font-size:11px;color:#6B7280;">${h.mes}</span>
        <div style="flex:1;background:#F3F4F6;border-radius:99px;height:8px;">
          <div style="width:${Math.min(Math.round(h.valor/metaMensal*100),100)}%;background:#1B6B3A;height:8px;border-radius:99px;"></div>
        </div>
        <span style="font-size:11px;font-weight:600;width:70px;text-align:right;">R$${h.valor.toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>
      </div>`
    ).join('');

    $c.html(`
      <div class="row g-3">
        <div class="col-md-6">
          <div class="kpi-card flex-column align-items-start gap-1">
            <div class="kpi-lbl fw-semibold">🏆 Vendas do Mês</div>
            <div style="font-size:28px;font-weight:800;color:${corV};font-family:'JetBrains Mono';">${vendasReais} <span style="font-size:14px;color:#9CA3AF;">/ ${metaVendas}</span></div>
            <div style="width:100%;background:#F3F4F6;border-radius:99px;height:8px;">
              <div style="width:${pctVendas}%;background:${corV};height:8px;border-radius:99px;transition:width .5s;"></div>
            </div>
            <div style="font-size:12px;color:${corV};">${pctVendas}% da meta${pctVendas>=100?' ✅':''}</div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="kpi-card flex-column align-items-start gap-1">
            <div class="kpi-lbl fw-semibold">💰 Mensalidade Acumulada</div>
            <div style="font-size:22px;font-weight:800;color:${corM};font-family:'JetBrains Mono';">R$${mensal.toLocaleString('pt-BR',{minimumFractionDigits:2})} <span style="font-size:12px;color:#9CA3AF;">/ R$${metaMensal.toLocaleString('pt-BR',{minimumFractionDigits:2})}</span></div>
            <div style="width:100%;background:#F3F4F6;border-radius:99px;height:8px;">
              <div style="width:${pctMensal}%;background:${corM};height:8px;border-radius:99px;transition:width .5s;"></div>
            </div>
            <div style="font-size:12px;color:${corM};">${pctMensal}% da meta${pctMensal>=100?' ✅':''}</div>
          </div>
        </div>
        ${historico ? `<div class="col-12"><div class="kpi-card flex-column align-items-start gap-2"><div class="kpi-lbl fw-semibold">📊 Histórico Mensal</div>${historico}</div></div>` : ''}
      </div>`);
  }
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
