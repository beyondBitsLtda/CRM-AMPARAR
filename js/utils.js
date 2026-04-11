/* ============================================================
   AMPARAR CRM — js/utils.js   v2.0
   Beyond Bits Tecnologia © 2026
   ============================================================ */
'use strict';

const Utils = {
  escHtml(str) {
    if (typeof str !== 'string') return str || '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },
  getNowLocal() {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset()*60000).toISOString().slice(0,16);
  },
  getTodayDate() { return new Date().toISOString().slice(0,10); },
  getHoraAtual() {
    const n = new Date();
    return n.getHours().toString().padStart(2,'0') + ':' + n.getMinutes().toString().padStart(2,'0');
  },
  getDataAtual() { return new Date().toLocaleDateString('pt-BR').replace('/20','/'); },
  formatDate(s) {
    if (!s) return '';
    try { const d=new Date(s); return d.toLocaleDateString('pt-BR')+' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}); }
    catch { return s; }
  },
  formatDateShort(s) {
    if (!s) return '';
    try { return new Date(s).toLocaleDateString('pt-BR'); } catch { return s; }
  },
  formatMoney(v) {
    if (!v) return '';
    const n = parseFloat(v.toString().replace(/[^0-9.,]/g,'').replace(',','.'));
    return isNaN(n) ? v : 'R$ '+n.toLocaleString('pt-BR',{minimumFractionDigits:2});
  },
  copyTel(tel) {
    const num = tel.replace(/\D/g,'');
    if (navigator.clipboard) navigator.clipboard.writeText(num);
    else { const e=document.createElement('textarea'); e.value=num; document.body.appendChild(e); e.select(); document.execCommand('copy'); document.body.removeChild(e); }
  },
  gerarLeadId(n) { return 'AMP-2026-' + n.toString().padStart(4,'0'); },
  calcIdade(dataNasc) {
    if (!dataNasc) return '—';
    const hoje=new Date(), nasc=new Date(dataNasc);
    let idade=hoje.getFullYear()-nasc.getFullYear();
    const m=hoje.getMonth()-nasc.getMonth();
    if (m<0||(m===0&&hoje.getDate()<nasc.getDate())) idade--;
    return idade+' anos';
  },
};
