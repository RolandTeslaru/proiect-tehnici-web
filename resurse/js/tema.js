// e6b2 - comutare intre 3 teme: dark, light, tactical
// tema aleasa se tine minte in localStorage si se aplica pe toate paginile

(function () {
    var TEMA_KEY = "tema";
    var TEME_VALIDE = ["dark", "light", "tactical"];

    function aplicaTema(tema) {
        document.documentElement.setAttribute("data-tema", tema);
        // bootstrap stie doar light/dark, tactical merge cu dark ca baza
        document.documentElement.setAttribute("data-bs-theme", tema === "light" ? "light" : "dark");
    }

    var temaSalvata = localStorage.getItem(TEMA_KEY);
    if (TEME_VALIDE.indexOf(temaSalvata) === -1) temaSalvata = "dark";
    aplicaTema(temaSalvata);

    document.addEventListener("DOMContentLoaded", function () {
        var select = document.getElementById("comutator-tema");
        if (!select) return;

        select.value = document.documentElement.getAttribute("data-tema");

        select.addEventListener("change", function () {
            var tema = select.value;
            aplicaTema(tema);
            localStorage.setItem(TEMA_KEY, tema);
        });
    });
})();
