import fs from "fs";
import sqlite3 from "sqlite3";
import * as properties from "./properties.js";


const DB_PATHS = {
    oracledb: "db/oracledb",
    mysql: "db/mysqldb"
} as const;


let oracledb : sqlite3.Database | null;
let oracledbCloseTimeout :NodeJS.Timeout | null;
let mysqldb :sqlite3.Database;

let mysqldbLastRowCount = 0;
let mysqldbLastInsertedId = -1;


export async function openMySQL() {
    ensureDirectoryExists(DB_PATHS.mysql);
    await establishMySQLConnection();
    await initTables();
}


export async function openOracleDB() {
    let success :boolean;
    ensureDirectoryExists(DB_PATHS.oracledb);
    try {
        if(!!oracledb) {
            closeOracleDB();
        }
        await establishOracleDBConnection();
        if(!!properties.get("Oracle.timeout-ms", 0)) {
            oracledbCloseTimeout = setTimeout(closeOracleDB, properties.get<number>("Oracle.timeout-ms"));
        }
        success = true;
    } catch(e) {
        console.error(e.message);
        success = false;
    }
    return success;
}


export async function closeOracleDB() {
    if(!oracledb) {
        return;
    }
    oracledb.close();
    oracledb = null;
    console.log("Conexión terminada con Oracle DB.");
    if(!!oracledbCloseTimeout) {
        clearTimeout(oracledbCloseTimeout);
        oracledbCloseTimeout = null;
    }
}


export async function closeAll() {
    await Promise.all([
        console.log(`La conexión con MySQL se cerrará automáticamente.`),
        closeOracleDB()
    ]);
}


export function profileTable(tableName :string) {
    let suffix = properties.get<string>("MySQL.table-suffix", "");
    return `${tableName}${!!suffix ? "_" : ""}${suffix ?? ""}`;
}


export function getMySQLLastRowCount() {
    return mysqldbLastRowCount;
}


export function getMySQLLastInsertedId() {
    return mysqldbLastInsertedId;
}


export async function performQueryMySQL(query :string, updateMetaResults = false) :Promise<any> {
    return new Promise((resolve, reject) => {
        mysqldb.all(query, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                if (updateMetaResults) {
                    mysqldb.get(`SELECT MAX(Id) AS maxId, CHANGES() AS changes FROM ${profileTable("NACIMIENTOS")}`, (err, row :any) => {
                        if (err) {
                            reject(err);
                        } else {
                          mysqldbLastRowCount = row.changes;
                          mysqldbLastInsertedId = row.maxId;
                          resolve(rows);
                        }
                      });
                } else {
                    resolve(rows);
                }
            }
        });
    });
}


export async function performQueryOracleDB(query :string) {
    if(!oracledb) {
        await openOracleDB();
    }
    if(!!oracledbCloseTimeout) {
        clearTimeout(oracledbCloseTimeout);
        oracledbCloseTimeout = setTimeout(closeOracleDB, properties.get("Oracle.timeout-ms", 0));
    }
    return new Promise(resolve => {
        oracledb!.all(query, (_, rows) => {
            resolve(rows);
        });
    });
}


async function establishOracleDBConnection() {
    return new Promise((resolve, reject) => {
        oracledb = new sqlite3.Database(DB_PATHS.oracledb, err => {
            if(err) {
                reject(err);
            } else {
                resolve(oracledb);
            }
        });
    });
}


async function establishMySQLConnection() {
    return new Promise((resolve, reject) => {
        mysqldb = new sqlite3.Database(DB_PATHS.mysql, err => {
            if(err) {
                reject(err);
            } else {
                resolve(mysqldb);
            }
        });
    });
}


function ensureDirectoryExists(path: string) {
    const dir = path.substring(0, path.lastIndexOf('/'));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }


async function initTables() {
    let newbornsTable = profileTable("NACIMIENTOS");
    let existingTables = await performQueryMySQL(`SELECT name FROM sqlite_master WHERE type='table' AND name='${newbornsTable}'`) as string[];
    if(existingTables.length == 0) {
        console.log(`Se van a crear las tablas necesarias en MySQL.`);
        try {
            await performQueryMySQL(`
                CREATE TABLE ${newbornsTable} (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    Nacido_Fecha DATE,
                    Nacido_Nombre TEXT,
                    Nacido_Apellido1 TEXT,
                    Nacido_Apellido2 TEXT,
                    Padre_Nombre TEXT,
                    Padre_Apellido1 TEXT,
                    Padre_Apellido2 TEXT,
                    Padre_DNI_Extranjero TEXT,
                    Padre_DNI TEXT,
                    Padre_DNI_Letra TEXT,
                    Madre_Nombre TEXT,
                    Madre_Apellido1 TEXT,
                    Madre_Apellido2 TEXT,
                    Madre_DNI_Extranjero TEXT,
                    Madre_DNI TEXT,
                    Madre_DNI_Letra TEXT,
                    NombreCarga VARCHAR(16),
                    FechaCarga DATE,
                    ViviendaDireccion TEXT,
                    ViviendaCodigoPostal VARCHAR(5),
                    ViviendaNombreMunicipio TEXT,
                    ObservacionesCruce TEXT
                );
            `);
            console.log(`Tabla ${newbornsTable} creada en MySQL.`);
        } catch(e) {
            throw new Error(`No se ha podido crear la tabla ${newbornsTable} en MySQL. Causa: ${e}.`);
        }
    }
    
    openOracleDB();
    let existingAddressTables = await performQueryOracleDB(`SELECT name FROM sqlite_master WHERE type='table' AND name='DIRECCIONES'`) as string[];
    if(existingAddressTables.length == 0) {
        console.log(`Para la versión de muestra, se va a crear una tabla de direcciones de viviendas en OracleDB. En la versión de producción, esta base de datos ya existe.`);
        try {
            await performQueryOracleDB(`
                CREATE TABLE DIRECCIONES (
                    DNI TEXT,
                    DIRTOTDIR TEXT,
                    DIRCODPOS TEXT,
                    DIRNOMMUN TEXT
                );
            `);
            console.log(`Tabla DIRECCIONES creada en OracleDB.`);
        } catch(e) {
            throw new Error(`No se ha podido crear la tabla DIRECCIONES en OracleDB. Causa: ${e}.`);
        }
    }
}