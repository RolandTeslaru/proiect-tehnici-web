const express = require('express');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const sass = require('sass');
const sharp = require('sharp');
const bazaDate = require('./bazaDate');

const app = express();
const port = 8080;

// 1. Taskuri etapa 4
console.log("Calea folderului index.js (__dirname):", __dirname);
console.log("Calea fisierului (__filename):", __filename);
console.log("Folderul curent de lucru (process.cwd()):", process.cwd());

// Configurare EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Definire folder static
app.use('/resurse', express.static(path.join(__dirname, 'resurse')));

// Variabile globale si initializare erori
global.obGlobal = {
    obErori: null,
    imaginiEroriExistente: true,
    obGalerie: null,
    // categoriile le iau din DB o data la pornire si le tin aici pt meniu
    categoriiProduse: [],
    // e5 compilare-scss: folderScss si folderCss in obGlobal
    folderScss: path.join(__dirname, 'resurse', 'scss'),
    folderCss: path.join(__dirname, 'resurse', 'css')
};

function initErori() {
    const caleErori = path.join(__dirname, 'erori.json');
    
    // Bonus: Verificare existenta fisier
    if (!fs.existsSync(caleErori)) {
        console.error("EROARE CRITICA: Fisierul erori.json nu exista!");
        process.exit(1);
    }

    let textJson = fs.readFileSync(caleErori, 'utf8');
    
    // Bonus: Verificare proprietate specificata de mai multe ori per obiect (pe string)
    function verificaDuplicate(jsonString) {
        const obiecte = jsonString.match(/\{[^{}]*\}/g) || [];
        obiecte.forEach(obiect => {
            const chei = [];
            const regex = /"(\w+)"\s*:/g;
            let match;
            while ((match = regex.exec(obiect)) !== null) {
                const cheie = match[1];
                if (chei.includes(cheie)) {
                    console.error(`EROARE BONUS: Proprietatea '${cheie}' apare de mai multe ori in acelasi obiect din erori.json`);
                } else {
                    chei.push(cheie);
                }
            }
        });
    }
    verificaDuplicate(textJson);

    let obErori = JSON.parse(textJson);
    
    // Bonus: Verificare proprietati obligatorii
    const propObligatorii = ['info_erori', 'cale_baza', 'eroare_default'];
    propObligatorii.forEach(prop => {
        if (!obErori[prop]) {
            console.error(`EROARE: Proprietatea '${prop}' lipseste din erori.json`);
        }
    });

    if (obErori.eroare_default) {
        ['titlu', 'text', 'imagine'].forEach(prop => {
            if (!obErori.eroare_default[prop]) {
                console.error(`EROARE: Proprietatea '${prop}' lipseste din eroare_default`);
            }
        });
    }

    // Bonus: Verificare folder cale_baza
    const caleBazaAbs = path.join(__dirname, obErori.cale_baza);
    if (!fs.existsSync(caleBazaAbs)) {
        console.error(`EROARE: Folderul specificat in cale_baza '${caleBazaAbs}' nu exista!`);
    }

    // Procesare imagini si verificare existenta
    obErori.info_erori.forEach(eroare => {
        const caleImagineRelativa = path.join(obErori.cale_baza, eroare.imagine);
        const caleImagineAbsoluta = path.join(__dirname, caleImagineRelativa);
        
        if (!fs.existsSync(caleImagineAbsoluta)) {
            console.error(`EROARE: Imaginea '${eroare.imagine}' pentru eroarea ${eroare.identificator} nu exista la calea ${caleImagineAbsoluta}`);
            global.obGlobal.imaginiEroriExistente = false;
        }
        
        // Setam calea relativa la server pentru randare
        eroare.imagine = caleImagineRelativa;
    });

    // Imagine default
    if (obErori.eroare_default) {
        obErori.eroare_default.imagine = path.join(obErori.cale_baza, obErori.eroare_default.imagine);
    }

    // Bonus: Verificare ID-uri duplicate
    const ids = obErori.info_erori.map(e => e.identificator);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
        console.error("EROARE: Exista identificatori duplicati in info_erori:", duplicateIds);
    }

    global.obGlobal.obErori = obErori;
}

