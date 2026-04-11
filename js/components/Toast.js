/* ============================================================
   AMPARAR CRM — js/components/Toast.js   v2.0
   Notificações visuais (toasts). Uso: Toast.show('msg','success')
   Beyond Bits Tecnologia © 2026
   ============================================================ */
'use strict';

class Toast {
  static show(msg, tipo = '') {
    const $c = $('#toast-container');
    if (!$c.length) return;
    const icons = { success:'✅', warning:'⚠️', info:'ℹ️', danger:'❌' };
    const $t = $('<div>').addClass('amp-toast').addClass(tipo ? 'toast-'+tipo : '')
      .html(`<span class="toast-icon">${icons[tipo]||''}</span><span>${msg}</span>`);
    $c.append($t);
    setTimeout(() => $t.addClass('show'), 10);
    setTimeout(() => { $t.removeClass('show'); setTimeout(() => $t.remove(), 350); }, 3000);
  }
}
