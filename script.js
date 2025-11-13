// ====== Temel Ayarlar ======
const PASSWORD = '12345';
const STORAGE = {
  visits: 'intra.visits',
  links: 'intra.links',
  session: 'intra.session',
  admin: 'intra.admin',
  logo: 'intra.logo',
  pol: 'intra.pol',
  pod: 'intra.pod'
};

// ====== Yardımcı Fonksiyonlar ======
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const load = (k, f) => {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? f;
  } catch {
    return f;
  }
};
const niceDate = d => d ? new Date(d).toLocaleDateString('tr-TR') : '';

function sanitizeNotes(s) {
  return String(s || '')
    .replace(/\u00A0/g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .normalize('NFC');
}

// ====== Varsayılan POL/POD Listeleri ======
const DEFAULT_POL_LIST = ['AMBARLI', 'ANTALYA', 'ASYAPORT', 'DERINCE', 'GEMLİK', 'ISKENDERUN', 'IZMIR', 'MERSIN', 'TRABZON']
  .sort((a, b) => a.localeCompare(b, 'tr-TR'));

const DEFAULT_POD_LIST = (function() {
  const raw = [
    'ABIDJAN', 'AQABA', 'AJMAN', 'ALTAMIRA', 'AMBARLI', 'ANTWERP', 'BUSAN', 'CALLAO', 'CARTAGENA', 'CASABLANCA', 'CAUCEDO',
    'CHITTAGONG', 'DJIBOUTI', 'DURBAN', 'FELIXSTOWE', 'FOS SUR MER', 'GEBZE', 'GEMLIK', 'GUAYAQUIL', 'HAMAD', 'HAMBURG',
    'HAIPHONG', 'HONG KONG', 'HOUSTON', 'ISKENDERUN', 'ITAPOA', 'IZMIR', 'JAKARTA', 'JEBEL ALI', 'JEDDAH', 'KAOHSIUNG',
    'KARACHI', 'KOPER', 'LAEM CHABANG', 'LEIXOES', 'LUANDA', 'MANILA', 'MANAUS', 'MANZANILLO', 'MERSIN', 'MISURATA',
    'MUNDRA', 'NEW YORK', 'NHAVA SHEVA', 'ORAN', 'PARANAGUA', 'PIRAEUS', 'POINTE NOIRE', 'PORT EVERGLADES', 'PORT KELANG',
    'QINGDAO', 'RAVENNA', 'RIO DE JANEIRO', 'RIO GRANDE', 'SALALAH', 'SALERNO', 'SALVADOR', 'SAN ANTONIO', 'SANTA MARTA',
    'SANTOS', 'SAVANNAH', 'SHANGHAI', 'SHARJAH', 'SHUAIBA', 'SINGAPORE', 'SOHAR', 'SUAPE', 'TAICHUNG', 'TERNEUZEN',
    'TIANJIN XINGANG', 'UMM QASR', 'VERACRUZ', 'VITORIA', 'XIAMEN', 'ZHANGJIAGANG'
  ];
  return Array.from(new Set(raw)).sort((a, b) => a.localeCompare(b, 'tr-TR'));
})();

// LocalStorage'dan okunan güncel listeler
let polList = load(STORAGE.pol, null) || DEFAULT_POL_LIST.slice();
let podList = load(STORAGE.pod, null) || DEFAULT_POD_LIST.slice();

// ====== ID Üretimi ve Meta Düzeltme ======
function nextId(list) {
  const max = (list || []).reduce((m, v) => {
    const n = String(v?.id || '').match(/^MAF(\d{4})$/)?.[1];
    return Math.max(m, n ? Number(n) : 0);
  }, 0);
  const num = max + 1;
  return 'MAF' + String(num).padStart(4, '0');
}

// ensureVisitMeta artık gerekli değil, Supabase'de veri yapısı zaten doğru
// Eski kod uyumluluğu için basit bir wrapper
async function ensureVisitMeta() {
  return await getVisits();
}

// ====== Giriş Sistemi ======
const gate = $('#gate');
const loginBtn = $('#loginBtn');
const pw = $('#pw');
const pwErr = $('#pwErr');

function allow() {
  gate.style.display = 'none';
  sessionStorage.setItem(STORAGE.session, 'ok');
}

loginBtn.addEventListener('click', () => {
  if (pw.value === PASSWORD) {
    allow();
  } else {
    pwErr.style.display = 'block';
    pw.select();
  }
});

pw.addEventListener('keypress', e => {
  if (e.key === 'Enter') loginBtn.click();
});

if (sessionStorage.getItem(STORAGE.session) === 'ok') {
  gate.style.display = 'none';
}

// ====== Saat ve Yazdır ======
const clock = $('#clock');
function tick() {
  clock.textContent = new Date().toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
}
setInterval(tick, 1000);
tick();

$('#printBtn').addEventListener('click', () => window.print());

// ====== Admin Modu, Logo ve POL/POD Yönetimi ======
const adminToggle = $('#adminToggle');

function setBrandLogo(src) {
  const img = $('#brandLogo');
  const fb = $('#brandFallback');
  if (src) {
    img.src = src;
    img.style.display = 'inline-block';
    fb.style.display = 'none';
  } else {
    img.removeAttribute('src');
    img.style.display = 'none';
    fb.style.display = 'inline-block';
  }
}
setBrandLogo(load(STORAGE.logo, '') || null);

function renderPolPodAdmin() {
  const polArea = $('#polAdmin');
  const podArea = $('#podAdmin');
  if (!polArea || !podArea) return;
  polArea.value = (polList || []).join('\n');
  podArea.value = (podList || []).join('\n');
}

function setAdmin(on) {
  adminToggle.checked = !!on;
  save(STORAGE.admin, !!on);
  $('#linkAdd').style.display = on ? 'inline-block' : 'none';
  $('#linkEdit').style.display = 'none';
  $('#logoAdmin').style.display = on ? 'block' : 'none';
  if (on) {
    renderPolPodAdmin();
  }
}
adminToggle.addEventListener('change', e => setAdmin(e.target.checked));
setAdmin(load(STORAGE.admin, false));

const logoFileEl = $('#logoFile');
if (logoFileEl) {
  logoFileEl.addEventListener('change', e => {
    const f = e.target.files?.[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      save(STORAGE.logo, rd.result);
      setBrandLogo(rd.result);
      alert('Logo kaydedildi.');
    };
    rd.readAsDataURL(f);
  });
}

// POL/POD admin kayıt
$('#polpodSave')?.addEventListener('click', () => {
  const polArea = $('#polAdmin');
  const podArea = $('#podAdmin');
  if (!polArea || !podArea) return;
  const polLines = polArea.value.split('\n').map(s => s.trim()).filter(Boolean);
  const podLines = podArea.value.split('\n').map(s => s.trim()).filter(Boolean);
  polList = Array.from(new Set(polLines)).sort((a, b) => a.localeCompare(b, 'tr-TR'));
  podList = Array.from(new Set(podLines)).sort((a, b) => a.localeCompare(b, 'tr-TR'));
  save(STORAGE.pol, polList);
  save(STORAGE.pod, podList);
  filterAndFill(polSelect, polList, polSearch.value);
  filterAndFill(podSelect, podList, podSearch.value);
  alert('POL/POD listeleri güncellendi.');
});

$('#polpodReset')?.addEventListener('click', () => {
  polList = DEFAULT_POL_LIST.slice();
  podList = DEFAULT_POD_LIST.slice();
  save(STORAGE.pol, polList);
  save(STORAGE.pod, podList);
  renderPolPodAdmin();
  filterAndFill(polSelect, polList, polSearch.value);
  filterAndFill(podSelect, podList, podSearch.value);
  alert('Varsayılan POL/POD listesine dönüldü.');
});

// ====== Hızlı Bağlantılar ======
const linkListEl = $('#linkList');

function renderLinks() {
  const links = load(STORAGE.links, [
    { text: 'Outlook', url: 'https://outlook.office.com' },
    { text: 'CMA CGM eBusiness', url: 'https://www.cma-cgm.com/eBusiness' },
    { text: 'Maersk', url: 'https://www.maersk.com/' }
  ]);
  linkListEl.innerHTML = '';
  links.forEach((l, i) => {
    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.justifyContent = 'space-between';
    li.style.padding = '8px 0';
    li.style.borderBottom = '1px dashed var(--border)';
    li.innerHTML =
      `<a class="link" target="_blank" rel="noopener" href="${l.url}">${l.text}</a>
       <div style="${adminToggle.checked ? '' : 'display:none'}">
         <button class="linkEditBtn" data-i="${i}">Düzenle</button>
         <button class="linkDelBtn" data-i="${i}">Sil</button>
       </div>`;
    linkListEl.appendChild(li);
  });
}
renderLinks();

$('#linkAdd').addEventListener('click', () => {
  $('#linkEdit').style.display = 'block';
  $('#linkText').value = '';
  $('#linkUrl').value = '';
  $('#linkText').focus();
  $('#linkSave').onclick = () => {
    const links = load(STORAGE.links, []);
    links.push({ text: $('#linkText').value || 'Bağlantı', url: $('#linkUrl').value || '#' });
    save(STORAGE.links, links);
    $('#linkEdit').style.display = 'none';
    renderLinks();
  };
});

linkListEl.addEventListener('click', e => {
  const i = e.target.dataset?.i;
  if (i == null) return;
  const links = load(STORAGE.links, []);
  if (e.target.classList.contains('linkDelBtn')) {
    links.splice(i, 1);
    save(STORAGE.links, links);
    renderLinks();
  } else if (e.target.classList.contains('linkEditBtn')) {
    $('#linkEdit').style.display = 'block';
    $('#linkText').value = links[i].text;
    $('#linkUrl').value = links[i].url;
    $('#linkSave').onclick = () => {
      links[i].text = $('#linkText').value;
      links[i].url = $('#linkUrl').value;
      save(STORAGE.links, links);
      $('#linkEdit').style.display = 'none';
      renderLinks();
    };
  }
});

// ====== Chip Sistemi (Etiketler ve Limanlar) ======
function setupChips(inputEl, chipsEl) {
  const arr = [];
  
  function render() {
    chipsEl.innerHTML = '';
    arr.forEach((t, idx) => {
      const c = document.createElement('span');
      c.className = 'chip';
      c.innerHTML = `${t} <button data-i="${idx}" title="Sil">✕</button>`;
      chipsEl.appendChild(c);
    });
  }
  
  inputEl.addEventListener('keypress', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const v = inputEl.value.trim();
      if (v && !arr.includes(v)) {
        arr.push(v);
        render();
      }
      inputEl.value = '';
    }
  });
  
  chipsEl.addEventListener('click', e => {
    const i = e.target.dataset?.i;
    if (i == null) return;
    arr.splice(+i, 1);
    render();
  });
  
  return {
    get: () => arr.slice(),
    set: (a) => {
      a = a || [];
      arr.splice(0, arr.length);
      a.forEach(x => arr.push(x));
      render();
    }
  };
}

