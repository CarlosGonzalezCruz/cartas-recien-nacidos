import OracleDB from "oracledb";
import MySQL from "mysql";
import sqlite3 from "sqlite3";
import * as properties from "./properties.js";


const DB_PATH = "./db/nacimientos";
let sqlite3db :sqlite3.Database;
let oracledb :OracleDB.Connection;
let mysqldb :MySQL.Connection;


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

    await Promise.all([sqlite3connection, establishOracleDBConnection(), establishMySQLConnection()]);
    console.log("Todas las conexiones listas.");
}


export async function close() {
    await Promise.all([
        console.log(`La conexión con MySQL se cerrará automáticamente.`),
        new Promise<void>(r => sqlite3db.close(() => {console.log(`Conexión terminada con ${DB_PATH}`); r()})),
        new Promise<void>(r => oracledb.close().then(() => {console.log(`Conexión terminada con Oracle DB.`); r()}))
    ]);
}


export async function performQueryMySQL(query :string, params :any = []) {
     return new Promise((resolve, reject) => {
        mysqldb.query(query, params, (error, result) => {
            if(error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
     });
}


export async function performQueryOracleDb(query :string, params :any = []) {
    return oracledb.execute(query, params);
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
        throw new Error(`No se ha podido establecer la conexión con Oracle DB en ${properties.get("Oracle.host")}:${properties.get("Oracle.port")} como ${properties.get("Oracle.username")}. Causa: ${e}`);
    }
    try {
        // Trivial query to verify whether Oracle DB is resolving queries at all
        console.log("Probando a realizar una consulta trivial con Oracle DB...");
        await ret.execute("SELECT COUNT(1) FROM ALL_TABLES");
        console.log("Consulta resuelta con Oracle DB.");
        oracledb = ret;
    } catch(e) {
        throw new Error(`Oracle DB no está resolviendo consultas. Causa: ${e}`);
    }
    return ret;
}


async function establishMySQLConnection() {
    let ret = MySQL.createConnection({
        host: properties.get<string>("MySQL.host"),
        port: properties.get<number>("MySQL.port"),
        user: properties.get<string>("MySQL.username"),
        password: properties.get<string>("MySQL.password")
    });
    return new Promise<MySQL.Connection>((resolve, reject) => {
        ret.connect(error => {
            if(error) {
                throw new Error(`No se ha podido establecer la conexión con MySQL en ${properties.get("MySQL.host")}:${properties.get("MySQL.port")} como ${properties.get("MySQL.username")}. Causa: ${error}`);
            } else {
                console.log(`Conexión establecida con MySQL en ${properties.get("MySQL.host")}:${properties.get("MySQL.port")} como ${properties.get("MySQL.username")}.`);
                resolve(ret);
            }
        });
    }).then(con => new Promise<MySQL.Connection>((resolve, reject) => {
            // Trivial query to verify whether MySQL is resolving queries at all
            console.log("Probando a realizar una consulta trivial con MySQL...");
            con.query("SELECT 1", (error, result) => {
                if(error) {
                    throw new Error(`MySQL no está resolviendo consultas. Causa: ${error}`);
                } else {
                    console.log("Consulta resuelta con MySQL.");
                    mysqldb = con;
                    resolve(con);
                }
            });
        })
    );
}