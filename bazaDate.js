// conectarea la mysql. aplicatia doar citeste, tabelul e facut in bd/schema.sql

const mysql = require('mysql2/promise');

// folosesc un pool ca sa nu deschid o conexiune noua la fiecare cerere
const pool = mysql.createPool({
    host: 'localhost',
    user: 'aegis_user',
    password: 'aegis_pass',
    database: 'aegis',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// scot valorile enum direct din schema, ca sa nu le scriu de mana
// ex pt 'categorie' imi da ['aerian','terestru','naval','cibernetic','tactic']
async function getValoriEnum(numeColoana) {
    const [randuri] = await pool.query('SHOW COLUMNS FROM produse LIKE ?', [numeColoana]);
    if (!randuri.length) return [];
    // Type arata asa: enum('aerian','terestru',...)
    const potrivire = randuri[0].Type.match(/^enum\((.*)\)$/i);
    if (!potrivire) return [];
    return potrivire[1].split(',').map(v => v.trim().replace(/^'|'$/g, ''));
}

// daca primesc o categorie filtrez dupa ea (pt suboptiunile din meniu), altfel le iau pe toate
async function getProduse(categorie) {
    if (categorie) {
        const [randuri] = await pool.query(
            'SELECT * FROM produse WHERE categorie = ? ORDER BY id', [categorie]);
        return randuri;
    }
    const [randuri] = await pool.query('SELECT * FROM produse ORDER BY id');
    return randuri;
}

// un singur produs, pt pagina lui dedicata
async function getProdusDupaId(id) {
    const [randuri] = await pool.query('SELECT * FROM produse WHERE id = ?', [id]);
    return randuri[0] || null;
}

// e6b16 - produse din aceeasi categorie, folosite pe pagina produsului
async function getProduseSimilare(categorie, idExclus, limit) {
    const [randuri] = await pool.query(
        'SELECT id, nume, imagine FROM produse WHERE categorie = ? AND id != ? ORDER BY id LIMIT ?',
        [categorie, idExclus, limit]
    );
    return randuri;
}

// e6b18 - produsele adaugate in ultimele T zile, sortate invers cronologic
async function getProdusNoi(zile, limit) {
    const [randuri] = await pool.query(
        'SELECT id, nume, imagine, categorie, data_introducerii FROM produse WHERE data_introducerii >= DATE_SUB(CURDATE(), INTERVAL ? DAY) ORDER BY data_introducerii DESC LIMIT ?',
        [zile, limit]
    );
    return randuri;
}

// e6b10 - filtrare + sortare server-side cu parametri dinamici + paginare (b5)
async function getProdusFiltrate({ numeContine, pretMin, pretMax, autonomieMin, tipLivrare,
    compatibilitati, compatNone, clasificari, exportPermis, nrCompatMin, dataMin, descriere,
    sortCheie1, sortCheie2, sortDir, pagina, perPagina, categorie }) {

    const cond = [];
    const vals = [];

    if (categorie) { cond.push('categorie = ?'); vals.push(categorie); }
    if (numeContine) { cond.push('LOWER(nume) LIKE ?'); vals.push('%' + numeContine.toLowerCase() + '%'); }
    if (pretMin !== '' && pretMin != null) { cond.push('pret >= ?'); vals.push(Number(pretMin)); }
    if (pretMax !== '' && pretMax != null) { cond.push('pret <= ?'); vals.push(Number(pretMax)); }
    if (autonomieMin) { cond.push('autonomie_km >= ?'); vals.push(Number(autonomieMin)); }
    if (tipLivrare) { cond.push('tip_livrare = ?'); vals.push(tipLivrare); }
    if (exportPermis !== '' && exportPermis != null) { cond.push('export_permis = ?'); vals.push(exportPermis === '1' ? 1 : 0); }
    if (dataMin) { cond.push('data_introducerii >= ?'); vals.push(dataMin); }
    if (Number(nrCompatMin) > 0) {
        cond.push("(LENGTH(compatibilitati) - LENGTH(REPLACE(compatibilitati, ',', '')) + 1) >= ?");
        vals.push(Number(nrCompatMin));
    }
    if (descriere) {
        const cuvinte = descriere.split(',').map(s => s.trim()).filter(Boolean);
        if (cuvinte.length > 0) {
            cond.push('(' + cuvinte.map(() => 'LOWER(descriere) LIKE ?').join(' OR ') + ')');
            cuvinte.forEach(c => vals.push('%' + c.toLowerCase() + '%'));
        }
    }
    if (compatNone) {
        cond.push('1 = 0');
    } else if (compatibilitati && compatibilitati.length > 0) {
        cond.push('(' + compatibilitati.map(() => 'compatibilitati LIKE ?').join(' OR ') + ')');
        compatibilitati.forEach(c => vals.push('%' + c.trim() + '%'));
    }
    if (clasificari && clasificari.length > 0) {
        cond.push('nivel_clasificare IN (' + clasificari.map(() => '?').join(',') + ')');
        clasificari.forEach(c => vals.push(c));
    }

    const where = cond.length ? 'WHERE ' + cond.join(' AND ') : '';

    const sortMap = {
        pret: 'pret',
        autonomie: 'autonomie_km',
        nrcompat: "(LENGTH(compatibilitati) - LENGTH(REPLACE(compatibilitati, ',', '')) + 1)",
        data: 'data_introducerii'
    };
    const s1 = sortMap[sortCheie1] || 'pret';
    const s2 = sortMap[sortCheie2] || 'id';
    const dir = sortDir === 'desc' ? 'DESC' : 'ASC';

    const pg = Math.max(1, Number(pagina) || 1);
    const ppg = Math.max(1, Number(perPagina) || 6);
    const offset = (pg - 1) * ppg;

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM produse ${where}`, vals);
    const [produse] = await pool.query(
        `SELECT * FROM produse ${where} ORDER BY ${s1} ${dir}, ${s2} ${dir} LIMIT ? OFFSET ?`,
        [...vals, ppg, offset]
    );

    return { produse, total };
}

module.exports = { pool, getValoriEnum, getProduse, getProdusDupaId, getProdusNoi, getProduseSimilare, getProdusFiltrate };
