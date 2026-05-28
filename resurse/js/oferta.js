// e6b12 - timer oferta curenta + marcare preturi reduse in pagina produse
(function () {
    var timerInterval = null;
    var ofertaActiva = null;

    function pad(n) { return String(n).padStart(2, '0'); }

    // gaseste toate articolele din categoria cu oferta si le actualizeaza pretul afisat
    function actualizeazaPreturi() {
        if (!ofertaActiva) return;
        var cat = ofertaActiva.categorie;
        var red = ofertaActiva.reducere;
        document.querySelectorAll('article.produs[data-categorie="' + cat + '"]').forEach(function (a) {
            var pretOriginal = parseFloat(a.dataset.pret);
            var pretRedus = Math.round(pretOriginal * (1 - red / 100));
            var celula = a.querySelector('.pret-celula');
            // skip daca celula lipseste sau pretul redus e deja afisat
            if (!celula || celula.dataset.ofertaPret === String(pretRedus)) return;
            celula.dataset.ofertaPret = String(pretRedus);
            celula.innerHTML = '<s class="pret-vechi">' + pretOriginal + ' EUR</s> <span class="pret-redus">' + pretRedus + ' EUR</span>';
        });
    }

    // expusa global ca produse.js sa o cheme dupa fiecare fetch server-side
    window.marcheazaPreturiOferta = actualizeazaPreturi;

    function pornesteTimer(oferta) {
        clearInterval(timerInterval); // opreste un timer anterior daca exista
        var timerEl = document.getElementById('oferta-timer');
        var bannerEl = document.getElementById('oferta-banner');
        var fin = new Date(oferta['data-finalizare']).getTime();

        function tick() {
            var ramasSec = Math.max(0, Math.floor((fin - Date.now()) / 1000));
            if (ramasSec <= 0) {
                // oferta a expirat: ascunde bannerul si asteapta oferta noua de la server
                clearInterval(timerInterval);
                if (bannerEl) bannerEl.classList.add('ascuns');
                setTimeout(fetchSiAfiseaza, 1000);
                return;
            }
            if (timerEl) {
                timerEl.textContent = pad(Math.floor(ramasSec / 3600)) + ':' +
                    pad(Math.floor((ramasSec % 3600) / 60)) + ':' + pad(ramasSec % 60);
                // ultimele 10 secunde: clasa urgenta (pulsatie rosie)
                timerEl.classList.toggle('oferta-timer-urgent', ramasSec <= 10);
            }
        }

        tick(); // primul tick imediat, fara a astepta 1s
        timerInterval = setInterval(tick, 1000);
    }
    // s taiat
    // populeaza bannerul din DOM cu datele ofertei si porneste timer-ul
    function afiseazaOferta(oferta) {
        ofertaActiva = oferta;
        var bannerEl = document.getElementById('oferta-banner');
        if (bannerEl) {
            var catEl = document.getElementById('oferta-categorie-val');
            var redEl = document.getElementById('oferta-reducere-val');
            if (catEl) catEl.textContent = oferta.categorie;
            if (redEl) redEl.textContent = oferta.reducere;
            bannerEl.classList.remove('ascuns');
            pornesteTimer(oferta);
        }
        actualizeazaPreturi(); // marcheaza preturile si pe pagina de produse
    }

    // interogheaza serverul; daca nu e oferta activa mai incearca dupa 10s
    function fetchSiAfiseaza() {
        fetch('/api/oferta-curenta')
            .then(function (r) { return r.json(); })
            .then(function (oferta) {
                if (!oferta) { setTimeout(fetchSiAfiseaza, 10000); return; }
                afiseazaOferta(oferta);
            })
            .catch(function () { setTimeout(fetchSiAfiseaza, 10000); });
    }

    // daca serverul a injectat oferta valida in window.ofertaInitiala, o folosim direct
    // (evita un fetch inutil la primul load al paginii)
    if (window.ofertaInitiala && new Date(window.ofertaInitiala['data-finalizare']) > new Date()) {
        afiseazaOferta(window.ofertaInitiala);
    } else {
        fetchSiAfiseaza();
    }
})();