initErori();

// ============================================================
//  e5 compilare-scss (0.25p)
// ============================================================

// e5b4 compilare-scss: lastIndexOf pt fisiere cu puncte in nume (stil.frumos.scss)
function schimbaExtensiaCss(numeFisier) {
    const idx = numeFisier.lastIndexOf('.');
    const baza = idx === -1 ? numeFisier : numeFisier.slice(0, idx);
    return baza + '.css';
}

// e5 compilare-scss: functia compileazaScss (cai relative/absolute, backup, sass.compile)
function compileazaScss(caleScss, caleCss) {
    const { folderScss, folderCss } = global.obGlobal;

    const caleScssAbs = path.isAbsolute(caleScss)
        ? caleScss
        : path.join(folderScss, caleScss);

    // daca lipseste calea css -> numele scss-ului cu extensia .css
    let caleCssAbs;
    if (!caleCss) {
        const numeCss = schimbaExtensiaCss(path.basename(caleScssAbs));
        caleCssAbs = path.join(folderCss, numeCss);
    } else {
        caleCssAbs = path.isAbsolute(caleCss)
            ? caleCss
            : path.join(folderCss, caleCss);
    }

    // e5 compilare-scss: backup la css-ul vechi inainte de suprascrierea sa
    if (fs.existsSync(caleCssAbs)) {
        try {
            const folderBackupCss = path.join(__dirname, 'backup', 'resurse', 'css');
            fs.mkdirSync(folderBackupCss, { recursive: true });
            // e5b3 compilare-scss: timestamp in numele fisierului de backup (a.css -> a_<timestamp>.css)
            const numeCss = path.basename(caleCssAbs);
            const numeBackup = schimbaExtensiaCss(numeCss).replace(/\.css$/, '') + '_' + Date.now() + '.css';
            fs.copyFileSync(caleCssAbs, path.join(folderBackupCss, numeBackup));
        } catch (err) {
            console.error(`EROARE la copierea in backup a fisierului ${caleCssAbs}: ${err.message}`);
        }
    }

    try {
        const rezultat = sass.compile(caleScssAbs, {
            loadPaths: [path.join(__dirname, 'node_modules')],
            style: 'expanded',
            quietDeps: true,
            silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function']
        });
        fs.mkdirSync(path.dirname(caleCssAbs), { recursive: true });
        fs.writeFileSync(caleCssAbs, rezultat.css, 'utf8');
        console.log(`SCSS compilat: ${path.basename(caleScssAbs)} -> ${path.relative(__dirname, caleCssAbs)}`);
    } catch (err) {
        console.error(`EROARE la compilarea ${caleScssAbs}: ${err.message}`);
    }
}

// e5 compilare-scss: compilare initiala a tuturor scss-urilor (sare partialele _*.scss)
function compileazaToateScss() {
    const { folderScss } = global.obGlobal;
    if (!fs.existsSync(folderScss)) {
        console.error(`EROARE: Folderul scss '${folderScss}' nu exista!`);
        return;
    }
    fs.readdirSync(folderScss).forEach(fisier => {
        if (fisier.endsWith('.scss') && !fisier.startsWith('_')) {
            compileazaScss(fisier);
        }
    });
}

compileazaToateScss();

// e5 compilare-scss: compilare pe parcurs cu fs.watch + debounce (fs.watch da evenimente duble)
const ultimeCompilari = {};
fs.watch(global.obGlobal.folderScss, (event, filename) => {
    if (!filename || !filename.endsWith('.scss')) return;

    const acum = Date.now();
    if (ultimeCompilari[filename] && acum - ultimeCompilari[filename] < 300) return;
    ultimeCompilari[filename] = acum;

    if (filename.startsWith('_')) {
        // partial modificat -> recompilez tot (fisierele principale depind de el)
        console.log(`Partial ${filename} modificat -> recompilez toate scss-urile.`);
        compileazaToateScss();
    } else {
        const caleCompleta = path.join(global.obGlobal.folderScss, filename);
        if (fs.existsSync(caleCompleta)) {
            console.log(`Modificare detectata in ${filename} -> recompilez.`);
            compileazaScss(filename);
        }
    }
});

