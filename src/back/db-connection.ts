import OracleDB from "oracledb";
import sqlite3 from "sqlite3";
import * as properties from "./properties.js";


const DB_PATH = "./db/nacimientos";
let sqlite3db :sqlite3.Database;
let oracledb :OracleDB.Connection;


export async function open() {
    let sqlite3connection = new Promise((resolve, reject) => {
        sqlite3db = new sqlite3.Database(DB_PATH, err => {
            if(err) {
                reject(err);
            }
            console.log(`Conectado a ${DB_PATH}`);
        });
        resolve(sqlite3db);
    }) as Promise<sqlite3.Database>;

    await Promise.all([sqlite3connection, establishOracleDBConnection()]);
    console.log("Todas las conexiones listas.");
}


export async function close() {
    await Promise.all([
        new Promise<void>(r => sqlite3db.close(() => {console.log(`Conexión terminada con ${DB_PATH}`); r()})),
        new Promise<void>(r => oracledb.close().then(() => {console.log(`Conexión terminada con Oracle DB.`); r()}))
    ]);
}


export function performQuery(query :string) :Promise<{[key :string] :any}[]> {
    return new Promise((resolve, reject) => {
        sqlite3db.all(query, (err, rows) => {
            if(err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}


async function establishOracleDBConnection() {
    let ret :OracleDB.Connection;
    try {
        ret = await OracleDB.getConnection({
            connectionString: `(DESCRIPTION=(ADDRESS_LIST=
                    (ADDRESS=(PROTOCOL=${properties.get("Oracle.protocol", "TCP")})(HOST=${properties.get("Oracle.host")})(PORT=${properties.get("Oracle.port")})))
                    (CONNECT_DATA=${properties.get("Oracle.dedicated-server", false) ? "(SERVER=DEDICATED)" : ""}(SERVICE_NAME=ORCL)))`,
            user: properties.get<string>("Oracle.username"),
            password: properties.get<string>("Oracle.password")
        });
        console.log(`Conexión establecida con Oracle DB en ${properties.get("Oracle.host")}:${properties.get("Oracle.port")} como ${properties.get("Oracle.username")}.`);
    } catch(e) {
        throw new Error(`No se ha podido establecer la conexión con Oracle DB. Causa: ${e}`);
    }
    return ret;
}