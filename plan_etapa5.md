CERINTA ETAPA % + BONSURI + CERINTE INDIVIDUALE: 
Etapa 5 (1.1p)
(0.35) Galeria statica (cerință individuală)
(0.25) Compilare automata scss. Se vor realiza următoarele subpuncte:
Pregătire cadru de lucru. Se vor defini în obiectul global două proprietăți folderScss și folderCss care conțin căile din folderul de resurse (depinzând de __dirname). Se va adăuga folderul backup la lista folderelor create automat de aplicație (așa cum e și folderul temp)
Funcția de compilare a scss-urilor. Se va face o funcție compileazaScss(caleScss, caleCss){} care compileaza un fișier scss în fișier css.   Primii 2 parametrii reprezintă căile către fișierul scss (inputul funcției) și fisierul css (outputul funcției). Dacă avem căi absolute se iau fișierele de la cele două căi, iar dacă sunt relative se vor considera relative la folderScss, respectiv folderCss. compilarea se va face cu ajutorul pachetului sass. Dacă numele/calea fișierului css lipsește, se va salva în folderCss rezultatul compilarii folosind numele fișierului scss, dar cu extensia css
Salvare în backup. În cadrul funcției compileazaScss, înainte de compilarea automată a scss-ului în fișierul css asociat, fișierul css vechi cu același nume va fi copiat în subcalea resurse/css a folderului backup. Orice folder din această subcale va fi creat dacă nu există deja. Se va afișa un mesaj de eroare în cazul eșecului copierii.
Compilare inițială. La pornirea serverului, toate fisierele scss din folderScss trebuie să fie compilate în fișierele css cu același nume folosind funcția compileazaScss. Înainte de suprascrierea fișierului css, acesta va fi copiat în folderul backup (suprascriind un backup cu același nume - sau dacă vreți să păstrați backup-urile anterioare puteți integra în nume o informație cu privire la timpul creării.
Compilare pe parcurs. Se va scrie cod (folosind fs.watch()) astfel încât să se urmărească modificările din folderul de fișiere scss. La modificarea/crearea unui fișier acesta va fi compilat automat în css. Fișierul css va acea același nume cu fișierul scss, având doar extensia scss schimbată în css. Înainte de suprascrierea fișierului css, acesta va fi copiat în folderul backup (suprascriind un backup cu același nume - sau dacă vreți să păstrați backup-urile anterioare puteți integra în nume o informație cu privire la timpul creării.

(0.25) Customizare Bootstrap cu  schema cromatică aleasă de voi si cu dimensiuni de ecran diferite pentru ecrane medii și mari. Veți face un fișier numit custom.scss în care folositi fisierul scss al bootstrap, schimband valori pentru:
culorile de background pentru minim 2 teme la alegere pe care aplicați tema cromatică schimbată (customizată de voi)
culori de font (adică ale literelor. Precizare: nu neaparat pentru toata pagina, orice culoare de litere - de exemplu dintr-un buton)
dimensiuni de ecran diferite pentru ecrane medii și mari
dimensiunea razelor de border
dimensiunea literelor  headingurilor (h1,h2 etc)
familia de font implicită
încă una sau mai mule variabile alese de voi
Corectare Bootstrap. Atenție, este posibil ca integrarea bootstrap să afecteze aspectul site-ului deoarece pentru anumite elemente din pagină v-ați bazat pe aspectul implicit al acestora, prin urmare va fi nevoie să definiți reguli css astfel încât site-ul să revină la forma inițială. CSS-ul pentru bootstrap trebuie pus primul pentru a asigura suprascrierea proprietăților pentru selectorii-tag.
Veți folosi unul sau mai multe  elemente de bootstrap care să ilustreze schimbările, dintre cele de mai jos:
Customizarea se va face ca la laborator folosid sass, iar compilarea se va face automat la repornirea serverului folosind funcția compileazaScss!.

(0.25) (Efecte CSS)
Observație: având în vedere că depășirea punctajului pentru lista de efecte de mai jos se transformă în bonus adunat la proiect, aceasta lista poate fi expandată pe tot parcursul semestrului (deci inclusiv după deadline-ul etapei 4), adăugând noi idei penru bonusuri, deoarece bonusurile pot fi prezentate si mai tarziu. Atenție! Anumite efecte au cerință individuală asociată (care trebuie respectată, pentru a fi punctate) - enunțurile acestora au identificatorul prefixul "efect_css". Cele care nu au textul "cerinta individuală" au enunțul întreg în acest fișier.
Efecte css propuse (se vor alege efecte css de implementat ca sa însumeze 0.25 - nu e obligatoriu să le faceți pe toate din listă)
(0.05) Duotone (cerință individuală)
(0.15) Reflexie  (cerință individuală)
(0.025) Scrierea textului pe coloane, folosind proprietatea column-count. Se va alege o secțiune cu mai mult text pe care se va aplica proprietatea column-count. Pe ecran mic și mediu se va afișa o singură coloană. Între coloane se va afișa și o linie despărțitoare (column-rule)
(0.025) Schimbarea afișării implicite a textului selectat, folosind pseduo-clasa ::selection - schimbați minim 2 proprietăți ale textului selectat, folosind variabilele definite pentru schema cromatică.
(0.05) text care se plimba orizontal sau verticalprintr-o animație (keyframes) recurentă (după ce se termină mesajul, reapare). Elementul cu textul trebuie să fie responsive (să nu apara scrollbar orizontal pe pagină din cauza lui
(0.05) background fix la scroll într-una din pagini, folosind background-attachment. Imaginea de background se va schimba (printr-o animație) dupa t secunde (t e ales de voi).
(0.05) Afișarea unui tabel astfel încât să fie responsive, conform exemplului dat. Tabelul ales trebuie să aibă minim 4 coloane și să nu conțină celule cu rowspan/colspan.
(0.025) Afișarea unui tabel transpus pe o dimensiune de ecran (media query) conform exemplului. Pe restul dimensiunilor de ecran se va afișa la fel.
(0.1) Stilizare hr (cerință individuală)
(0.05) videoclip care se comporta ca un background, conform exemplului de la https://css-tricks.com/full-page-background-video-styles/

Bonus 1:
(0.5) galeria animata (cerință individuală)
Bonus 2:
Se poate considera ca bonus să faceți mai multe efecte css care ar depăși cele 0.25 puncte.
Bonus 3:
(0.05) Fișierele salvate în backup (în funcția compileazaScss, în urma compilării scss -> css) să aibă în nume o informație de timp (de exemplu, în loc de a.css să fie fișierul a_timestamp.css, de exemplu a_1681124489791.css) pentru a putea salva mai multe versiuni ale aceluiași fișier.
Bonus 4:
(0.025) În cadrul codului dat la curs, pentru compilarea fișierelor scss, aceasta funcționează corect doar dacă în numele fișierelor nu există puncte (de exemplu nu ar merge pentru stil.frumos.css). Corectați codul astfel încât să funcționeze și pentru acest tip de fișiere.
Bonus 5:
Se va implementa o funcție de verificare a datelor din JSON-ul cu imagini, care va fi apelata la pornirea serverului. Funcția  va afisa mesaje de eroare (cu text clar, detaliat și relevant care să explice problema, pentru a fi remediată)  în următoare situații:
(0.025) Folderul specificat în "cale_galerie" nu există în sistemul de fișiere
(0.025) Nu există (în sistemul de fișiere)  vreunul dintre fișierele imagine specificate în lista de imagini.



Cerinte custom - etapa 5

Identificator: efect-css-stilizare-hr
Adăugați în pagină un <hr> (de exemplu între două secțiuni, două paragrafe cu teme diferite, două anunțuri). Stilizați hr-ul astfel încât să semene cu imaginea de mai jos. Atenție! Nu folosiți culorile din imagine ci culori din schema cromatică aleasă de voi. dimesniunile hr-ului sunt la alegerea voastră (atâta timp cât e totuși vizibil)
stilizare hr
Indicații de rezolvare. Steluțele se generează cu ::before și ::after și se poziționează (de exemplu cu poziție nestatică și proprietățile left și right, sau cu margin-left, margin-right. Puteti pune in loc de stelute alte caractere sau chiar imagini.
Upload:Alege fisier: 


Fisiere uploadate: -

Identificator: efect-css-duotone
În cadrul site-ului va apărea o imagine (de fapt un div cu background-ul egal cu acea imagine) pe care s-a aplicat efectul duotone (pentru culorile c1 și c2) folosind pseudoelementele before și after și proprietatea mix-blend-mode. Când se vine cu cursorul pe element, trece treptat în grayscale. Observați un astfel de efect în videoclip.

Puteți porni de la un exemplu cu duotone implementat.
Upload:Alege fisier: 


Fisiere uploadate: -

Identificator: efect-css-reflexie-text
Să se aleagă un text, de exemplu, un heading, pe care să se aplice reflexia. Se poate folosi exemplul de refelexie prin dublarea elementului, sau se pot folosi proprietăți precum box-reflect însă trebuie să găsiți metode prin care reflexia e vizibilă pe orice browser, măcar cele mai noi versiuni (varianta din exemplu este portabilă).
Modul de aplicare al reflexiei trebuie să fie următorul:
Reflexia trebuie să fie ușor blurată (indicație: proprietatea filter)
Când se vine cu cursorul pe text, reflexia se alungește, așa cum se observă în videoclip.

Upload:Alege fisier: 


Fisiere uploadate: -

Atentie! acest exercitiu necesita prezentare!
Identificator: galerie-statica
Se va implementa o galerie statică. Galeria va fi vizibilă atât pe pagina principală cât și într-o pagină separată, dedicată ei (indicație: nu duplicați codul ci includeți un fragment care să conțină galeria), folosind grid și îndeplinind cerințele de mai jos:
Detaliile pentru imaginile galeriei se vor lua dintr-un json cu următorul format:
Obiectul principal al json-ului va avea o proprietate numită "cale_galerie" cu calea către folderul în care se află toate imaginile galeriei
Obiectul principal al json-ului va avea și o proprietate imagini, care va fi de tip vector și va avea ca elemente obiecte în formatul urmator:
selecteaza textul
{
"cale_fisier":"imagine.png",
"titlu":"Nume imagine",
"alt":"text alternativ imagine", "text_descriere":"text descriere",
"luni":["ianuarie","februarie","iunie"]
}
aceste detalii se vor transmite către fișierul EJS și vor fi folosite în template-ul de afișare a imaginilor.
Serverul nu va transmite toate imaginile către pagină, ci doar cele care îndeplinesc un anumit criteriu. Imaginile se vor afișa în funcție de luna (preluata din data curentă). De exemplu, dacă data curentă se incadreaza in una din lunile decembrie, ianuari sau februarie, se va afisa imaginea din exemplu.
Imaginile vor avea toate aceleași dimensiuni. Acest lucru se poate realiza folosind aproape orice utilitar grafic, ajutându-vă de funcționalitățile crop(decupare) și resize(redimensionare). Un tool online care e destul de ușore de folosit: https://picresize.com/en/edit. Imaginile vor fi editate astfel încât să aibă o dimensiune pentru ecran mare (de exemplu o lățime de 400-500px).
Imaginile vor avea toate câte un nume sau descriere asociată (vizibilă) cu ajutorul tagurilor <figure> și <figcaption>. Imaginile vor fi indexate, iar indexul va fi scris la începutul descrierii din figcaption. Indexarea se va face cu litere mici grecești (α, β, γ, ...) (ideal folosind un counter css). Imaginile vor fi puse într-un tag picture, în care vor mai exista surse pentru ecran mediu și mic. Se vor genera imagini de dimensiune mai mică (dacă nu există deja) prin node (atunci când un client cere pagina). Indicație: pachetul sharp. Descrierea imaginilor se va adăuga în atributul title. În proprietatea alt a imaginilor se va adăuga valoarea proprietății alt din JSON, sau dacă aceasta nu există în formatul primit, se va adăuga numele imaginii.
Galeria se va întinde pe toată lătimea paginii site-ului (în sensul că nu vor fi elemente în stânga sau dreapta, ci doar eventuale spațieri).
Forma galeriei e descrisă mai jos (zonele cu negru reprezintă imagini iar cele cu alb, locuri libere în grid). Veți folosi un grid pentru a o afișa:
În cazul în care mai multe imagini se potrivesc criteriului de afișare, numărul de imagini afișate se va trunchia la 12 (acest lucru trebuie implementat în program, nu obținut doar din date).
Pe ecran mare imaginile se vor aseza într-un grid nx3, cu n divizibil cu 2, ca în imaginea de mai jos, folosind grid:
[imagine schema galerie]
Pe ecran mediu, imaginile se vor aseza pe două coloane, folosind grid.
Pe ecran mic, imaginile se vor aseza una sub alta, pe o coloană.
Tranziție. Când se vine cu cursorul pe o imagine din galerie, se va realiza următoarea tranziție: textul din figcaption, asociat imaginii, se va scala treptat (fără a se scala și imaginea), simetric față de centrul boxului descrierii, iar imaginii îi va crește treptat contrastul la 200% (proprietatea filter). Tranziția va dura o secunđă și 100 milisecunde.
Imaginile folosite trebuie să aibă o licență corespunzătoare (să nu fie folosite ilegal). Puteți folosi imagini din "public domain" (domeniul public), licențiate CC0 (creative commons 0). Totuși pentru a învăța cum să inserați o atribuire de autor pentru o imagine folosită, minim una dintre ele va fi luată de pe un site care o oferă cu licență CC-BY (necesită atribuire). Datele pentru atribuire vor fi salvate în JSON.
Observație: nu e nevoie să folosiți aceleași culori, fonturi, dimensiuni de text, stiluri de scris etc cu cele date în cerință. Importantă e forma galeriei și tranziția pe fiecare imagine.
Observație: Pentru verificarea afișării imaginilor în funcție de timp veți schimba valoarea variabilei de tip dată care preia data și ora curentă, la o dată și o oră care să arate schimbarea de afișare.
Puteți, de asemenea, să îmbogățiți galeria cu propriile voastre idei dar doar adăugând funcționalități, și nu modificând cerința de bază. Se va da un bonus pentru creativitate în cazul unor astfel de adăugări.
Upload:Alege fisier: 


Fisiere uploadate: -

Identificator: galerie-animata
Realizați o galerie de imagini cu un număr aleator de poze, dintre valorile: 9, 12, 15, conform videoclipului de mai jos. La fiecare încărcare a paginii se va genera un nou număr de imagini. Imaginile se vor încărca din JSON-ul de imagini pentru galeria statică. Imaginile alese vor fi primele definite în JSON care au în obiectul asociat proprietatea galerie-animata, setată la true (nu e nevoie să adaugați proprietatea și cu valoare falsă pentru imaginile pe care nu le doriți în galeria animată).
Imaginile din galerie trebuie să fie distincte.
Galeria va avea un border-image cu o imagine aleasă de voi. Folosiți SASS în realizarea galeriei. Observație: CSS-ul va trebui generat prin node pe baza fișierului SASS ca să acomodeze noul număr de imagini.
Imaginile sunt de fapt dispuse într-un grid n*3 ascuns de containerul galeriei, astfel încât să se vadă doar imaginea curentă. Trecerea la următoarea imagine se face printr-o rotație centrată pe imaginea curentă, urmată de o translație pe linie sau pe coloană astfel încât imaginile să se afișeze în ordinea indicată mai jos (prima imagine care se va afișa e notată cu 1).
ordine imagini
Animația va fi cu direcție alternată (nu este o problemă dacă în capete rotațiile se întâmplă de două ori).

Galeria va relua inaginile după ce o afișează pe ultima, rezultând într-o afișare continuă, repetitivă. Când se vine cu cursorul pe galerie, animația se oprește. Observați pauzele pe care le face în videoclip când cursorul este pe galerie. Galeria animată nu se va afișa pe ecran mediu și mic.




# Plan — Etapa 5 (Proiect Tehnici Web / Aegis Dynamics)

## Context
Proiectul (Express + EJS) e la finalul Etapei 4. Etapa 5 (1.1p) cere patru blocuri noi care
acum **nu există**: (1) compilare automată SCSS din Node, (2) customizare Bootstrap via SCSS,
(3) efecte CSS individuale (duotone, reflexie text, hr stilizat), (4) galerie statică din JSON.
Singurul punct deja acoperit: folderul `backup` e în lista auto-creată (`vect_foldere` în `index.js:140`).

Decizii confirmate: implementăm **tot, în ordine**; efectele CSS = **cele individuale**
(duotone 0.05 + reflexie 0.15 + hr 0.1); enunțurile individuale au fost furnizate și sunt respectate exact.

Pachete de instalat: `sass`, `bootstrap`, `sharp` (toate ca dependențe).

---

## Reorganizare fișiere SCSS/CSS (premisă pentru tot restul)
Cerința cere `folderScss`/`folderCss` ca subcăi din folderul de resurse. Mutăm:
- `index.scss` + `_nav.scss` → `resurse/scss/`
- output CSS → `resurse/css/` (ex. `resurse/css/index.css`)
- `custom.scss` (Bootstrap) → `resurse/scss/custom.scss` → `resurse/css/custom.css`

Update în `views/fragmente/head.ejs`: schimb `<link href="/index.css">` în două linkuri, **Bootstrap primul**:
```
<link rel="stylesheet" href="/resurse/css/custom.css">   <!-- bootstrap customizat, PRIMUL -->
<link rel="stylesheet" href="/resurse/css/index.css">    <!-- stilurile site-ului, suprascriu -->
```
Elimin ruta veche `app.use('/index.css', ...)` din `index.js:20` (resursele sunt deja servite din `/resurse`).
`backup` rămâne în `.gitignore`.

---

## 1. Compilare automată SCSS — 0.25
Toate în `index.js`, lângă codul existent de inițializare.

- **Proprietăți globale**: în `global.obGlobal` adaug
  `folderScss: path.join(__dirname, 'resurse', 'scss')` și
  `folderCss: path.join(__dirname, 'resurse', 'css')`.
- `backup` deja în `vect_foldere` (`index.js:140`) — nimic de făcut.
- **`compileazaScss(caleScss, caleCss)`**:
  1. Normalizez căile: dacă `path.isAbsolute` le folosesc direct, altfel relative la `folderScss`/`folderCss`.
  2. Dacă `caleCss` lipsește → nume = bazename-ul scss cu extensia schimbată în `.css` (vezi Bonus 4 pt. nume cu puncte: folosesc `nume.slice(0, nume.lastIndexOf('.')) + '.css'`, nu `split('.')`), salvat în `folderCss`.
  3. **Backup înainte de compilare**: dacă fișierul css vechi există, îl copiez în `backup/resurse/css/`
     (creez folderele cu `fs.mkdirSync(..., {recursive:true})`), cu nume cu timestamp (Bonus 3):
     `nume_<Date.now()>.css`. La eroare → `console.error` clar, dar continui compilarea.
  4. Compilare cu `sass.compile(caleScss, { loadPaths: [path.join(__dirname,'node_modules')], style:'expanded' })`
     și scriu `result.css` în calea css. Pentru Bootstrap am nevoie de `loadPaths` spre `node_modules`.
- **Compilare inițială la pornire**: după `initErori()`, parcurg `fs.readdirSync(folderScss)`, sar peste
  partiale (fișiere care încep cu `_`, ex. `_nav.scss`) și apelez `compileazaScss(f)` pentru fiecare `.scss`.
- **Compilare pe parcurs**: `fs.watch(folderScss, (event, filename) => {...})` — la `.scss` ne-partial
  modificat/creat, reapelez `compileazaScss(filename)`. Debounce simplu (ignor dacă filename lipsește;
  opțional un `Set` cu timeout ca să evit dublu-trigger pe care îl dă `fs.watch`).

## 2. Customizare Bootstrap — 0.25
- `npm install bootstrap`.
- `resurse/scss/custom.scss`: override de variabile **înainte** de `@import "bootstrap/scss/bootstrap"`,
  folosind schema cromatică existentă (orange `#f97316` etc. din `:root` în `index.scss`):
  - `$body-bg` + temă alternativă (min 2 teme — ex. via `[data-bs-theme="dark"]` map override)
  - culoare font pe un buton (`$btn-color` / `.btn-primary` color)
  - breakpoint-uri ecran mediu/mare: `$grid-breakpoints` (md, lg) și/sau `$container-max-widths`
  - `$border-radius`
  - dimensiuni headinguri: `$h1-font-size` … `$h3-font-size`
  - `$font-family-base` (Inter/Rajdhani, deja folosite în site)
  - +1 variabilă la alegere (ex. `$link-color` sau `$spacer`)
- Compilat automat de `compileazaScss` la pornire (e în `folderScss`).
- **Corectare Bootstrap**: după integrare, Reboot-ul Bootstrap schimbă tag-urile. Adaug reguli în
  `resurse/scss/index.scss` (care e încărcat **după** custom.css) ca să readuc aspectul inițial pentru
  elementele afectate (margin/padding pe `body`, liste, `table`, `blockquote`, `figure` etc.).
- Folosesc minim un element Bootstrap vizibil care ilustrează customizarea — ex. un `.btn .btn-primary`
  și/sau un `.card` într-o secțiune din `index.ejs`.

## 3. Efecte CSS individuale — 0.25
În `resurse/scss/index.scss`, folosind variabilele schemei cromatice (`--primary`, `--secondary` etc.).

- **hr stilizat (0.1)** — `efect-css-stilizare-hr`: adaug `<hr class="hr-stelute">` între două secțiuni în
  `index.ejs`. Stilizare: linie subțire colorată din schema cromatică + `::before`/`::after` poziționate
  (position relative/absolute + left/right) cu caractere stea (★) în culorile temei. Nu folosesc culorile
  din imaginea-exemplu, ci din schema proprie.
- **duotone (0.05)** — `efect-css-duotone`: `<div class="duotone">` cu `background-image` (folosesc o imagine
  existentă, ex. `f35_large.jpg`). `::before` și `::after` cu culorile c1/c2 din schemă + `mix-blend-mode`
  (screen/multiply) ca să dea efectul duotone. La `:hover` → tranziție treptată spre grayscale
  (`filter: grayscale()` + `transition`).
- **reflexie text (0.15)** — `efect-css-reflexie-text`: aleg un heading, aplic reflexie prin **dublarea
  elementului** (portabil cross-browser, nu mă bazez doar pe `-webkit-box-reflect`). Copia e oglindită
  (`transform: scaleY(-1)`), cu `filter: blur(...)` (ușor blurată) și gradient de opacitate.
  La `:hover` → reflexia se alungește treptat (mărire `scaleY`/înălțime cu `transition`).

## 4. Galerie statică — 0.35 (cerință individuală `galerie-statica`)
**JSON nou** `galerie.json` (la rădăcină, lângă `erori.json`):
```json
{
  "cale_galerie": "resurse/imagini/galerie",
  "imagini": [
    {"cale_fisier":"img1.jpg","titlu":"...","alt":"...","text_descriere":"...",
     "luni":["ianuarie","iunie"], "atribuire":{"autor":"...","sursa":"...","licenta":"CC-BY"}}
  ]
}
```
- **Imagini**: adaug imagini CC0/CC-BY în `resurse/imagini/galerie/` (lățime ~400-500px pt. ecran mare).
  Minim una CC-BY cu atribuire salvată în JSON.
- **Încărcare + validare la pornire** (`index.js`, funcție `initGalerie()` modelată după `initErori()`):
  citesc JSON, verific existența folderului `cale_galerie` și a fiecărui `cale_fisier` (Bonus 5 — mesaje
  `console.error` clare). Salvez în `global.obGlobal.obGalerie`.
- **Filtrare după lună** (server-side): funcție `getImaginiGalerie()` care ia luna din `new Date()`
  (variabilă ușor de modificat pt. testare), păstrează imaginile cu luna curentă în `luni`, **trunchiază la 12**
  în cod. Pune `alt = obj.alt || obj.cale_fisier`, `title = text_descriere`.
- **Generare variante mici prin sharp** (la cererea paginii): pt. fiecare imagine afișată, dacă nu există deja
  `nume-medium.ext` / `nume-small.ext` în folderul galeriei, le generez cu `sharp(...).resize(...)`.
  Implementat ca funcție async apelată în handler-ul rutei înainte de render.
- **Fragment partajat** `views/fragmente/galerie.ejs`: primește lista de imagini și randează grid-ul cu
  `<figure><picture>` (surse `min-width` pt. large/medium/small) `<img>` + `<figcaption>`. Indexare cu litere
  grecești prin **CSS counter** (`counter-reset`/`counter-increment` + `content: counter(galerie, lower-greek)`).
  Inclus în `views/pagini/index.ejs` și într-o pagină nouă `views/pagini/galerie.ejs` (fără duplicare cod).
- **Rute**: pagina `galerie` merge prin ruta generică existentă `app.get("/*pagina")`; dar pentru generarea
  sharp + transmiterea datelor adaug handlere dedicate pentru `/` (index) și `/galerie` care calculează
  `imagini` și fac `res.render(..., {imagini})`. Index.ejs și galerie.ejs primesc `imagini` din `res.render`.
- **CSS galerie** (`index.scss`): grid full-width; ecran mare `grid-template-columns: repeat(3,1fr)` (formă nx3);
  ecran mediu 2 coloane; ecran mic 1 coloană (media queries pe breakpoint-urile alese). Hover (durată **1.1s**):
  figcaption `transform: scale(...)` simetric față de centru (`transform-origin:center`), imaginea
  `filter: contrast(200%)` — fără a scala imaginea.

## Bonusuri incluse „gratis"
- **B3** (timestamp în numele backup-ului) — implementat în `compileazaScss`.
- **B4** (nume fișiere cu puncte) — folosesc `lastIndexOf('.')` la schimbarea extensiei.
- **B5** (validare `galerie.json`: folder + imagini) — în `initGalerie()`.

---

## Fișiere atinse
- `package.json` / `package-lock.json` — adaug `sass`, `bootstrap`, `sharp`.
- `index.js` — `folderScss`/`folderCss`, `compileazaScss`, compilare inițială, `fs.watch`, `initGalerie`,
  `getImaginiGalerie`, generare sharp, handlere `/` și `/galerie`. Elimin ruta `/index.css`.
- `resurse/scss/index.scss`, `resurse/scss/_nav.scss` (mutate din rădăcină) — + efecte CSS + corectare Bootstrap + CSS galerie.
- `resurse/scss/custom.scss` — **nou**, customizare Bootstrap.
- `views/fragmente/head.ejs` — linkuri css noi (bootstrap primul).
- `views/fragmente/galerie.ejs` — **nou**, fragment galerie.
- `views/pagini/index.ejs` — include galerie + hr + duotone + reflexie + element Bootstrap demonstrativ.
- `views/pagini/galerie.ejs` — **nou**, pagină dedicată galeriei.
- `galerie.json` — **nou**.
- `resurse/imagini/galerie/` — **nou**, imagini (CC0/CC-BY).

## Verificare
1. `npm install` apoi `npm start` (sau `npm run dev`).
2. Consola: confirmă compilarea inițială a tuturor `.scss`, crearea `resurse/css/*.css`, backup în
   `backup/resurse/css/`, și mesajele de validare `galerie.json` (Bonus 5).
3. Modific un `.scss` cât serverul rulează → `fs.watch` recompilează + face backup nou cu timestamp.
4. Browser `http://localhost:8080/`:
   - Bootstrap aplicat (buton/card customizat), site-ul arată corect (corectarea funcționează).
   - hr, duotone (hover→grayscale), reflexie (hover→alungire) vizibile.
   - galeria full-width, grid corect pe large/medium/small, max 12, index grecesc, hover (figcaption scale +
     contrast 200% pe 1.1s).
5. `http://localhost:8080/galerie` → aceeași galerie (fragment partajat).
6. Testez filtrarea pe lună schimbând temporar data în `getImaginiGalerie` → se schimbă imaginile afișate.
7. Verific că variantele `-medium`/`-small` apar în folderul galeriei după prima cerere (sharp).

result: Planul Etapei 5 livrat ca markdown în chat (pentru a-l salva tu ca PLAN_ETAPA5.md) — acoperă compilarea automată SCSS, customizarea Bootstrap, efectele individuale (duotone/reflexie/hr) și galeria statică, plus bonusurile B3/B4/B5.