const portChip = setupChips($('#portInput'), $('#portChips'));
const tagChip = setupChips($('#tagInput'), $('#tagChips'));

// ====== POL/POD Doldurma ve Filtreleme ======
const polSelect = $('#polSelect');
const polSearch = $('#polSearch');
const podSelect = $('#podSelect');
const podSearch = $('#podSearch');

function fillOptions(sel, items) {
  sel.innerHTML = '';
  items.forEach(v => {
    const o = document.createElement('option');
    o.textContent = v;
    sel.appendChild(o);
  });
}

function normalize(s) {
  return String(s || '').toLocaleUpperCase('tr-TR');
}

function filterAndFill(sel, items, q) {
  const qq = normalize(q).trim();
  const out = qq ? items.filter(x => normalize(x).includes(qq)) : items;
  fillOptions(sel, out);
  if (out.length) sel.selectedIndex = 0;
}

filterAndFill(polSelect, polList, '');
filterAndFill(podSelect, podList, '');

polSearch.addEventListener('input', () => filterAndFill(polSelect, polList, polSearch.value));
podSearch.addEventListener('input', () => filterAndFill(podSelect, podList, podSearch.value));

$('#polAll').addEventListener('click', () => {
  Array.from(polSelect.options).forEach(o => o.selected = true);
  polSelect.focus();
});

