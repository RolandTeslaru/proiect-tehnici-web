const express = require('express');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

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
app.use('/index.css', express.static(path.join(__dirname, 'index.css'))); 

// Variabile globale si initializare erori
global.obGlobal = {
    obErori: null,
    imaginiEroriExistente: true
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
        const stack = [];
        let i = 0;
        let inString = false;
        let escape = false;
        while (i < jsonString.length) {
            const c = jsonString[i];
            if (escape) { 
                escape = false; 
                i++; 
                continue; 
            }
            if (c === '\\' && inString) { 
                escape = true; 
                i++; 
                continue; 
            }
            // Aici e un string real
            if (c === '"') {
                let j = i + 1;
                while (j < jsonString.length) {
                    if (jsonString[j] === '\\') { 
                        j += 2; 
                        continue; 
                    }
                    if (jsonString[j] === '"') break;
                    j++;
                }
                const str = jsonString.substring(i + 1, j);
                // E o cheie daca urmeaza ':' (cu posibil whitespace)
                let k = j + 1;
                while (
                    k < jsonString.length 
                    && 
                    /\s/.test(jsonString[k])
                ) {
                    k++;
                }
                if (
                    jsonString[k] === ':' 
                    && stack.length > 0 
                    && stack[stack.length - 1].type === 'obj'
                ) {
                    const frame = stack[stack.length - 1];
                    if (frame.keys.has(str)) {
                        console.error(`EROARE BONUS: Proprietatea '${str}' apare de mai multe ori in acelasi obiect din erori.json`);
                    } else {
                        frame.keys.add(str);
                    }
                }
                i = j + 1;
                continue;
            }
            if (c === '{') 
                stack.push({ type: 'obj', keys: new Set() });
            else if (c === '}') stack.pop();
            else if (c === '[') stack.push({ type: 'arr' });
            else if (c === ']') stack.pop();
            i++;
        }
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

// Middleware pentru IP si variabile locale
app.use((req, res, next) => {
    res.locals.ip = req.ip;
    next();
});

// Task 19: Creare foldere
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

// Task 16: Forbidden folder access - cerere catre folder din /resurse fara fisier
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

// Task 17: EJS access prevention - orice cerere pentru fisiere .ejs -> 400
app.get(/.*\.ejs$/, (req, res) => {
    afisareEroare(res, 400);
});

// Task 8: Prima pagina
app.get(["/", "/index", "/home"], (req, res) => {
    randeazaPagina(res, 'index');
});

// Task 18: Favicon
app.get("/favicon.ico", (req, res) => {
    res.sendFile(path.join(__dirname, "resurse/ico/favicon.ico"));
});

// Task 9: General route (trebuie sa fie ultimul)
app.get("/*pagina", (req, res) => {
    const segmente = req.params.pagina;
    const pagina = Array.isArray(segmente) ? segmente.join('/') : segmente;
    randeazaPagina(res, pagina);
});

app.listen(port, () => {
    console.log(`Serverul ruleaza la http://localhost:${port}`);
});