// e5 galerie-statica: initGalerie la pornire + e5b5 validare JSON
function initGalerie() {
    const caleGalerieJson = path.join(__dirname, 'galerie.json');

    if (!fs.existsSync(caleGalerieJson)) {
        console.error("EROARE: Fisierul galerie.json nu exista!");
        return;
    }

    let obGalerie;
    try {
        obGalerie = JSON.parse(fs.readFileSync(caleGalerieJson, 'utf8'));
    } catch (err) {
        console.error(`EROARE: galerie.json nu este JSON valid: ${err.message}`);
        return;
    }

    // e5b5 galerie-statica: verificare existenta folder cale_galerie
    const folderGalerieAbs = path.join(__dirname, obGalerie.cale_galerie || '');
    if (!obGalerie.cale_galerie || !fs.existsSync(folderGalerieAbs)) {
        console.error(`EROARE: Folderul galeriei specificat in 'cale_galerie' ('${obGalerie.cale_galerie}') nu exista in sistemul de fisiere la calea ${folderGalerieAbs}.`);
    } else {
        // e5b5 galerie-statica: verificare existenta fiecarui fisier imagine din JSON
        (obGalerie.imagini || []).forEach(img => {
            const caleImg = path.join(folderGalerieAbs, img.cale_fisier);
            if (!fs.existsSync(caleImg)) {
                console.error(`EROARE: Imaginea '${img.cale_fisier}' din galerie.json nu exista pe disc la calea ${caleImg}.`);
            }
        });
    }

    global.obGlobal.obGalerie = obGalerie;
}

initGalerie();

const LUNI_RO = ["ianuarie", "februarie", "martie", "aprilie", "mai", "iunie",
    "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"];

// e5 galerie-statica: generare variante -medium/-small cu sharp la prima cerere a paginii
async function genereazaVarianteImagine(folderGalerieAbs, numeFisier) {
    const idx = numeFisier.lastIndexOf('.');
    const baza = idx === -1 ? numeFisier : numeFisier.slice(0, idx);
    const ext = idx === -1 ? '' : numeFisier.slice(idx);

    const variante = [
        { sufix: '-medium', latime: 300 },
        { sufix: '-small', latime: 180 }
    ];

    for (const v of variante) {
        const caleVarianta = path.join(folderGalerieAbs, baza + v.sufix + ext);
        if (!fs.existsSync(caleVarianta)) {
            try {
                await sharp(path.join(folderGalerieAbs, numeFisier))
                    .resize({ width: v.latime })
                    .toFile(caleVarianta);
            } catch (err) {
                console.error(`EROARE la generarea variantei ${caleVarianta}: ${err.message}`);
            }
        }
    }
}

// e5 galerie-statica: filtrare dupa luna curenta, trunchiere la 12, alt fallback
async function getImaginiGalerie(dataCurenta = new Date()) {
    const obGalerie = global.obGlobal.obGalerie;
    if (!obGalerie || !Array.isArray(obGalerie.imagini)) return [];

    const lunaCurenta = LUNI_RO[dataCurenta.getMonth()];
    const folderGalerieRel = obGalerie.cale_galerie;
    const folderGalerieAbs = path.join(__dirname, folderGalerieRel);

    // Filtrare dupa luna
    let potrivite = obGalerie.imagini.filter(img =>
        Array.isArray(img.luni) && img.luni.includes(lunaCurenta));

    // Trunchiere la maxim 12 (implementat in program)
    potrivite = potrivite.slice(0, 12);

    const rezultat = [];
    for (const img of potrivite) {
        await genereazaVarianteImagine(folderGalerieAbs, img.cale_fisier);

        const idx = img.cale_fisier.lastIndexOf('.');
        const baza = idx === -1 ? img.cale_fisier : img.cale_fisier.slice(0, idx);
        const ext = idx === -1 ? '' : img.cale_fisier.slice(idx);
        const caleWeb = '/' + folderGalerieRel.split(path.sep).join('/');

        rezultat.push({
            titlu: img.titlu || img.cale_fisier,
            alt: img.alt || img.cale_fisier,
            text_descriere: img.text_descriere || '',
            atribuire: img.atribuire || null,
            src_large: `${caleWeb}/${img.cale_fisier}`,
            src_medium: `${caleWeb}/${baza}-medium${ext}`,
            src_small: `${caleWeb}/${baza}-small${ext}`
        });
    }
    return rezultat;
}

