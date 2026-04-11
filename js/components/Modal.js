/* ============================================================
   AMPARAR CRM — js/components/Modal.js   v2.0
   Controla abertura/fechamento dos modais .amp-modal
   Beyond Bits Tecnologia © 2026
   ============================================================ */
'use strict';

class Modal {
  static abrir(id) {
    const $el = $('#' + id);
    if (!$el.length) return;
    $el.addClass('show').css('display', 'flex');
    $('body').addClass('modal-open');
  }

  static fechar(id) {
    const $el = $('#' + id);
    if (!$el.length) return;
    $el.removeClass('show');
    setTimeout(() => {
      if (!$el.hasClass('show')) $el.css('display', 'none');
    }, 300);
    if (!$('.amp-modal.show').length) $('body').removeClass('modal-open');
  }

  static inicializarBackdrops() {
    $(document).on('click', '.amp-modal', function (e) {
      if ($(e.target).is('.amp-modal')) Modal.fechar($(this).attr('id'));
    });
  }

  static trocarAba(tabId, context) {
    const $modal = $(context).closest('.amp-modal-content');
    $modal.find('.lead-tab').removeClass('active');
    $modal.find('.lead-tab-pane').removeClass('active');
    $modal.find(`[data-tab="${tabId}"]`).addClass('active');
    $('#tab-' + tabId).addClass('active');
  }
}
