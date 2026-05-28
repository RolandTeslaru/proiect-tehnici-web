// filtrare / sortare / calculare pe pagina de produse, totul pe client
// articolele nu se sterg din DOM, doar le ascund cu o clasa, ca sa le pot refolosi

(function () {
    "use strict";

    var lista = document.getElementById("lista-produse");
    if (!lista) return;

    var articole = Array.from(lista.querySelectorAll("article.produs"));
    // tin minte ordinea initiala ca s-o pot pune la loc dupa sortare/reset
    var ordineInitiala = articole.slice();

    // e6b6 - la load, ascund articolele marcate in sessionStorage pentru acest tab
    var SS_KEY = "ascunse-sesiune";
    var ascunseSesiune = JSON.parse(sessionStorage.getItem(SS_KEY) || "[]");
    articole.forEach(function(a) {
        if (ascunseSesiune.indexOf(a.dataset.id) !== -1) {
            a.classList.add("ascuns", "session-ascuns");
        }
    });

    // inputuri
    var switchServer = document.getElementById('switch-server');
    var K = 6;          // e6b5 - produse pe pagina
    var paginaCurenta = 1; // e6b5
    var sortDir = 'asc';   // e6b10 - directia curenta pt fetch
    var debounceTimer = null; // e6b10

    var fNume = document.getElementById("f-nume");
    var fPretMin = document.getElementById("f-pret-min");
    var fPretMinVal = document.getElementById("f-pret-min-val");
    var fPret = document.getElementById("f-pret");
    var fPretVal = document.getElementById("f-pret-val");
    var fAutonomie = document.getElementById("f-autonomie");
    var fDescriere = document.getElementById("f-descriere");
    var fExport = document.getElementById("f-export");
    var fClasificare = document.getElementById("f-clasificare");
    var fNrCompat = document.getElementById("f-nrcompat");
    var fData = document.getElementById("f-data");
    var numarProduse = document.getElementById("numar-produse");
    var mesajGol = document.getElementById("mesaj-gol");

    // arat valoarea aleasa la slider in timp real
    if (fPretMin && fPretMinVal) {
        fPretMin.addEventListener("input", function () {
            fPretMinVal.textContent = fPretMin.value;
            // nu lasa minimul sa depaseasca maximul
            if (Number(fPretMin.value) > Number(fPret.value)) {
                fPret.value = fPretMin.value;
                fPretVal.textContent = fPretMin.value;
            }
            // ̀-ͯ bloc unicoe ca diacritice
        });
    }
    if (fPret && fPretVal) {
        fPret.addEventListener("input", function () {
            fPretVal.textContent = fPret.value;
            // nu lasa maximul sa scada sub minim
            if (Number(fPret.value) < Number(fPretMin.value)) {
                fPretMin.value = fPret.value;
                fPretMinVal.textContent = fPret.value;
            }
        });
    }

    // ── helpers ──

    // e6b7 - scoate diacriticele 
    function normalizeaza(str) {
        return str.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    }

    function radioLivrare() {
        var ales = document.querySelector('input[name="f-livrare"]:checked');
        return ales ? ales.value : "";
    }

    function compatBifate() {
        return Array.from(document.querySelectorAll('input[name="f-compat"]:checked'))
            .map(function (c) { return c.value; });
    }

    function clasificariSelectate() {
        return Array.from(fClasificare.selectedOptions).map(function (o) { return o.value; });
    }

    function numarVizibile() {
        return articole.filter(
            function (a) { 
                return !a.classList.contains("ascuns"); 
            }
        ).length;
    }

    // e6b15 - numarul de produse vizibile, actualizat dupa fiecare operatie
    // e6b3 - mesajGol apare cand n === 0
    function actualizeazaNumar() {
        var n = numarVizibile();
        if (numarProduse) 
            numarProduse.textContent = "Produse afisate: " + n;
        if (mesajGol) 
            mesajGol.classList.toggle("ascuns", n > 0);
    }

    // ── validare (rulata inainte de filtrare/sortare/calculare) ──
    // intoarce true daca e ok, altfel afiseaza mesaj si intoarce false

    function valideaza() {
        return true;
    }

    // ── filtrarea propriu-zisa ──

    function potrivesteUnArticol(a) {
        // nume
        var nume = normalizeaza(fNume.value.trim());
        if (nume && normalizeaza(a.dataset.nume).indexOf(nume) === -1) return false;

        // interval pret
        if (Number(a.dataset.pret) > Number(fPret.value)) return false;
        if (fPretMin && Number(a.dataset.pret) < Number(fPretMin.value)) return false;

        // autonomie minima
        var autoMin = fAutonomie.value.trim();
        if (autoMin !== "" && !isNaN(autoMin) && Number(a.dataset.autonomie) < Number(autoMin)) return false;

        // tip livrare
        var liv = radioLivrare();
        if (liv && a.dataset.livrare !== liv) return false;

        // compatibilitati: produsul trebuie sa aiba macar una din cele bifate
        var bifate = compatBifate();
        var aleCompat = a.dataset.compatibilitati.split(",").map(function (s) { return s.trim(); });
        var areMacarUna = aleCompat.some(function (c) { return bifate.indexOf(c) !== -1; });
        if (!areMacarUna) return false;

        // cuvinte cheie in descriere (OR, ca subsir)
        var desc = fDescriere.value.trim();
        if (desc) {
            var cuvinte = desc.split(",").map(function (s) { return normalizeaza(s.trim()); }).filter(Boolean);
            var descArticol = (a.dataset.descriere || "");
            // descrierea nu e in data-*, asa ca o iau din paragraf
            if (!descArticol) {
                var pDesc = a.querySelector(".produs-descriere");
                descArticol = pDesc ? pDesc.textContent : "";
            }
            descArticol = normalizeaza(descArticol);
            var gasit = cuvinte.some(function (cuv) { return descArticol.indexOf(cuv) !== -1; });
            if (!gasit) return false;
        }

        // export permis
        if (fExport.value !== "" && a.dataset.export !== fExport.value) return false;

        // nivel clasificare (din select multiplu)
        var clas = clasificariSelectate();
        if (clas.indexOf(a.dataset.clasificare) === -1) return false;

        // nr minim compatibilitati (number)
        if (fNrCompat && Number(fNrCompat.value) > 0 && Number(a.dataset.nrcompat) < Number(fNrCompat.value)) return false;

        // adaugat dupa data (date)
        if (fData && fData.value) {
            var dataFiltru = new Date(fData.value);
            var dataProdus = new Date(a.dataset.data);
            if (dataProdus < dataFiltru) return false;
        }

        return true;
    }

    function filtreaza() {
        if (!valideaza()) return;
        paginaCurenta = 1;
        if (switchServer && switchServer.checked) {
            fetchFiltreaza(1); // e6b10
        } else {
            aplicaPaginaClient(); // e6b5
        }
    }

    // ── sortare dupa 2 chei alese de user (e6b8) ──

    // scoate valoarea numerica corecta din dataset pt cheia data
    function valoareCheie(a, cheie) {
        if (cheie === "pret")      return Number(a.dataset.pret);
        if (cheie === "autonomie") return Number(a.dataset.autonomie);
        if (cheie === "nrcompat")  return Number(a.dataset.nrcompat);
        if (cheie === "data")      return new Date(a.dataset.data).getTime();
        return 0;
    }

    function sorteaza(crescator) {
        if (!valideaza()) 
            return;

        var cheie1 = document.getElementById("sort-cheie1").value;
        var cheie2 = document.getElementById("sort-cheie2").value;
        
        var copie = articole.slice();
        copie.sort(function (x, y) {
            var d1 = valoareCheie(x, cheie1) - valoareCheie(y, cheie1);
            if (d1 !== 0) 
                return crescator ? d1 : -d1;
            var d2 = valoareCheie(x, cheie2) - valoareCheie(y, cheie2);
            return crescator ? d2 : -d2;
        });
        copie.forEach(function (a) { lista.appendChild(a); });
        actualizeazaNumar();
    }

    // ── calculare: media preturilor produselor vizibile, intr-un div fix care dispare ──

    function calculeaza() {
        if (!valideaza()) return;
        var vizibile = articole.filter(function (a) { 
            return !a.classList.contains("ascuns"); 
        });
        var div = document.createElement("div");
        div.className = "rezultat-calcul";
        if (vizibile.length === 0) {
            div.textContent = "Nu exista produse afisate pentru calcul.";
        } else {
            var suma = vizibile.reduce(function (s, a) {
                 return s + Number(a.dataset.pret); 
            }, 0);
            var media = suma / vizibile.length;
            div.textContent = "Media preturilor (" + vizibile.length + " produse): " +
                media.toLocaleString("ro-RO", { maximumFractionDigits: 2 }) + " EUR";
        }
        document.body.appendChild(div);
        setTimeout(function () { div.remove(); }, 2000);
    }
    

    // ── reset: confirm, apoi inapoi la valorile implicite si la ordinea initiala ──

    function reseteaza() {
        if (!confirm("Sigur doriti sa resetati toate filtrele?")) return;

        fNume.value = "";
        fPretMin.value = fPretMin.min;
        if (fPretMinVal) fPretMinVal.textContent = fPretMin.min;
        fPret.value = fPret.max;
        if (fPretVal) fPretVal.textContent = fPret.max;
        fAutonomie.value = "";
        fDescriere.value = "";
        fDescriere.classList.remove("is-invalid");
        fExport.value = "";
        fNrCompat.value = 0;
        fData.value = "";

        var oricare = document.querySelector('input[name="f-livrare"][value=""]');
        if (oricare) oricare.checked = true;

        document.querySelectorAll('input[name="f-compat"]').forEach(function (c) { c.checked = true; });
        Array.from(fClasificare.options).forEach(function (o) { o.selected = true; });

        // filtlive potriveste V cifra, ! neaga
        // resetez si cheile de sortare la default (pret / nrcompat)
        document.getElementById("sort-cheie1").value = "pret";
        document.getElementById("sort-cheie2").value = "nrcompat";

        paginaCurenta = 1; // e6b5
        sortDir = 'asc';   // e6b10
        if (switchServer && switchServer.checked) {
            fetchFiltreaza(1);
        } else {
            lista.innerHTML = '';
            ordineInitiala.forEach(function (a) { lista.appendChild(a); });
            aplicaPaginaClient(); // e6b5
        }
    }

    // ── legare butoane ──
    document.getElementById("btn-filtreaza").addEventListener("click", filtreaza);
    document.getElementById("btn-sort-asc").addEventListener("click", function () {
        sortDir = 'asc'; // e6b10
        if (switchServer && switchServer.checked) { fetchFiltreaza(paginaCurenta); }
        else { sorteaza(true); aplicaPaginaClient(); } // e6b5
    });
    document.getElementById("btn-sort-desc").addEventListener("click", function () {
        sortDir = 'desc'; // e6b10
        if (switchServer && switchServer.checked) { fetchFiltreaza(paginaCurenta); }
        else { sorteaza(false); aplicaPaginaClient(); } // e6b5
    });
    document.getElementById("btn-calculeaza").addEventListener("click", calculeaza);
    document.getElementById("btn-reseteaza").addEventListener("click", reseteaza);

    // e6b4 - filtrare live la onchange pe toate cele 8 inputuri
    function filtreazaLive() {
        if (!valideaza()) return;
        paginaCurenta = 1;
        if (switchServer && switchServer.checked) {
            clearTimeout(debounceTimer); // e6b10 - debounce sa nu spam-am serverul
            debounceTimer = setTimeout(() => fetchFiltreaza(1), 300);
        } else {
            aplicaPaginaClient(); // e6b5
        }
    }

    // toate cele 8 inputuri
    fNume.addEventListener("input", filtreazaLive);
    fPretMin.addEventListener("input", filtreazaLive);
    fPret.addEventListener("input", filtreazaLive);
    fAutonomie.addEventListener("input", filtreazaLive);
    fDescriere.addEventListener("input", filtreazaLive);
    fExport.addEventListener("change", filtreazaLive);
    fClasificare.addEventListener("change", filtreazaLive);
    fNrCompat.addEventListener("input", filtreazaLive);
    fData.addEventListener("change", filtreazaLive);
    document.querySelectorAll('input[name="f-livrare"]').forEach(function(r) {
        r.addEventListener("change", filtreazaLive);
    });
    document.querySelectorAll('input[name="f-compat"]').forEach(function(c) {
        c.addEventListener("change", filtreazaLive);
    });

    // e6b18 - produsele adaugate in ultimul an primesc un badge NOU
    var T_ZILE = 365;
    var acum = new Date();
    articole.forEach(function(a) {
        var dataStr = a.dataset.data;
        if (!dataStr) return;
        var dataAdaugare = new Date(dataStr);
        var diferentaZile = (acum - dataAdaugare) / (1000 * 60 * 60 * 24); // convert in zile
        if (diferentaZile <= T_ZILE) { // daca dif e mai mica de un an arata NOU
            var badge = document.createElement("span");
            badge.className = "badge-nou";
            badge.textContent = "NOU";
            a.appendChild(badge);
        }
    });

    // e6b14 - cel mai ieftin produs din fiecare categorie primeste un badge vizibil
    function marcheazaCeleMaiIeftine() {
        var minPerCategorie = {};
        articole.forEach(function(a) {
            var cat = a.dataset.categorie;
            var pret = Number(a.dataset.pret);
            if (minPerCategorie[cat] === undefined || pret < minPerCategorie[cat].pret) {
                minPerCategorie[cat] = { pret: pret, articol: a };
            }
        });
        Object.keys(minPerCategorie).forEach(function(cat) {
            var badge = document.createElement("span");
            badge.className = "badge-ieftin";
            badge.textContent = "Cel mai ieftin din categorie";
            minPerCategorie[cat].articol.appendChild(badge);
        });
    }

    marcheazaCeleMaiIeftine();

    // e6b6 - logica celor 3 butoane per produs
    articole.forEach(function(a) {
        var btnPin = a.querySelector(".btn-pin");
        var btnTemp = a.querySelector(".btn-ascunde-temp");
        var btnSes = a.querySelector(".btn-ascunde-sesiune");

        // buton 1: pin - produsul ramane vizibil la filtrare
        if (btnPin) {
            btnPin.addEventListener("click", function(e) {
                e.stopPropagation();
                var ePin = a.classList.toggle("pinned");
                btnPin.classList.toggle("activ", ePin);
                btnPin.querySelector("i").className = ePin ? "bi bi-pin-fill" : "bi bi-pin";
                // re-aplica paginarea ca sa reflecte noul stat pin/unpin
                aplicaPaginaClient();
            });
        }

        // buton 2: ascunde temporar - reapare la urmatoarea filtrare/sortare/resetare
        if (btnTemp) {
            btnTemp.addEventListener("click", function(e) {
                e.stopPropagation();
                a.classList.add("ascuns");
                actualizeazaNumar();
            });
        }

        // buton 3: ascunde pe sesiune - nu mai apare in acest tab nici dupa refresh
        if (btnSes) {
            btnSes.addEventListener("click", function(e) {
                e.stopPropagation();
                a.classList.add("ascuns", "session-ascuns");
                var lista = JSON.parse(sessionStorage.getItem(SS_KEY) || "[]");
                if (lista.indexOf(a.dataset.id) === -1) lista.push(a.dataset.id);
                sessionStorage.setItem(SS_KEY, JSON.stringify(lista));
                actualizeazaNumar();
            });
        }
    });

    // e6b5 - aplica paginarea client-side: arata doar produsele din pagina curenta
    function aplicaPaginaClient() {
        var toateInDom = Array.from(lista.querySelectorAll('article.produs'));
        var potrivite = toateInDom.filter(a =>
            !a.classList.contains('session-ascuns') &&
            !a.classList.contains('pinned') &&
            potrivesteUnArticol(a)
        );
        var start = (paginaCurenta - 1) * K;
        var pePagina = potrivite.slice(start, start + K);

        toateInDom.forEach(a => {
            if (a.classList.contains('session-ascuns')) return;
            if (a.classList.contains('pinned')) { a.classList.remove('ascuns'); return; }
            a.classList.toggle('ascuns', pePagina.indexOf(a) === -1);
        });

        randeazaPaginare(Math.ceil(potrivite.length / K) || 1, paginaCurenta);
        if (numarProduse) numarProduse.textContent = 'Produse afisate: ' + pePagina.length + ' | Filtrate total: ' + potrivite.length;
        if (mesajGol) mesajGol.classList.toggle('ascuns', potrivite.length > 0);
    }

    // e6b5 - randeaza butoanele de paginare (modul client)
    function randeazaPaginare(totalPagini, pagCurenta) {
        var pl = document.getElementById('pagination-list');
        if (!pl) return;
        pl.innerHTML = '';
        if (totalPagini <= 1) return;

        var frag = document.createDocumentFragment();

        var liPrev = document.createElement('li');
        liPrev.className = 'page-item' + (pagCurenta === 1 ? ' disabled' : '');
        var btnPrev = document.createElement('button');
        btnPrev.className = 'page-link';
        btnPrev.innerHTML = '&laquo;';
        if (pagCurenta > 1) btnPrev.addEventListener('click', () => { paginaCurenta--; aplicaPaginaClient(); });
        liPrev.appendChild(btnPrev);
        frag.appendChild(liPrev);

        for (let i = 1; i <= totalPagini; i++) {
            var li = document.createElement('li');
            li.className = 'page-item' + (i === pagCurenta ? ' active' : '');
            var btn = document.createElement('button');
            btn.className = 'page-link';
            btn.textContent = i;
            btn.addEventListener('click', () => { paginaCurenta = i; aplicaPaginaClient(); });
            li.appendChild(btn);
            frag.appendChild(li);
        }

        var liNext = document.createElement('li');
        liNext.className = 'page-item' + (pagCurenta === totalPagini ? ' disabled' : '');
        var btnNext = document.createElement('button');
        btnNext.className = 'page-link';
        btnNext.innerHTML = '&raquo;';
        if (pagCurenta < totalPagini) btnNext.addEventListener('click', () => { paginaCurenta++; aplicaPaginaClient(); });
        liNext.appendChild(btnNext);
        frag.appendChild(liNext);

        pl.appendChild(frag);
    }

    // e6b10 - trimite filtrele la server prin fetch() si afiseaza rezultatele
    function fetchFiltreaza(pagina) {
        var params = new URLSearchParams();
        params.set('pagina', pagina);
        params.set('numeContine', fNume.value.trim());
        if (fPretMin) params.set('pretMin', fPretMin.value);
        params.set('pretMax', fPret.value);
        var autoMin = fAutonomie.value.trim();
        if (autoMin) params.set('autonomieMin', autoMin);
        var liv = radioLivrare();
        if (liv) params.set('tipLivrare', liv);
        params.set('exportPermis', fExport.value);
        if (fNrCompat && Number(fNrCompat.value) > 0) params.set('nrCompatMin', fNrCompat.value);
        if (fData && fData.value) params.set('dataMin', fData.value);
        params.set('sortCheie1', document.getElementById('sort-cheie1').value);
        params.set('sortCheie2', document.getElementById('sort-cheie2').value);
        params.set('sortDir', sortDir);
        var desc = fDescriere.value.trim();
        if (desc) params.set('descriere', desc);

        var bifate = compatBifate();
        if (bifate.length === 0) {
            params.set('compatNone', '1');
        } else {
            bifate.forEach(c => params.append('compatibilitati[]', c));
        }
        clasificariSelectate().forEach(c => params.append('clasificari[]', c));

        fetch('/api/produse?' + params.toString())
            .then(r => r.json())
            .then(data => {
                paginaCurenta = data.pagina;
                lista.innerHTML = data.html;
                randeazaPaginareServer(data.totalPagini, data.pagina);
                var peP = lista.querySelectorAll('article.produs').length;
                if (numarProduse) numarProduse.textContent = 'Produse afisate: ' + peP + ' | Filtrate total: ' + data.total;
                if (mesajGol) mesajGol.classList.toggle('ascuns', data.total > 0);
                initArticoleNoi();
            })
            .catch(err => console.error('Eroare fetch produse:', err));
    }

    // e6b5 - randeaza butoanele de paginare (modul server)
    function randeazaPaginareServer(totalPagini, pagCurenta) {
        var pl = document.getElementById('pagination-list');
        if (!pl) return;
        pl.innerHTML = '';
        if (totalPagini <= 1) return;

        var frag = document.createDocumentFragment();

        var liPrev = document.createElement('li');
        liPrev.className = 'page-item' + (pagCurenta === 1 ? ' disabled' : '');
        var btnPrev = document.createElement('button');
        btnPrev.className = 'page-link';
        btnPrev.innerHTML = '&laquo;';
        if (pagCurenta > 1) btnPrev.addEventListener('click', () => fetchFiltreaza(pagCurenta - 1));
        liPrev.appendChild(btnPrev);
        frag.appendChild(liPrev);

        for (let i = 1; i <= totalPagini; i++) {
            var li = document.createElement('li');
            li.className = 'page-item' + (i === pagCurenta ? ' active' : '');
            var btn = document.createElement('button');
            btn.className = 'page-link';
            btn.textContent = i;
            btn.addEventListener('click', () => fetchFiltreaza(i));
            li.appendChild(btn);
            frag.appendChild(li);
        }

        var liNext = document.createElement('li');
        liNext.className = 'page-item' + (pagCurenta === totalPagini ? ' disabled' : '');
        var btnNext = document.createElement('button');
        btnNext.className = 'page-link';
        btnNext.innerHTML = '&raquo;';
        if (pagCurenta < totalPagini) btnNext.addEventListener('click', () => fetchFiltreaza(pagCurenta + 1));
        liNext.appendChild(btnNext);
        frag.appendChild(liNext);

        pl.appendChild(frag);
    }

    // e6b10 - reinitializeaza butoanele/modalele pe articolele randate de server dupa fetch
    function initArticoleNoi() {
        var nouiArticole = Array.from(lista.querySelectorAll('article.produs'));

        var ascunseSes = JSON.parse(sessionStorage.getItem(SS_KEY) || '[]');
        nouiArticole.forEach(a => {
            if (ascunseSes.indexOf(a.dataset.id) !== -1) a.classList.add('ascuns', 'session-ascuns');
        });

        nouiArticole.forEach(a => {
            var btnPin = a.querySelector('.btn-pin');
            var btnTemp = a.querySelector('.btn-ascunde-temp');
            var btnSes = a.querySelector('.btn-ascunde-sesiune');

            if (btnPin) btnPin.addEventListener('click', e => {
                e.stopPropagation();
                var ePin = a.classList.toggle('pinned');
                btnPin.classList.toggle('activ', ePin);
                btnPin.querySelector('i').className = ePin ? 'bi bi-pin-fill' : 'bi bi-pin';
                if (!ePin) a.classList.add('ascuns');
            });
            if (btnTemp) btnTemp.addEventListener('click', e => {
                e.stopPropagation();
                a.classList.add('ascuns');
            });
            if (btnSes) btnSes.addEventListener('click', e => {
                e.stopPropagation();
                a.classList.add('ascuns', 'session-ascuns');
                var ls = JSON.parse(sessionStorage.getItem(SS_KEY) || '[]');
                if (ls.indexOf(a.dataset.id) === -1) ls.push(a.dataset.id);
                sessionStorage.setItem(SS_KEY, JSON.stringify(ls));
            });
        });

        if (typeof bootstrap !== 'undefined') {
            nouiArticole.forEach(a => {
                var modalEl = document.getElementById('modal-produs-' + a.dataset.id);
                if (!modalEl) return;
                var bsModal = new bootstrap.Modal(modalEl);
                a.style.cursor = 'pointer';
                a.addEventListener('click', e => {
                    if (e.target.closest('a') || e.target.closest('button')) return;
                    bsModal.show();
                });
            });
        }

        var acumInit = new Date();
        nouiArticole.forEach(a => {
            if (!a.dataset.data) return;
            if ((acumInit - new Date(a.dataset.data)) / (1000 * 60 * 60 * 24) <= 365) {
                var b = document.createElement('span');
                b.className = 'badge-nou'; b.textContent = 'NOU';
                a.appendChild(b);
            }
        });

        var minPerCat = {};
        nouiArticole.forEach(a => {
            if (a.classList.contains('ascuns')) return;
            var cat = a.dataset.categorie, pret = Number(a.dataset.pret);
            if (minPerCat[cat] === undefined || pret < minPerCat[cat].pret)
                minPerCat[cat] = { pret, articol: a };
        });
        Object.values(minPerCat).forEach(({ articol }) => {
            var b = document.createElement('span');
            b.className = 'badge-ieftin'; b.textContent = 'Cel mai ieftin din categorie';
            articol.appendChild(b);
        });

        // e6b12 - actualizeaza preturile dupa ce articolele sunt in DOM
        if (window.marcheazaPreturiOferta) window.marcheazaPreturiOferta();
        // e6b20 - ataseaza handlers pe butoanele de comparare nou aparute
        if (window.initComparareButoane) window.initComparareButoane();
    }

    // e6b10 - schimba modul de filtrare la toggle switch
    if (switchServer) {
        switchServer.addEventListener('change', () => {
            paginaCurenta = 1;
            if (switchServer.checked) {
                fetchFiltreaza(1);
            } else {
                lista.innerHTML = '';
                ordineInitiala.forEach(a => lista.appendChild(a));
                aplicaPaginaClient();
            }
        });
    }

    aplicaPaginaClient(); // e6b5 - aplica paginarea initiala la load

    // e6b11
    if (typeof bootstrap !== "undefined") {
        articole.forEach(function(a) {
            var modalEl = document.getElementById("modal-produs-" + a.dataset.id);
            if (!modalEl) return;
            var bsModal = new bootstrap.Modal(modalEl);
            a.style.cursor = "pointer";
            a.addEventListener("click", function(e) {
                if (e.target.closest("a")) return;
                bsModal.show();
            });
        });
    }
})();
