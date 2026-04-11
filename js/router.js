/* ============================================================
   AMPARAR CRM — js/router.js   v2.0
   Beyond Bits Tecnologia © 2026
   ============================================================ */
'use strict';

class Router {
  static _navMap = {
    dashboard:'nav-dashboard', funil:'nav-funil', agenda:'nav-agenda',
    historico:'nav-historico', relatorios:'nav-relatorios', curriculos:'nav-curriculos',
    configuracoes:'nav-configuracoes',
  };

  static ir(page) {
    store.currentPage = page;
    $('.amp-page').removeClass('active');
    $('.nav-link').removeClass('active');
    $('#page-'+page).addClass('active');
    const navId = Router._navMap[page];
    if (navId) $('#'+navId).addClass('active');
    SidebarController.fecharMobile();
    window.scrollTo(0,0);
  }

  static inicializar() { Router.ir('dashboard'); }
}
