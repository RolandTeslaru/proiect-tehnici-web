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

module.exports = { pool, getValoriEnum, getProduse, getProdusDupaId, getProdusNoi, getProduseSimilare };
