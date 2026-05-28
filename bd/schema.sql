-- E6
-- 1. Baza de date
DROP DATABASE IF EXISTS aegis;
CREATE DATABASE aegis CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP USER IF EXISTS 'aegis_user'@'localhost';
CREATE USER 'aegis_user'@'localhost' IDENTIFIED BY 'aegis_pass';
GRANT SELECT, INSERT, UPDATE, DELETE ON aegis.* TO 'aegis_user'@'localhost';
FLUSH PRIVILEGES;

USE aegis;

CREATE TABLE produse (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    nume              VARCHAR(150) NOT NULL,
    descriere         TEXT NOT NULL,
    imagine           VARCHAR(255) NOT NULL,
    -- categoria mare = enumeratie (max 5 valori) -> genereaza meniul
    categorie         ENUM('aerian','terestru','naval','cibernetic','tactic') NOT NULL,
    -- categorizare secundara (mai putin importanta)
    tip_livrare       ENUM('curier','transport_militar','ridicare_baza') NOT NULL,
    -- caracteristica numerica (pret)
    pret              DECIMAL(12,2) NOT NULL,
    -- a 2-a caracteristica numerica
    autonomie_km      INT NOT NULL,
    -- caracteristica de tip data
    data_introducerii DATE NOT NULL,
    -- caracteristica cu o SINGURA valoare (din set) -> select multiplu
    nivel_clasificare ENUM('public','restrictionat','secret') NOT NULL,
    -- caracteristica cu MAI MULTE valori (separate cu virgula) -> checkbox group
    compatibilitati   VARCHAR(255) NOT NULL,
    -- caracteristica booleana
    export_permis     BOOLEAN NOT NULL
);

INSERT INTO produse
(nume, descriere, imagine, categorie, tip_livrare, pret, autonomie_km, data_introducerii, nivel_clasificare, compatibilitati, export_permis)
VALUES
('Drona de recunoastere UAV-7', 'Drona usoara de supraveghere tactica cu autonomie extinsa si transmisie criptata in timp real.', '/resurse/imagini/produse/drona', 'aerian', 'curier', 48500.00, 1200, '2025-11-12', 'restrictionat', 'NATO, GPS, radar', 1),
('Vanator F-35 Lightning II', 'Aeronava multirol de generatia a 5-a cu tehnologie stealth si avionica integrata avansata.', '/resurse/imagini/produse/f35', 'aerian', 'transport_militar', 89000000.00, 2200, '2024-03-01', 'secret', 'NATO, radar, satelit, IFF', 0),
('Elicopter de atac AH-Raptor', 'Elicopter de atac greu inarmat, optimizat pentru sprijin aerian apropiat in medii ostile.', '/resurse/imagini/produse/elicopter', 'aerian', 'transport_militar', 27500000.00, 690, '2025-06-18', 'restrictionat', 'NATO, termoviziune, laser', 0),
('Sistem de artilerie HW-155', 'Obuzier autopropulsat de 155mm cu raza extinsa si sistem de tintire automatizat.', '/resurse/imagini/produse/artilerie', 'terestru', 'transport_militar', 4200000.00, 450, '2024-09-22', 'restrictionat', 'GPS, radar', 1),
('Vehicul blindat tactic Wolf-4x4', 'Transportor blindat usor pentru personal, rezistent la mine si proiectile de calibru mic.', '/resurse/imagini/produse/wolf4x4', 'terestru', 'ridicare_baza', 380000.00, 800, '2025-01-30', 'public', 'NATO, GPS', 1),
('Tanc hibrid de lupta T-Hybrid', 'Tanc de generatie noua cu propulsie hibrida, blindaj reactiv si tun de 120mm.', '/resurse/imagini/produse/tanc', 'terestru', 'transport_militar', 9800000.00, 550, '2025-08-05', 'secret', 'NATO, radar, termoviziune, IFF', 0),
('Fregata multifunctionala Neptune', 'Nava de razboi cu sisteme de aparare antiaeriana si capabilitati de razboi electronic.', '/resurse/imagini/produse/fregata', 'naval', 'ridicare_baza', 320000000.00, 12000, '2023-12-10', 'secret', 'NATO, radar, satelit, IFF', 0),
('Vedeta de patrulare rapida FastGuard', 'Ambarcatiune rapida de patrulare costiera, manevrabila si echipata cu armament usor.', '/resurse/imagini/produse/vedeta', 'naval', 'transport_militar', 5600000.00, 1500, '2025-04-14', 'restrictionat', 'GPS, radar', 1),
('Sistem sonar submarin DeepEar', 'Sistem sonar pasiv-activ pentru detectia submarinelor si a minelor maritime.', '/resurse/imagini/produse/sonar', 'naval', 'curier', 2100000.00, 60, '2025-09-28', 'secret', 'radar, satelit', 0),
('Platforma de aparare cibernetica CyberShield', 'Suita software pentru detectia si neutralizarea atacurilor cibernetice asupra infrastructurii critice.', '/resurse/imagini/produse/cybershield', 'cibernetic', 'curier', 750000.00, 0, '2026-01-15', 'restrictionat', 'satelit, IFF', 1),
('Modul de razboi electronic JamX', 'Echipament portabil de bruiaj al comunicatiilor si semnalelor radar inamice.', '/resurse/imagini/produse/jamx', 'cibernetic', 'ridicare_baza', 430000.00, 0, '2025-07-02', 'secret', 'radar, GPS, satelit', 0),
('Server de comanda criptat NodeSecure', 'Centru de date mobil cu criptare hardware pentru comanda si control in teatrul de operatii.', '/resurse/imagini/produse/server', 'cibernetic', 'transport_militar', 1250000.00, 0, '2024-11-20', 'restrictionat', 'NATO, satelit, IFF', 1),
('Casca tactica de lupta HelmetPro', 'Casca balistica cu sistem de comunicatii integrat si suport pentru ochelari de vedere nocturna.', '/resurse/imagini/produse/casca', 'tactic', 'curier', 3200.00, 0, '2026-02-08', 'public', 'NATO, termoviziune', 1),
('Vesta antiglont Mark-IV', 'Vesta de protectie de nivel IV cu placi ceramice usoare si distributie optimizata a greutatii.', '/resurse/imagini/produse/vesta', 'tactic', 'curier', 4800.00, 0, '2025-10-11', 'public', 'NATO', 1),
('Sistem de ochire nocturna NightHawk', 'Dispozitiv de vedere termica si nocturna cu zoom digital si inregistrare integrata.', '/resurse/imagini/produse/nighthawk', 'tactic', 'ridicare_baza', 12500.00, 0, '2025-05-19', 'restrictionat', 'termoviziune, laser, GPS', 1),
('Statie radio tactica criptata RadioLink', 'Statie radio portabila cu salt de frecventa si criptare AES pentru comunicatii sigure pe camp.', '/resurse/imagini/produse/radio', 'tactic', 'curier', 8700.00, 40, '2024-07-25', 'restrictionat', 'NATO, GPS, satelit', 1);

SELECT CONCAT('Produse inserate: ', COUNT(*)) AS rezultat FROM produse;
