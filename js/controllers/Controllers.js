/* ============================================================
   AMPARAR CRM — js/controllers/Controllers.js   v2.0
   Beyond Bits Tecnologia © 2026
   ============================================================ */
'use strict';

class SidebarController {
  static alternar() {
    if ($(window).width() <= 768) {
      store.mobileSidebarOpen = !store.mobileSidebarOpen;
      $('#sidebar').toggleClass('sidebar-mobile-open', store.mobileSidebarOpen);
      $('#sidebar-backdrop').toggleClass('show', store.mobileSidebarOpen);
    } else {
      store.sidebarCollapsed = !store.sidebarCollapsed;
      $('#sidebar').toggleClass('sidebar-collapsed', store.sidebarCollapsed);
      $('#app-main').toggleClass('main-expanded', store.sidebarCollapsed);
    }
  }
  static fecharMobile() {
    store.mobileSidebarOpen = false;
    $('#sidebar').removeClass('sidebar-mobile-open');
    $('#sidebar-backdrop').removeClass('show');
  }
}

class FonteSelect {
  static atualizar(el) {
    const val = $(el).val();
    const f = FONTES_LEAD.find(x => x.value === val);
    const $tip = $(el).closest('.mb-3').find('.fonte-desc');
    if ($tip.length && f) $tip.text(f.desc).fadeIn(200);
    else if ($tip.length) $tip.fadeOut(200);
  }
}

class DateTimeHelper {
  static inicializar() {
    const agora = Utils.getNowLocal();
    const hoje  = Utils.getTodayDate();
    $('input[type="datetime-local"]').each(function() { if (!$(this).val()) $(this).val(agora); });
    $('input[type="date"]').each(function() { if (!$(this).val()) $(this).val(hoje); });
  }
  static setNow(id) { $('#'+id).val(Utils.getNowLocal()); }
}

class SearchController {
  static init() {
    let timer;
    $('#header-search').on('input', function() {
      clearTimeout(timer);
      const q = $(this).val().trim();
      if (!q) { $('#search-results').hide(); return; }
      timer = setTimeout(() => SearchController.render(q), 200);
    });
    $(document).on('click', function(e) {
      if (!$(e.target).closest('.search-wrap').length) $('#search-results').hide();
    });
  }
  static render(q) {
    const results = store.pesquisar(q);
    const $box = $('#search-results');
    if (!results.length) { $box.hide(); return; }
    $box.html(results.map(l => `
      <div class="search-item" onclick="FunilModule.abrirDetalhe('${l.id}'); $('#search-results').hide(); $('#header-search').val('');">
        <div class="search-nome">${Utils.escHtml(l.nome)}</div>
        <div class="search-det">${l.id} · ${Utils.escHtml(l.etapa)} · ${Utils.escHtml(l.tel)}</div>
      </div>`).join('')).show();
  }
}

class NotifController {
  static atualizar() {
    const unread = store.notifications.filter(n => !n.read).length;
    const $badge = $('#notif-badge');
    if (unread > 0) { $badge.text(unread).show(); } else { $badge.hide(); }
  }
  static toggleDropdown() {
    const $d = $('#notif-dropdown');
    if ($d.hasClass('show')) { $d.removeClass('show'); return; }
    const list = store.notifications.slice(0,5);
    $d.html(list.length ? list.map(n => `
      <div class="notif-item${n.read?'':' unread'}">
        <div class="notif-msg">${Utils.escHtml(n.msg)}</div>
        <div class="notif-time">${n.time}</div>
      </div>`).join('') : '<div class="notif-empty">Nenhuma notificação</div>').addClass('show');
    store.marcarNotificacoesLidas();
    NotifController.atualizar();
    setTimeout(() => $(document).one('click', () => $d.removeClass('show')), 10);
  }
}

class ChecklistItem {
  static alternar(el) {
    $(el).toggleClass('done');
    $(el).find('.check-icon').html($(el).hasClass('done') ? '<i class="bi bi-check-lg"></i>' : '');
  }
}
