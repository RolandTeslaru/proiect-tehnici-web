// e6b19 - overlay orar de functionare, disponibil pe orice pagina

(function () {
    document.addEventListener("DOMContentLoaded", function () {
        var overlay = document.getElementById("orar-overlay");
        var btnOrar = document.getElementById("btn-orar");
        var btnInchide = document.getElementById("orar-inchide");
        var status = document.getElementById("orar-status");

        if (!overlay || !btnOrar) return;

        // getDay() returneaza 0=Dum, 1=Lun ... 6=Sam
        // in tabel: data-zi 0=Lun ... 5=Sam, 6=Dum
        function indexZiCurenta() {
            var zi = new Date().getDay();
            return zi === 0 ? 6 : zi - 1;
        }

        function actualizeazaOrar() {
            var acum = new Date();
            var indexZi = indexZiCurenta();
            var oraAcum = acum.getHours() + acum.getMinutes() / 60;

            // marcheaza ziua curenta si calculeaza statusul
            var randuri = overlay.querySelectorAll("#orar-tabel tbody tr");
            var randCurent = null;
            randuri.forEach(function (tr) {
                tr.classList.remove("zi-curenta");
                if (parseInt(tr.dataset.zi, 10) === indexZi) {
                    tr.classList.add("zi-curenta");
                    randCurent = tr;
                }
            });

            if (randCurent) {
                var start = parseFloat(randCurent.dataset.start);
                var end = parseFloat(randCurent.dataset.end);
                var esteOpen = start >= 0 && oraAcum >= start && oraAcum < end;
                status.textContent = esteOpen ? "Acum: DESCHIS" : "Acum: INCHIS";
                status.className = esteOpen ? "orar-deschis" : "orar-inchis";
            }
        }

        var timerId = null;

        btnOrar.addEventListener("click", function () {
            actualizeazaOrar();
            overlay.hidden = false;
            clearTimeout(timerId);
            timerId = setTimeout(function () { overlay.hidden = true; }, 5000);
        });

        btnInchide.addEventListener("click", function () {
            overlay.hidden = true;
        });

        // click in afara panoului inchide overlayul
        overlay.addEventListener("click", function (e) {
            if (e.target === overlay) overlay.hidden = true;
        });
    });
})();
