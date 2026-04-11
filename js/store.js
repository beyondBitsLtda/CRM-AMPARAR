/* ============================================================
   AMPARAR CRM — js/store.js   v2.0
   Beyond Bits Tecnologia © 2026
   ============================================================ */
'use strict';

class Store {
  constructor() {
    this.currentPage        = 'dashboard';
    this.sidebarCollapsed   = false;
    this.mobileSidebarOpen  = false;
    this.confirmCallback    = null;
    this.currentLead        = null;
    this.leadCounter        = 48;
    this.leads              = [];
    this.agendamentos       = [];
    this.ligacoes           = [];
    this.curriculos         = [];
    this.usuarios           = [];
    this.atividades         = [];
    this.notifications      = [];
    this.auditLog           = [];
    this.filiais            = [...FILIAIS];
    this.tags               = Object.keys(TAG_CONFIG);
  }

  inicializar() {
    this.leads      = INITIAL_LEADS.map(l => ({...l}));
    this.curriculos = INITIAL_CURRICULOS.map(c => ({...c}));
    this.usuarios   = INITIAL_USUARIOS.map(u => ({...u}));
    this.atividades = [...INITIAL_ATIVIDADES];
    this.auditLog   = [...AUDIT_LOG];
  }

  /* LEADS */
  adicionarLead(lead) { this.leads.unshift(lead); }
  buscarLead(id) { return this.leads.find(l => l.id === id) || null; }
  atualizarLead(id, campos) {
    const lead = this.buscarLead(id);
    if (!lead) return null;
    Object.assign(lead, campos);
    this._logAudit('Carlos Mendes', 'Dados do lead '+id, '—', JSON.stringify(campos));
    return lead;
  }
  avancarEtapa(lead, novaEtapa) {
    const anterior = lead.etapa;
    lead.etapa = novaEtapa;
    this._logAudit('Carlos Mendes', 'Etapa ('+lead.id+')', STAGE_CONFIG[anterior].label, STAGE_CONFIG[novaEtapa].label);
  }
  proximoLeadId() { this.leadCounter++; return Utils.gerarLeadId(this.leadCounter); }
  leadsPorEtapa(etapa) { return this.leads.filter(l => l.etapa === etapa); }

  /* ATIVIDADES */
  adicionarAtividade(icon, nome, det, extra, bg, color, tipo) {
    this.atividades.unshift({ icon, bg, color, nome, det: det+(extra?' • '+extra:''), hora: Utils.getHoraAtual(), data: Utils.getDataAtual(), esp:'Carlos Mendes', tipo });
  }
  adicionarLigacao(lead, resultado) {
    this.ligacoes.unshift({ lead: lead.nome, tel: lead.tel, resultado, tentativa: lead.tentativas, esp:'Carlos Mendes', hora: Utils.getHoraAtual(), data: Utils.getDataAtual() });
  }

  /* AGENDAMENTOS */
  adicionarAgendamento(ag) { this.agendamentos.push(ag); }

  /* CURRÍCULOS */
  adicionarCurriculo(c) {
    const maxId = Math.max(0, ...this.curriculos.map(x => x.id));
    c.id = maxId + 1;
    this.curriculos.push(c);
    return c;
  }
  removerCurriculo(id) { this.curriculos = this.curriculos.filter(c => c.id !== id); }
  buscarCurriculo(id) { return this.curriculos.find(c => c.id === id) || null; }
  atualizarCurriculo(id, campos) { const c = this.buscarCurriculo(id); if (c) Object.assign(c, campos); return c; }

  /* USUÁRIOS */
  adicionarUsuario(u) { this.usuarios.push(u); }

  /* NOTIFICAÇÕES */
  adicionarNotificacao(msg) {
    this.notifications.unshift({ msg, read: false, time: Utils.getHoraAtual() });
  }
  marcarNotificacoesLidas() { this.notifications.forEach(n => n.read = true); }

  /* AUDIT */
  _logAudit(usuario, campo, anterior, novo) {
    this.auditLog.unshift({ usuario, campo, anterior, novo, datahora: Utils.getDataAtual()+' '+Utils.getHoraAtual() });
  }

  /* PESQUISA GLOBAL */
  pesquisar(q) {
    if (!q || q.length < 2) return [];
    const t = q.toLowerCase();
    return this.leads.filter(l =>
      l.nome.toLowerCase().includes(t) ||
      l.tel.includes(t) ||
      l.id.toLowerCase().includes(t) ||
      (l.fonte||'').toLowerCase().includes(t)
    ).slice(0, 8);
  }
}

const store = new Store();
