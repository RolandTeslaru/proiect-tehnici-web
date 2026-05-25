// test al logicii din resurse/js/produse.js, rulat cu jsdom (fara browser real)
// porneste presupunand ca serverul ruleaza pe :8080

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const BASE = 'http://localhost:8080';
let treceri = 0, picaturi = 0;

function ok(cond, mesaj) {
    if (cond) { treceri++; console.log('  OK  ', mesaj); }
    else { picaturi++; console.log('  FAIL', mesaj); }
}

function vizibile(doc) {
    return Array.from(doc.querySelectorAll('article.produs'))
        .filter(a => !a.classList.contains('ascuns'));
}
function ordinePreturi(doc) {
    return Array.from(doc.querySelectorAll('#lista-produse article.produs'))
        .map(a => Number(a.dataset.pret));
}

(async () => {
    const html = await (await fetch(BASE + '/produse')).text();
    const jsCod = fs.readFileSync(path.join(__dirname, '..', 'resurse', 'js', 'produse.js'), 'utf8');

    const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true });
    const win = dom.window;
    const doc = win.document;

    // stub pt confirm/alert (jsdom nu le implementeaza)
    let ultimAlert = null;
    win.alert = (m) => { ultimAlert = m; };
    win.confirm = () => true;

    // rulez codul de productie in contextul ferestrei jsdom
    win.eval(jsCod);

    const total = doc.querySelectorAll('article.produs').length;
    console.log('Total produse in pagina:', total);

    // ── 1. filtrare dupa nume ──
    doc.getElementById('f-nume').value = 'drona';
    doc.getElementById('btn-filtreaza').click();
    let v = vizibile(doc);
    ok(v.length === 1 && /drona/i.test(v[0].dataset.nume), 'filtrare nume "drona" -> 1 produs');

    // reset intre teste
    doc.getElementById('btn-reseteaza').click();
    ok(vizibile(doc).length === total, 'reset -> toate produsele vizibile');

    // ── 2. validare: nume cu cifre nu trece ──
    ultimAlert = null;
    doc.getElementById('f-nume').value = 'abc123';
    doc.getElementById('btn-filtreaza').click();
    ok(ultimAlert && /cifre/i.test(ultimAlert), 'validare: nume cu cifre -> alert + abort');
    doc.getElementById('btn-reseteaza').click();

    // ── 3. filtrare pret maxim ──
    const pret = doc.getElementById('f-pret');
    pret.value = '50000'; // doar produse ieftine
    doc.getElementById('btn-filtreaza').click();
    v = vizibile(doc);
    ok(v.length > 0 && v.every(a => Number(a.dataset.pret) <= 50000), 'filtrare pret <= 50000');
    doc.getElementById('btn-reseteaza').click();

    // ── 4. filtrare radio livrare ──
    const rCurier = doc.querySelector('input[name="f-livrare"][value="curier"]');
    if (rCurier) {
        rCurier.checked = true;
        doc.getElementById('btn-filtreaza').click();
        v = vizibile(doc);
        ok(v.length > 0 && v.every(a => a.dataset.livrare === 'curier'), 'filtrare livrare = curier');
        doc.getElementById('btn-reseteaza').click();
    }

    // ── 5. filtrare cuvinte cheie in descriere ──
    doc.getElementById('f-descriere').value = 'stealth';
    doc.getElementById('btn-filtreaza').click();
    v = vizibile(doc);
    ok(v.length > 0 && v.every(a => /stealth/i.test(a.querySelector('.produs-descriere').textContent)),
        'filtrare cuvant cheie "stealth" in descriere');
    doc.getElementById('btn-reseteaza').click();

    // ── 6. select multiplu clasificare ──
    const sel = doc.getElementById('f-clasificare');
    Array.from(sel.options).forEach(o => { o.selected = (o.value === 'public'); });
    doc.getElementById('btn-filtreaza').click();
    v = vizibile(doc);
    ok(v.length > 0 && v.every(a => a.dataset.clasificare === 'public'), 'select multiplu: doar "public"');
    doc.getElementById('btn-reseteaza').click();

    // ── 7. checkbox compatibilitati: las doar una bifata ──
    const checks = Array.from(doc.querySelectorAll('input[name="f-compat"]'));
    checks.forEach((c, i) => { c.checked = (i === 0); });
    const valoareRamasa = checks[0].value;
    doc.getElementById('btn-filtreaza').click();
    v = vizibile(doc);
    ok(v.every(a => a.dataset.compatibilitati.split(',').map(s=>s.trim()).includes(valoareRamasa)),
        'checkbox: doar produse cu compat "' + valoareRamasa + '"');
    doc.getElementById('btn-reseteaza').click();

    // ── 8. sortare crescatoare dupa pret ──
    doc.getElementById('btn-sort-asc').click();
    let ord = ordinePreturi(doc);
    let crescator = ord.every((x, i) => i === 0 || ord[i-1] <= x);
    ok(crescator, 'sortare crescatoare dupa pret');

    // ── 9. sortare descrescatoare ──
    doc.getElementById('btn-sort-desc').click();
    ord = ordinePreturi(doc);
    let descrescator = ord.every((x, i) => i === 0 || ord[i-1] >= x);
    ok(descrescator, 'sortare descrescatoare dupa pret');

    // ── 10. reset restaureaza ordinea initiala (dupa id) ──
    doc.getElementById('btn-reseteaza').click();
    const ids = Array.from(doc.querySelectorAll('#lista-produse article.produs')).map(a => Number(a.dataset.id));
    const idSortat = ids.every((x, i) => i === 0 || ids[i-1] < x);
    ok(idSortat, 'reset restaureaza ordinea initiala (dupa id)');

    // ── 11. calculare: apare div fix, dispare dupa 2s ──
    doc.getElementById('btn-calculeaza').click();
    let divCalc = doc.querySelector('.rezultat-calcul');
    ok(divCalc && /media/i.test(divCalc.textContent), 'calculare: apare div cu media');

    console.log('\nRezultat:', treceri, 'OK,', picaturi, 'FAIL');
    process.exit(picaturi === 0 ? 0 : 1);
})().catch(e => { console.error('EROARE test:', e); process.exit(2); });
