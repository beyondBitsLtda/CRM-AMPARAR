/* ============================================================
   AMPARAR CRM — js/components/KanbanCard.js   v2.0
   Componente de card do Kanban.
   Beyond Bits Tecnologia © 2026
   ============================================================ */
'use strict';

class KanbanCard {
  constructor(lead, color) {
    this.lead  = lead;
    this.color = color;
  }

  render() {
    const l = this.lead;
    const tagsHtml = (l.tags || []).map(t => {
      const c = TAG_CONFIG[t] || { cls: '', label: t };
      return `<span class="amp-tag ${c.cls}">${c.label}</span>`;
    }).join('');

    const tentBadge = (l.etapa === 'ligacao' || l.tentativas > 0)
      ? `<span class="tent-badge${l.tentativas >= 25 ? ' tent-warn' : ''}">${l.tentativas}</span>`
      : '';

    return $('<div>').addClass('k-card').css('border-left-color', this.color)
      .html(`
        <div class="k-card-head">
          <span class="k-card-id">${Utils.escHtml(l.id)}</span>
          ${tentBadge}
        </div>
        <div class="k-card-nome">${Utils.escHtml(l.nome)}</div>
        <div class="k-card-tel"><i class="bi bi-telephone-fill"></i> ${Utils.escHtml(l.tel)}</div>
        ${tagsHtml ? `<div class="k-card-tags">${tagsHtml}</div>` : ''}
        <div class="k-card-foot">
          <span class="k-fonte">${Utils.escHtml(l.fonte || '—')}</span>
          <span class="k-captador">${Utils.escHtml(l.captador || '')}</span>
        </div>
      `)
      .on('click', () => FunilModule.abrirDetalhe(l.id));
  }
}