/**
 * Functie de afisare a erorilor
 */
function afisareEroare(res, identificator, titlu, text, imagine) {
    let eroareGasita = global.obGlobal.obErori.info_erori.find(e => e.identificator == identificator);
    let eroareDefault = global.obGlobal.obErori.eroare_default;

    let resTitlu = titlu || (eroareGasita ? eroareGasita.titlu : eroareDefault.titlu);
    let resText = text || (eroareGasita ? eroareGasita.text : eroareDefault.text);
    let resImagine = imagine || (eroareGasita ? eroareGasita.imagine : eroareDefault.imagine);
    
    let status = (eroareGasita && eroareGasita.status) ? identificator : 200;

    res.status(status).render('pagini/eroare', {
        titlu: resTitlu,
        text: resText,
        imagine: resImagine,
        ip: res.locals.ip
    });
}

// salvare ip prin middeware
app.use((req, res, next) => {
    res.locals.ip = req.ip;
    // le pun in locals ca sa le am in meniu pe orice pagina
    res.locals.categoriiProduse = global.obGlobal.categoriiProduse;
    next();
});

// T19: Creare foldere (e5 compilare-scss: "backup" inclus pentru salvarea fisierelor css vechi)
const vect_foldere = ["temp", "logs", "backup", "fisiere_uploadate"];
vect_foldere.forEach(f => {
    const cale = path.join(__dirname, f);
    if (!fs.existsSync(cale)) {
        fs.mkdirSync(cale);
        console.log(`Folder creat: ${f}`);
    }
});

function randeazaPagina(res, numePagina) {
    res.render('pagini/' + numePagina, (err, rezultatRandare) => {
        if (err) {
            if (err.message.startsWith("Failed to lookup view")) {
                afisareEroare(res, 404);
            } else {
                console.error(err);
                afisareEroare(res, 500, "Eroare Server", "A aparut o eroare la procesarea paginii.");
            }
        } else {
            res.send(rezultatRandare);
        }
    });
}

// T16: Forbidden folder access - cerere catre folder din /resurse fara fisier
app.get("/resurse/*cale", (req, res, next) => {
    const segmente = req.params.cale;
    const ultim = Array.isArray(segmente) ? segmente[segmente.length - 1] : segmente;
    const calePeDisc = path.join(__dirname, 'resurse', ...(Array.isArray(segmente) ? segmente : [segmente]));
    // Daca path-ul se termina cu / sau e director existent -> 403
    if (req.url.endsWith('/') || (fs.existsSync(calePeDisc) && fs.statSync(calePeDisc).isDirectory())) {
        return afisareEroare(res, 403);
    }
    next();
});

// T17: EJS access prevention - orice cerere pentru fisiere .ejs -> 400
app.get(/.*\.ejs$/, (req, res) => {
    afisareEroare(res, 400);
});

// e5 galerie-statica: ruta index — apeleaza getImaginiGalerie si transmite imaginile
// e6b18 - trimite si produsele noi (ultimele 365 zile, max 6) pt sectiunea de pe homepage
app.get(["/", "/index", "/home"], async (req, res) => {
    try {
        const [imagini, produsNoi] = await Promise.all([
            getImaginiGalerie(),
            bazaDate.getProdusNoi(365, 6)
        ]);
        res.render('pagini/index', { imagini, produsNoi }, (err, rezultatRandare) => {
            if (err) {
                console.error(err);
                afisareEroare(res, 500, "Eroare Server", "A aparut o eroare la procesarea paginii.");
            } else {
                res.send(rezultatRandare);
            }
        });
    } catch (err) {
        console.error(err);
        afisareEroare(res, 500, "Eroare Server", "A aparut o eroare la incarcarea galeriei.");
    }
});

