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
    folderCss: path.join(__dirname, 'resurse', 'css'),
    // e6b19 - orar de functionare; 0=Luni ... 6=Duminica
    orar: [
        { zi: "Luni",     start: 8,    end: 17   },
        { zi: "Marti",    start: 8,    end: 17   },
        { zi: "Miercuri", start: 8,    end: 17   },
        { zi: "Joi",      start: 8,    end: 17   },
        { zi: "Vineri",   start: 8,    end: 15   },
        { zi: "Sambata",  start: 9,    end: 13   },
        { zi: "Duminica", start: null, end: null }
    ]
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
        console.error(`EROARE: Folderul specificat in cale_galerie '${caleBazaAbs}' nu exista!`);
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
        const ofertaCurenta = getOfertaCurenta(); // e6b12
        res.render('pagini/index', { imagini, produsNoi, ofertaCurenta }, (err, rezultatRandare) => {
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

// e6b9 - citeste toate imaginile dintr-un folder de produs si le returneaza ca array de cai relative
function getImaginiProdus(folderRelativ) {
    const folderAbs = path.join(__dirname, folderRelativ);
    if (!fs.existsSync(folderAbs)) return [];
    return fs.readdirSync(folderAbs)
        .filter(f => /\.(jpg|jpeg|png|webp|avif)$/i.test(f))
        .sort()
        .map(f => folderRelativ + '/' + f);
}

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

        // e6b9 - rezolv prima imagine din folder ca thumbnail pt lista de produse
        produse.forEach(p => {
            const imagini = getImaginiProdus(p.imagine);
            p.imagine = imagini[0] || p.imagine;
        });

        // e6b1 - atributele inputurilor generate din datele din baza de date
        const preturi = produse.map(p => Number(p.pret));
        const minPret = preturi.length ? Math.floor(Math.min(...preturi)) : 0; 
        const maxPret = preturi.length ? Math.ceil(Math.max(...preturi)) : 0;  
        const autonomii = [...new Set(produse.map(p => p.autonomie_km))].sort((a, b) => a - b); // sort numeric crescator
        const livrari = [...new Set(produse.map(p => p.tip_livrare))];
        const clasificari = [...new Set(produse.map(p => p.nivel_clasificare))];
        const compatibilitati = [...new Set(
            produse.flatMap(p => p.compatibilitati.split(",").map(c => c.trim()).filter(Boolean)) // trim - elimina spatii in jurul fiecarei valori din CSV
        )].sort(); // sort alfabetic

        res.render('pagini/produse', { produse, categorieCurenta: categorie || null, minPret, maxPret, autonomii, livrari, clasificari, compatibilitati }, (err, html) => {
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
        // e6b9 - toate imaginile din folderul produsului pt carusel
        const imagini = getImaginiProdus(produs.imagine);

        // e6b16 - produse similare: aceeasi categorie, max 4
        const produseSimilare = await bazaDate.getProduseSimilare(produs.categorie, id, 4);
        // e6b9 - rezolv prima imagine din folder pt thumbnail produse similare
        produseSimilare.forEach(ps => {
            const img = getImaginiProdus(ps.imagine);
            ps.imagine = img[0] || ps.imagine;
        });
        res.render('pagini/produs', { produs, produseSimilare, imagini }, (err, html) => {
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

// e6b5 + e6b10 - API filtrare/sortare server-side cu fetch() + paginare
const PER_PAGINA = 6;

app.get('/api/produse', async (req, res) => {
    try {
        const q = req.query;
        const compatibilitati = q['compatibilitati[]'] ? [].concat(q['compatibilitati[]']) : [];
        const clasificari = q['clasificari[]'] ? [].concat(q['clasificari[]']) : [];

        const params = {
            categorie: q.categorie || null,
            numeContine: q.numeContine || '',
            pretMin: q.pretMin !== undefined ? q.pretMin : '',
            pretMax: q.pretMax !== undefined ? q.pretMax : '',
            autonomieMin: q.autonomieMin || '',
            tipLivrare: q.tipLivrare || '',
            compatibilitati,
            compatNone: q.compatNone === '1',
            clasificari,
            exportPermis: q.exportPermis !== undefined ? q.exportPermis : '',
            nrCompatMin: q.nrCompatMin || 0,
            dataMin: q.dataMin || '',
            descriere: q.descriere || '',
            sortCheie1: q.sortCheie1 || 'pret',
            sortCheie2: q.sortCheie2 || 'id',
            sortDir: q.sortDir === 'desc' ? 'desc' : 'asc',
            pagina: parseInt(q.pagina) || 1,
            perPagina: PER_PAGINA
        };

        const { produse, total } = await bazaDate.getProdusFiltrate(params);

        produse.forEach(p => {
            const imgs = getImaginiProdus(p.imagine);
            p.imagine = imgs[0] || p.imagine;
        });

        const fragmentPath = path.join(__dirname, 'views', 'fragmente', '_articolProdus.ejs');
        let html = '';
        for (const produs of produse) {
            html += await ejs.renderFile(fragmentPath, { produs });
        }

        const totalPagini = Math.ceil(total / PER_PAGINA) || 1;
        res.json({ html, total, pagina: params.pagina, totalPagini, perPagina: PER_PAGINA });
    } catch (err) {
        console.error(err);
        res.status(500).json({ eroare: err.message });
    }
});

// e6b20 - pagina de comparare a doua produse, deschisa intr-o fereastra noua
app.get('/comparare', async (req, res) => {
    try {
        const id1 = parseInt(req.query.id1);
        const id2 = parseInt(req.query.id2);
        if (!id1 || !id2) return afisareEroare(res, 400, 'Parametri lipsa', 'Specificati doua produse pentru comparare.');
        const [p1, p2] = await Promise.all([
            bazaDate.getProdusDupaId(id1),
            bazaDate.getProdusDupaId(id2)
        ]);
        if (!p1 || !p2) return afisareEroare(res, 404, 'Produs negasit', 'Unul dintre produse nu exista.');
        res.render('pagini/comparare', { p1, p2 });
    } catch (err) {
        console.error(err);
        afisareEroare(res, 500);
    }
});

// e6b12 - oferta curenta pentru client (timer + preturi)
app.get('/api/oferta-curenta', (req, res) => {
    res.json(getOfertaCurenta());
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

    // e6b12 - prima oferta la pornire, apoi la fiecare OFERTA_INTERVAL_MS
    await genereazaOferta();
    setInterval(genereazaOferta, OFERTA_INTERVAL_MS);

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
                fs.unlinkSync(cale);            // sterge
                console.log('backup sters ', cale);
            }
        }
    });
}

setInterval(function() {
    stergeBackupVechi(BACKUP_DIR);
}, BACKUP_T_MINUTE * 60 * 1000);

// e6b12 - sistem oferte cu timer
const OFERTA_INTERVAL_MS = 2 * 60 * 1000;
const OFERTA_T2_MS = 10 * 60 * 1000;
const REDUCERI_POSIBILE = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
const CALE_OFERTE = path.join(__dirname, 'oferte.json');

function citesteOferte() {
    try {
        if (!fs.existsSync(CALE_OFERTE)) return { oferte: [] };
        return JSON.parse(fs.readFileSync(CALE_OFERTE, 'utf8'));
    } catch (e) { return { oferte: [] }; }
}

function scrieOferte(obj) {
    fs.writeFileSync(CALE_OFERTE, JSON.stringify(obj, null, 2), 'utf8');
}

function getOfertaCurenta() {
    const obj = citesteOferte();
    const acum = Date.now();
    for (const o of obj.oferte) {
        const fin = new Date(o['data-finalizare']).getTime();
        const inc = new Date(o['data-incepere']).getTime();
        if (inc <= acum && fin > acum) return o;
    }
    return null;
}

// e6b12 - genereaza o noua oferta si o salveaza in oferte.json
// chemata la pornirea serverului si apoi la fiecare OFERTA_INTERVAL_MS prin setInterval
async function genereazaOferta() {
    const categorii = global.obGlobal.categoriiProduse;
    // categoriile sunt incarcate din DB la pornire; daca lipsesc, nu putem genera
    if (!categorii || !categorii.length) return;

    const obj = citesteOferte();
    const acum = Date.now();

    // curatenie T2: elimina ofertele expirate de mai mult de OFERTA_T2_MS
    obj.oferte = obj.oferte.filter(o => {
        const fin = new Date(o['data-finalizare']).getTime();
        return acum - fin < OFERTA_T2_MS;
    });

    // daca exista deja o oferta activa, nu generam alta (evita dubluri la restart)
    const areActiva = obj.oferte.some(o => {
        const fin = new Date(o['data-finalizare']).getTime();
        return new Date(o['data-incepere']).getTime() <= acum && fin > acum;
    });
    if (areActiva) { scrieOferte(obj); return; } // salveaza doar curatenia T2

    // alegere categorie: oricare din DB, dar diferita de cea a ofertei precedente
    const ultimaCategorie = obj.oferte.length ? obj.oferte[0].categorie : null;
    const catDisponibile = categorii.filter(c => c !== ultimaCategorie);
    const catAleasa = catDisponibile[Math.floor(Math.random() * catDisponibile.length)];

    // reducere aleatoare din multimea [5, 10, 15, ..., 50]
    const reducere = REDUCERI_POSIBILE[Math.floor(Math.random() * REDUCERI_POSIBILE.length)];

    const incepere = new Date();
    const finalizare = new Date(incepere.getTime() + OFERTA_INTERVAL_MS);

    // noua oferta se pune la inceputul vectorului (cea mai recenta e prima)
    obj.oferte.unshift({
        categorie: catAleasa,
        'data-incepere': incepere.toISOString(),
        'data-finalizare': finalizare.toISOString(),
        reducere
    });

    scrieOferte(obj);
    console.log(`Oferta: -${reducere}% la "${catAleasa}" pana la ${finalizare.toLocaleTimeString('ro-RO')}`);
}
