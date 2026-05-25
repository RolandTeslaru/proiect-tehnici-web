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
    var fNume = document.getElementById("f-nume");
    var fPret = document.getElementById("f-pret");
    var fPretVal = document.getElementById("f-pret-val");
    var fAutonomie = document.getElementById("f-autonomie");
    var fDescriere = document.getElementById("f-descriere");
    var fExport = document.getElementById("f-export");
    var fClasificare = document.getElementById("f-clasificare");
    var numarProduse = document.getElementById("numar-produse");
    var mesajGol = document.getElementById("mesaj-gol");

    // arat valoarea aleasa la slider in timp real
    if (fPret && fPretVal) {
        fPret.addEventListener("input", function () {
            fPretVal.textContent = fPret.value;
        });
    }

    // ── helpers ──

    // e6b7 - scoate diacriticele ca sa poata cauta "briose" si sa gaseasca "brioșe"
    function normalizeaza(str) {
        // NFD sparge "ș" in "s" + semn diacritic separat, apoi [̀-ͯ] sterge toate semnele astea
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
        return articole.filter(function (a) { return !a.classList.contains("ascuns"); }).length;
    }

    // e6b15 - numarul de produse vizibile, actualizat dupa fiecare operatie
    // e6b3 - mesajGol apare cand n === 0
    function actualizeazaNumar() {
        var n = numarVizibile();
        if (numarProduse) numarProduse.textContent = "Produse afisate: " + n;
        if (mesajGol) mesajGol.classList.toggle("ascuns", n > 0);
    }

    // ── validare (rulata inainte de filtrare/sortare/calculare) ──
    // intoarce true daca e ok, altfel afiseaza mesaj si intoarce false

    function valideaza() {
        var ok = true;
        var mesaje = [];

        // [0-9] = orice cifra - numele unui produs nu ar trebui sa contina cifre
        if (/[0-9]/.test(fNume.value)) {
            mesaje.push("Campul 'Nume contine' nu poate avea cifre.");
            ok = false;
        }

        // textarea: daca e scris ceva, trebuie sa fie cuvinte (fara cifre) si sa existe macar un cuvant
        var textDesc = fDescriere.value.trim();
        var textInvalid = false;
        if (textDesc !== "") {
            // acelasi [0-9] - cuvintele cheie sunt text, nu numere
            if (/[0-9]/.test(textDesc)) {
                textInvalid = true;
                mesaje.push("Cuvintele cheie nu pot contine cifre.");
            } else {
                var cuvinte = textDesc.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
                if (cuvinte.length === 0) {
                    textInvalid = true;
                    mesaje.push("Introduceti cel putin un cuvant cheie valid.");
                }
            }
        }
        // marcaj vizual pe textarea (se corecteaza singur cand devine valid)
        fDescriere.classList.toggle("is-invalid", textInvalid);
        if (textInvalid) ok = false;

        if (!ok) {
            alert(mesaje.join("\n"));
        }
        return ok;
    }

    // textarea: scot marcajul de invalid de indata ce valoarea redevine ok
    fDescriere.addEventListener("input", function () {
        var t = fDescriere.value.trim();
        // [0-9] - refolosesc aceeasi regula ca in valideaza()
        var rau = t !== "" && (/[0-9]/.test(t) ||
            t.split(",").map(function (s) { return s.trim(); }).filter(Boolean).length === 0);
        fDescriere.classList.toggle("is-invalid", rau);
    });

    // ── filtrarea propriu-zisa ──

    function potrivesteUnArticol(a) {
        // nume
        var nume = normalizeaza(fNume.value.trim());
        if (nume && normalizeaza(a.dataset.nume).indexOf(nume) === -1) return false;

        // pret maxim
        if (Number(a.dataset.pret) > Number(fPret.value)) return false;

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

        return true;
    }

    function filtreaza() {
        if (!valideaza()) return;
        articole.forEach(function (a) {
            if (a.classList.contains("session-ascuns")) return; // b6 buton3: raman ascunse tot timpul
            if (a.classList.contains("pinned")) { a.classList.remove("ascuns"); return; } // b6 buton1: pinned raman vizibile
            a.classList.toggle("ascuns", !potrivesteUnArticol(a));
        });
        actualizeazaNumar();
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
        if (!valideaza()) return;
        var cheie1 = document.getElementById("sort-cheie1").value;
        var cheie2 = document.getElementById("sort-cheie2").value;
        var copie = articole.slice();
        copie.sort(function (x, y) {
            var d1 = valoareCheie(x, cheie1) - valoareCheie(y, cheie1);
            if (d1 !== 0) return crescator ? d1 : -d1;
            var d2 = valoareCheie(x, cheie2) - valoareCheie(y, cheie2);
            return crescator ? d2 : -d2;
        });
        copie.forEach(function (a) { lista.appendChild(a); });
        actualizeazaNumar();
    }

    // ── calculare: media preturilor produselor vizibile, intr-un div fix care dispare ──

    function calculeaza() {
        if (!valideaza()) return;
        var vizibile = articole.filter(function (a) { return !a.classList.contains("ascuns"); });
        var div = document.createElement("div");
        div.className = "rezultat-calcul";
        if (vizibile.length === 0) {
            div.textContent = "Nu exista produse afisate pentru calcul.";
        } else {
            var suma = vizibile.reduce(function (s, a) { return s + Number(a.dataset.pret); }, 0);
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
        fPret.value = fPret.max;
        if (fPretVal) fPretVal.textContent = fPret.max;
        fAutonomie.value = "";
        fDescriere.value = "";
        fDescriere.classList.remove("is-invalid");
        fExport.value = "";

        var oricare = document.querySelector('input[name="f-livrare"][value=""]');
        if (oricare) oricare.checked = true;

        document.querySelectorAll('input[name="f-compat"]').forEach(function (c) { c.checked = true; });
        Array.from(fClasificare.options).forEach(function (o) { o.selected = true; });

        // resetez si cheile de sortare la default (pret / nrcompat)
        document.getElementById("sort-cheie1").value = "pret";
        document.getElementById("sort-cheie2").value = "nrcompat";

        // arat tot (mai putin cele ascunse pe sesiune) si pun ordinea initiala la loc
        articole.forEach(function (a) {
            if (!a.classList.contains("session-ascuns")) a.classList.remove("ascuns");
        });
        ordineInitiala.forEach(function (a) { lista.appendChild(a); });

        actualizeazaNumar();
    }

    // ── legare butoane ──
    document.getElementById("btn-filtreaza").addEventListener("click", filtreaza);
    document.getElementById("btn-sort-asc").addEventListener("click", function () { sorteaza(true); });
    document.getElementById("btn-sort-desc").addEventListener("click", function () { sorteaza(false); });
    document.getElementById("btn-calculeaza").addEventListener("click", calculeaza);
    document.getElementById("btn-reseteaza").addEventListener("click", reseteaza);

    // e6b4 - filtrare live la onchange pe toate cele 8 inputuri
    function filtreazaLive() {
        var numeOk = !/[0-9]/.test(fNume.value);
        var descText = fDescriere.value.trim();
        var descOk = descText === "" || (!/[0-9]/.test(descText) &&
            descText.split(",").map(function(s){ return s.trim(); }).filter(Boolean).length > 0);
        if (!numeOk || !descOk) return;
        articole.forEach(function (a) {
            if (a.classList.contains("session-ascuns")) return;
            if (a.classList.contains("pinned")) { a.classList.remove("ascuns"); return; }
            a.classList.toggle("ascuns", !potrivesteUnArticol(a));
        });
        actualizeazaNumar();
    }

    // toate cele 8 inputuri
    fNume.addEventListener("input", filtreazaLive);
    fPret.addEventListener("input", filtreazaLive);
    fAutonomie.addEventListener("input", filtreazaLive);
    fDescriere.addEventListener("input", filtreazaLive);
    fExport.addEventListener("change", filtreazaLive);
    fClasificare.addEventListener("change", filtreazaLive);
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
        var diferentaZile = (acum - dataAdaugare) / (1000 * 60 * 60 * 24);
        if (diferentaZile <= T_ZILE) {
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
                e.stopPropagation(); // nu deschide modalul
                var ePin = a.classList.toggle("pinned");
                btnPin.classList.toggle("activ", ePin);
                btnPin.querySelector("i").className = ePin ? "bi bi-pin-fill" : "bi bi-pin";
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

    actualizeazaNumar();

    // e6b11 - modal quick-view la click pe articol (nu pe linkul h3 care merge la pagina dedicata)
    // fiecare articol are propriul modal randat server-side ca fragment EJS
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