$('#polClear').addEventListener('click', () => {
  Array.from(polSelect.options).forEach(o => o.selected = false);
  polSearch.value = '';
  filterAndFill(polSelect, polList, '');
  polSelect.focus();
});

$('#podAll').addEventListener('click', () => {
  Array.from(podSelect.options).forEach(o => o.selected = true);
  podSelect.focus();
});

$('#podClear').addEventListener('click', () => {
  Array.from(podSelect.options).forEach(o => o.selected = false);
  podSearch.value = '';
  filterAndFill(podSelect, podList, '');
  podSelect.focus();
});

$('#addRoute').addEventListener('click', () => {
  const selPol = Array.from(polSelect.selectedOptions).map(o => o.value).filter(Boolean);
  const selPod = Array.from(podSelect.selectedOptions).map(o => o.value).filter(Boolean);
  const fallbackPol = polSearch.value.trim() ? [polSearch.value.trim()] : [];
  const fallbackPod = podSearch.value.trim() ? [podSearch.value.trim()] : [];
  const pols = selPol.length ? selPol : fallbackPol;
  const pods = selPod.length ? selPod : fallbackPod;
  if (!pols.length || !pods.length) {
    alert('POL ve POD seçiniz ya da yazınız.');
    return;
  }
  const cur = new Set(portChip.get());
  pols.forEach(p => pods.forEach(d => cur.add(`${p}→${d}`)));
  portChip.set(Array.from(cur));
});