// e5 galerie-statica: ruta /galerie — pagina dedicata, foloseste acelasi fragment partajat
app.get("/galerie", async (req, res) => {
    try {
        const imagini = await getImaginiGalerie();
        res.render('pagini/galerie', { imagini }, (err, rezultatRandare) => {
            if (err) {
                console.error(err);
                afisareEroare(res, 500, "Eroare Server", "A aparut o eroare la procesarea paginii.");
            } else {
                res.send(rezultatRandare);
            }
        });
    } catch (err) {
        console.error(err);
        afisareEroare(res, 500, "Eroare Server", "A aparut o eroare la incarcarea galeriei.");
    }
});

// rute produse

// toate suboptiunile din meniu lovesc aceeasi ruta, doar cu alt query
// /produse = tot, /produse?categorie=X = doar categoria aia (filtrare pe server)
app.get("/produse", async (req, res) => {
    try {
        let categorie = req.query.categorie;
        // daca cineva pune o categorie inventata in url, o ignor
        if (categorie && !global.obGlobal.categoriiProduse.includes(categorie)) {
            categorie = null;
        }
        const produse = await bazaDate.getProduse(categorie);
        res.render('pagini/produse', { produse, categorieCurenta: categorie || null }, (err, html) => {
            if (err) {
                console.error(err);
                afisareEroare(res, 500, "Eroare Server", "A aparut o eroare la afisarea produselor.");
            } else {
                res.send(html);
            }
        });
    } catch (err) {
        console.error(err);
        afisareEroare(res, 500, "Eroare Server", "A aparut o eroare la preluarea produselor din baza de date.");
    }
});

// pagina unui singur produs, generata din ce e in DB
app.get("/produs/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (Number.isNaN(id)) {
            return afisareEroare(res, 404);
        }
        const produs = await bazaDate.getProdusDupaId(id);
        if (!produs) {
            return afisareEroare(res, 404, "Produs inexistent", "Produsul cautat nu a fost gasit in catalog.");
        }
        // e6b16 - produse similare: aceeasi categorie, max 4
        const produseSimilare = await bazaDate.getProduseSimilare(produs.categorie, id, 4);
        res.render('pagini/produs', { produs, produseSimilare }, (err, html) => {
            if (err) {
                console.error(err);
                afisareEroare(res, 500, "Eroare Server", "A aparut o eroare la afisarea produsului.");
            } else {
                res.send(html);
            }
        });
    } catch (err) {
        console.error(err);
        afisareEroare(res, 500, "Eroare Server", "A aparut o eroare la preluarea produsului din baza de date.");
    }
});

// T18: Favicon
app.get("/favicon.ico", (req, res) => {
    res.sendFile(path.join(__dirname, "resurse/ico/favicon.ico"));
});

// T9: 
app.get("/*pagina", (req, res) => {
    const segmente = req.params.pagina;
    const pagina = Array.isArray(segmente) ? segmente.join('/') : segmente;
    randeazaPagina(res, pagina);
});

// iau categoriile din DB inainte sa pornesc serverul, ca sa am meniul gata
async function pornesteServer() {
    try {
        global.obGlobal.categoriiProduse = await bazaDate.getValoriEnum('categorie');
        console.log('Categorii produse (din DB):', global.obGlobal.categoriiProduse);
    } catch (err) {
        console.error('EROARE la incarcarea categoriilor din baza de date:', err.message);
    }

    app.listen(port, () => {
        console.log(`Serverul ruleaza la http://localhost:${port}`);
    });
}

pornesteServer();

// e6b13 - sterge recursiv fisierele din backup mai vechi de T minute
var BACKUP_T_MINUTE = 30;
var BACKUP_DIR = path.join(__dirname, 'backup');

function stergeBackupVechi(dir) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(function(nume) {
        var cale = path.join(dir, nume);
        var stat = fs.statSync(cale);
        if (stat.isDirectory()) {
            stergeBackupVechi(cale);
        } else {
            var varstaMinute = (Date.now() - stat.mtimeMs) / 60000;
            if (varstaMinute > BACKUP_T_MINUTE) {
                fs.unlinkSync(cale);
                console.log('backup sters (>' + BACKUP_T_MINUTE + 'min):', cale);
            }
        }
    });
}

setInterval(function() {
    stergeBackupVechi(BACKUP_DIR);
}, BACKUP_T_MINUTE * 60 * 1000);
