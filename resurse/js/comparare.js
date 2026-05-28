// e6b20 - sistem comparare produse: max 2 produse, persistent in localStorage, expira dupa 1 zi
(function () {
    var LS_KEY = 'comparare-produse';
    var ZI_MS = 24 * 60 * 60 * 1000;

    function citesteStare() {
        try {
            return JSON.parse(localStorage.getItem(LS_KEY)) || { produse: [], ultimaInteractiune: 0 };
        } catch (e) { return { produse: [], ultimaInteractiune: 0 }; }
    }

    function scrieStare(stare) {
        localStorage.setItem(LS_KEY, JSON.stringify(stare));
    }

    function esteExpirat(stare) {
        return stare.ultimaInteractiune > 0 && (Date.now() - stare.ultimaInteractiune > ZI_MS);
    }

    // activeaza sau dezactiveaza toate butoanele "Compara" din pagina curenta
    function actualizeazaButoane(nrProduse) {
        document.querySelectorAll('.btn-compara').forEach(function (btn) {
            if (nrProduse >= 2) {
                btn.disabled = true;
                btn.title = 'Ștergeți un produs din lista de comparare';
            } else {
                btn.disabled = false;
                btn.title = 'Compară acest produs';
            }
        });
    }

    // reconstruieste containerul din starea curenta din localStorage
    function actualizeazaUI(stare) {
        var container = document.getElementById('container-comparare');
        if (!container) return;

        if (!stare.produse.length || esteExpirat(stare)) {
            container.classList.add('ascuns');
            actualizeazaButoane(0);
            return;
        }

        container.classList.remove('ascuns');

        // populeaza lista cu produsele selectate si butoane de stergere
        var lista = document.getElementById('comparare-lista');
        lista.innerHTML = '';
        stare.produse.forEach(function (p) {
            var item = document.createElement('div');
            item.className = 'comparare-item';

            var span = document.createElement('span');
            span.className = 'comparare-nume';
            span.textContent = p.nume;

            var btnSterge = document.createElement('button');
            btnSterge.className = 'btn-comparare-sterge';
            btnSterge.textContent = 'x';
            btnSterge.title = 'Elimina din comparare';
            btnSterge.addEventListener('click', function () { stergeProdus(p.id); });

            item.appendChild(span);
            item.appendChild(btnSterge);
            lista.appendChild(item);
        });

        // butonul "Afiseaza" apare doar cand sunt exact 2 produse selectate
        var btnAfiseaza = document.getElementById('btn-afiseaza-comparare');
        if (btnAfiseaza) {
            btnAfiseaza.classList.toggle('ascuns', stare.produse.length !== 2);
        }

        actualizeazaButoane(stare.produse.length);
    }

    function adaugaProdus(produs) {
        var stare = citesteStare();
        if (esteExpirat(stare)) stare.produse = [];
        if (stare.produse.length >= 2) return;
        // nu adauga acelasi produs de doua ori
        if (stare.produse.some(function (p) { return p.id === produs.id; })) return;
        stare.produse.push(produs);
        stare.ultimaInteractiune = Date.now();
        scrieStare(stare);
        actualizeazaUI(stare);
    }

    function stergeProdus(id) {
        var stare = citesteStare();
        stare.produse = stare.produse.filter(function (p) { return p.id !== id; });
        stare.ultimaInteractiune = Date.now();
        scrieStare(stare);
        actualizeazaUI(stare);
    }

    // ataseaza click handlers la butoanele .btn-compara neinitialiazate inca
    function initButoane() {
        document.querySelectorAll('.btn-compara:not([data-compara-init])').forEach(function (btn) {
            btn.dataset.comparaInit = '1';
            btn.addEventListener('click', function () {
                adaugaProdus({ id: btn.dataset.id, nume: btn.dataset.nume });
            });
        });
        // sincronizeaza starea butoanelor nou aparute (ex: dupa fetch server-side)
        var stare = citesteStare();
        actualizeazaButoane(esteExpirat(stare) ? 0 : stare.produse.length);
    }

    // expusa global ca produse.js sa o cheme dupa fiecare fetch server-side
    window.initComparareButoane = initButoane;

    // click listener permanent pe butonul Afiseaza — citeste starea la momentul click-ului
    var btnAfiseaza = document.getElementById('btn-afiseaza-comparare');
    if (btnAfiseaza) {
        btnAfiseaza.addEventListener('click', function () {
            var s = citesteStare();
            if (s.produse.length === 2) {
                window.open('/comparare?id1=' + s.produse[0].id + '&id2=' + s.produse[1].id, '_blank');
            }
        });
    }

    // la load: curata starea expirata si reconstruieste UI-ul
    var stare = citesteStare();
    if (esteExpirat(stare)) {
        stare = { produse: [], ultimaInteractiune: 0 };
        scrieStare(stare);
    }
    actualizeazaUI(stare);
    initButoane();
})();