// ====== Ziyaret Kayıtları ======
const visitTable = $('#visitTable tbody');

function getModes() {
  return $$('.mode').filter(x => x.checked).map(x => x.value);
}

function clearForm() {
  $('#cName').value = '';
  $('#cContact').value = '';
  $('#cPhone').value = '';
  $$('.mode').forEach(x => x.checked = false);
  $('#cStatus').value = 'Yeni';
  $('#cPriority').value = 'Normal';
  portChip.set([]);
  $('#cVolume').value = '';
  $('#cVolUnit').value = 'TEU';
  $('#needQuote').checked = false;
  $('#cVisit').value = '';
  $('#cFollow').value = '';
  tagChip.set([]);
  $('#cNotes').value = '';
  polSearch.value = '';
  podSearch.value = '';
  filterAndFill(polSelect, polList, '');
  filterAndFill(podSelect, podList, '');
}

async function renderCustomerLinks() {
  const list = await ensureVisitMeta();
  const latestByName = {};
  list.forEach(v => {
    if (!latestByName[v.name]) latestByName[v.name] = v;
  });
  const names = Object.keys(latestByName).sort((a, b) => a.localeCompare(b, 'tr-TR'));
  const ul = $('#customerLinks');
  ul.innerHTML = '';
  names.forEach(n => {
    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.justifyContent = 'space-between';
    li.style.padding = '6px 0';
    li.style.borderBottom = '1px dashed var(--border)';
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = n;
    a.addEventListener('click', ev => {
      ev.preventDefault();
      showVisitPDF(latestByName[n]);
    });
    li.appendChild(a);
    ul.appendChild(li);
  });
}

async function saveVisit(v) {
  try {
    // Veriyi hazırla (id otomatik oluşturulacak Supabase'de)
    const visitData = {
      ...v,
      baseNote: v.notes || '',
      updateNote: v.updateNote || ''
    };

    // Supabase'e kaydet
    const saved = await createVisit(visitData);
    
    // Başarılı
    await renderVisits();
    await renderCustomerLinks();
    clearForm();
    
    return saved;
  } catch (error) {
    console.error('Ziyaret kaydedilirken hata:', error);
    alert('Ziyaret kaydedilirken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
  }
}

async function renderVisits() {
  const list = await ensureVisitMeta();
  const q = $('#q').value.trim().toLowerCase();
  const fMode = $('#fMode').value;
  const fStatus = $('#fStatus').value;
  const fPort = $('#fPort').value.trim().toLowerCase();
  const fMinVol = Number($('#fMinVol').value || 0);
  const fFrom = $('#fFrom').value ? new Date($('#fFrom').value) : null;
  const fTo = $('#fTo').value ? new Date($('#fTo').value) : null;

  const filt = list.filter(it => {
    if (q && !(String(it.name || '').toLowerCase().includes(q) || String(it.baseNote || it.notes || '').toLowerCase().includes(q))) return false;
    if (fMode && !(it.modes || []).includes(fMode)) return false;
    if (fStatus && it.status !== fStatus) return false;
    if (fPort) {
      const ports = (it.ports || []).join(',').toLowerCase();
      if (!ports.includes(fPort)) return false;
    }
    const vol = Number(it.volume || 0);
    if (fMinVol && !(vol >= fMinVol)) return false;
    const vd = it.visitDate ? new Date(it.visitDate) : null;
    if (fFrom && vd && vd < fFrom) return false;
    if (fTo && vd && vd > fTo) return false;
    return true;
  });

  visitTable.innerHTML = '';
  filt.forEach((v, idx) => {
    const tr = document.createElement('tr');
    const mod = (v.modes || []).join('/');
    const ports = (v.ports || []).join(' · ');
    const vol = v.volume ? (v.volume + ' ' + (v.volUnit || '')) : '';
    const follow = v.followDate ? niceDate(v.followDate) : '';
    const upd = v.createdAt ? niceDate(v.createdAt) : '';
    tr.innerHTML =
      `<td><strong>${v.id ? v.id.substring(0, 8) : ''}</strong></td>
       <td><span class="pill">${niceDate(v.visitDate)}</span></td>
       <td><strong>${v.name || ''}</strong><div class="muted">${v.contact || ''}${v.phone ? ' · ' + v.phone : ''}</div></td>
       <td>${mod}</td>
       <td>${ports}</td>
       <td>${vol}</td>
       <td>${v.status || ''}${v.priority === 'Yüksek' ? ' 🔥' : ''}</td>
       <td>${follow}</td>
       <td>${upd}</td>
       <td>
         <button class="rowToggle" data-id="${v.id}">Detay</button>
         <button class="edit" data-id="${v.id}" data-index="${idx}">Güncelle</button>
         <button class="pdf" data-id="${v.id}">PDF</button>
         <button class="del" data-id="${v.id}">Sil</button>
       </td>`;
    visitTable.appendChild(tr);

    const tr2 = document.createElement('tr');
    const notesHtml = sanitizeNotes(v.notes || '').replace(/\n/g, '<br>') || '<span class="muted">Not yok</span>';
    tr2.innerHTML =
      `<td colspan="10">
         <div style="margin-top:6px">${notesHtml}</div>
       </td>`;
    tr2.style.display = 'none';
    visitTable.appendChild(tr2);
  });
}

// Tablo aksiyonları
visitTable.addEventListener('click', async e => {
  const visitId = e.target.dataset?.id;
  const index = e.target.dataset?.index;
  if (!visitId) return;
  
  const list = await ensureVisitMeta();
  const visit = list.find(v => v.id === visitId);
  if (!visit) return;
  
  if (e.target.classList.contains('del')) {
    if (confirm(`"${visit.name}" ziyaretini silmek istediğinize emin misiniz?`)) {
      try {
        await deleteVisit(visit.id);
        await renderVisits();
        renderCustomerLinks();
      } catch (error) {
        console.error('Silme hatası:', error);
        alert('Ziyaret silinirken bir hata oluştu.');
      }
    }
    return;
  }
  if (e.target.classList.contains('rowToggle')) {
    const row = e.target.closest('tr');
    const next = row.nextElementSibling;
    if (next) next.style.display = (next.style.display === 'none') ? 'table-row' : 'none';
    return;
  }
  if (e.target.classList.contains('edit')) {
    const listIndex = list.findIndex(v => v.id === visitId);
    if (listIndex !== -1) {
      openEditModal(listIndex);
    }
    return;
  }
  if (e.target.classList.contains('pdf')) {
    showVisitPDF(visit);
    return;
  }
});

// Filtre olayları
['q', 'fMode', 'fStatus', 'fPort', 'fMinVol', 'fFrom', 'fTo'].forEach(id => {
  $('#' + id).addEventListener('input', () => renderVisits());
});

$('#clearFilters').addEventListener('click', () => {
  ['q', 'fMode', 'fStatus', 'fPort', 'fMinVol', 'fFrom', 'fTo'].forEach(id => $('#' + id).value = '');
  renderVisits();
});

// Kaydet (yeni kayıt)
$('#vSave').addEventListener('click', async () => {
  const base = $('#cNotes').value.trim();
  const v = {
    name: $('#cName').value.trim(),
    contact: $('#cContact').value.trim(),
    phone: $('#cPhone').value.trim(),
    modes: getModes(),
    status: $('#cStatus').value,
    priority: $('#cPriority').value,
    ports: portChip.get(),
    volume: $('#cVolume').value ? Number($('#cVolume').value) : null,
    volUnit: $('#cVolUnit').value,
    visitDate: $('#cVisit').value || new Date().toISOString().split('T')[0],
    followDate: $('#cFollow').value || null,
    notes: base
  };
  if (!v.name) {
    alert('Müşteri adı zorunludur.');
    return;
  }
  
  // id alanını kesinlikle ekleme
  delete v.id;
  delete v.created_at;
  delete v.updated_at;
  
  await saveVisit(v);
});

$('#vReset').addEventListener('click', clearForm);

// ====== Not Güncelleme Modalı ======
let editIndex = null;
const editModal = $('#editModal');
const editNotes = $('#editNotes');

async function openEditModal(i) {
  editIndex = i;
  const list = await ensureVisitMeta();
  const visit = list[i];
  editNotes.value = visit.updateNote || '';
  editModal.style.display = 'grid';
}

$('#editCancel').addEventListener('click', () => {
  editModal.style.display = 'none';
  editIndex = null;
});

$('#editSave').addEventListener('click', async () => {
  const list = await ensureVisitMeta();
  if (editIndex == null || !list[editIndex]) return;
  const v = list[editIndex];
  const newUpdate = editNotes.value.trim();
  
  if (newUpdate) {
    // Notları güncelle - notes alanına ekle
    const updatedNotes = v.notes + (v.notes ? '\n\n' : '') + 
      `[Güncelleme: ${new Date().toLocaleDateString('tr-TR')}]\n${newUpdate}`;
    
    try {
      await updateVisit(v.id, { notes: updatedNotes });
      editModal.style.display = 'none';
      editIndex = null;
      await renderVisits();
      renderCustomerLinks();
    } catch (error) {
      console.error('Güncelleme hatası:', error);
      alert('Not güncellenirken bir hata oluştu.');
    }
  } else {
    editModal.style.display = 'none';
    editIndex = null;
  }
});

editModal.addEventListener('click', e => {
  if (e.target === editModal) {
    editModal.style.display = 'none';
  }
});

// ====== XLSX Dışa Aktarma ======
function exportXLS(filenameBase, rows) {
  try {
    if (typeof XLSX !== 'undefined' && XLSX.utils) {
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Ziyaretler');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filenameBase + '.xlsx';
      a.click();
      URL.revokeObjectURL(a.href);
      return;
    }
    throw new Error('XLSX unavailable');
  } catch (e) {
    let xmlH = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
    let xml = '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Ziyaretler"><Table>';
    rows.forEach(r => {
      xml += '<Row>';
      r.forEach(c => {
        let v = String(c ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        xml += `<Cell><Data ss:Type="String">${v}</Data></Cell>`;
      });
      xml += '</Row>';
    });
    xml += '</Table></Worksheet></Workbook>';
    const blob = new Blob([xmlH + xml], { type: 'application/vnd.ms-excel' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filenameBase + '.xls';
    a.click();
    URL.revokeObjectURL(a.href);
  }
}

$('#exportBtn').addEventListener('click', async () => {
  const data = await ensureVisitMeta();
  const rows = [[
    'ID', 'ZiyaretTarihi', 'Müşteri', 'Yetkili', 'İletişim', 'Modlar', 'Limanlar', 'Hacim',
    'Birim', 'Durum', 'Öncelik', 'TakipTarihi', 'OluşturulmaTarihi', 'Notlar'
  ]].concat(
    data.map(d => {
      return [
        d.id || '',
        niceDate(d.visitDate),
        d.name || '',
        d.contact || '',
        d.phone || '',
        (d.modes || []).join('/'),
        (d.ports || []).join(' | '),
        d.volume || '',
        d.volUnit || '',
        d.status || '',
        d.priority || '',
        niceDate(d.followDate) || '',
        niceDate(d.createdAt) || '',
        sanitizeNotes(d.notes || '')
      ];
    })
  );
  exportXLS('ziyaretler_' + new Date().toISOString().slice(0, 10), rows);
});

// ====== PDF Oluşturma ======
function showVisitPDF(v) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert('PDF kütüphanesi yüklenemedi.');
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const cw = 1200, ch = 1700;
  const c = document.createElement('canvas');
  c.width = cw;
  c.height = ch;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, cw, ch);
  ctx.fillStyle = '#111827';

  function wrapText(text, x, y, maxW, lh) {
    text = sanitizeNotes(text);
    const words = text.split(/\s+/);
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, y);
        y += lh;
        line = w;
      } else {
        line = test;
      }
    }
    if (line) {
      ctx.fillText(line, x, y);
      y += lh;
    }
    return y;
  }

  let x = 140, y = 80, lh = 26, maxW = cw - 180;

  const logo = load(STORAGE.logo, '');
  const img = new Image();
  img.onload = () => {
    try {
      ctx.drawImage(img, 60, 50, 60, 60);
    } catch (e) {}
    draw();
    push();
  };
  img.onerror = () => {
    draw();
    push();
  };
  img.src = logo || '';

  function draw() {
    ctx.font = 'bold 34px Arial, Helvetica, sans-serif';
    ctx.fillText('Mansfield Ziyaret Notu', x, y);
    y += 42;
    ctx.font = '16px Arial, Helvetica, sans-serif';

    y = wrapText('No: ' + (v.id || '-'), x, y, maxW, lh);
    y = wrapText('Müşteri: ' + (v.name || '-'), x, y, maxW, lh);
    y = wrapText('Yetkili: ' + (v.contact || '-'), x, y, maxW, lh);
    y = wrapText('İletişim: ' + (v.phone || '-'), x, y, maxW, lh);
    y = wrapText('Ziyaret Tarihi: ' + (v.visitDate ? new Date(v.visitDate).toLocaleDateString('tr-TR') : '-'), x, y, maxW, lh);

    if (v.createdAt) {
      y = wrapText('Oluşturulma: ' + new Date(v.createdAt).toLocaleDateString('tr-TR'), x, y, maxW, lh);
    }

    y = wrapText('Durum/Öncelik: ' + (v.status || '-') + ' / ' + (v.priority || '-'), x, y, maxW, lh);
    y = wrapText('Mod: ' + ((v.modes || []).join('/') || '-'), x, y, maxW, lh);

    ctx.font = 'bold 18px Arial, Helvetica, sans-serif';
    ctx.fillText('Limanlar', x, y + 8);
    y += 8 + lh;
    ctx.font = '16px Arial, Helvetica, sans-serif';
    y = wrapText((v.ports || []).join(' | ') || '-', x, y, maxW, lh);

    ctx.font = 'bold 18px Arial, Helvetica, sans-serif';
    ctx.fillText('Notlar', x, y + 8);
    y += 8 + lh;
    ctx.font = '16px Arial, Helvetica, sans-serif';
    y = wrapText(v.notes || '-', x, y, maxW, lh);
  }

  function push() {
    const data = c.toDataURL('image/png');
    doc.addImage(data, 'PNG', 0, 0, 595, 842);
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }
}

// ====== İlk Çizimler ======
// Sayfa tamamen yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
  // Bağlantı durumunu başlat
  updateConnectionStatus('checking', 'Bağlantı kontrol ediliyor...');
  
  // Supabase'i başlat
  initSupabase();
  
  // Verileri çek
  (async () => {
    $('#year').textContent = new Date().getFullYear();
    renderLinks();
    await renderVisits();
    await renderCustomerLinks();
  })();
});

// Eğer DOMContentLoaded zaten geçtiyse hemen çalıştır
if (document.readyState === 'loading') {
  // DOMContentLoaded bekleniyor, yukarıdaki kod çalışacak
} else {
  // DOM zaten yüklendi, hemen çalıştır
  updateConnectionStatus('checking', 'Bağlantı kontrol ediliyor...');
  initSupabase();
  (async () => {
    $('#year').textContent = new Date().getFullYear();
    renderLinks();
    await renderVisits();
    await renderCustomerLinks();
  })();
}

