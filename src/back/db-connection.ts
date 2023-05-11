import OracleDB from "oracledb";
import MySQL from "mysql";
import * as properties from "./properties.js";


let oracledb :OracleDB.Connection | null;
let oracledbCloseTimeout :NodeJS.Timeout | null;
let mysqldb :MySQL.Pool;

let mysqldbLastRowCount = 0;
let mysqldbLastInsertedId = -1;


export async function openMySQL() {
    await establishMySQLConnection();
    await initTables();
}


export async function openOracleDB() {
    let success :boolean;
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
    await oracledb.close();
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
        mysqldb.getConnection((error, connection) => {
            if(error) {
                reject(error);
                return;
            }
            connection.query(query, (error, result) => {
                if(error) {
                    mysqldbLastRowCount = -1;
                    reject(error);
                } else {
                    if(updateMetaResults) {
                        mysqldbLastRowCount = result.affectedRows;
                        console.info(`last row count updated to ${mysqldbLastRowCount}`)
                        mysqldbLastInsertedId = result.insertId;
                    }
                    resolve(result);
                }
                connection.release();
            });
        });
     });
}


export async function performQueryOracleDB(query :string) {
    if(!oracledb) {
        console.error("No hay conexión con Oracle DB");
        return null;
    }
    if(!!oracledbCloseTimeout) {
        clearTimeout(oracledbCloseTimeout);
        oracledbCloseTimeout = setTimeout(closeOracleDB, properties.get("Oracle.timeout-ms", 0));
    }
    return oracledb.execute(query);
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
    let ret = MySQL.createPool({
        connectionLimit: properties.get<number>("MySQL.connection-limit", 10),
        host: properties.get<string>("MySQL.host"),
        port: properties.get<number>("MySQL.port"),
        user: properties.get<string>("MySQL.username"),
        password: properties.get<string>("MySQL.password")
    });
    return new Promise<MySQL.Pool>((resolve, reject) => {
        console.log(`Probando a crear una conexión con MySQL en ${properties.get("MySQL.host")}:${properties.get("MySQL.port")} como ${properties.get("MySQL.username")}.`);
        // Trivial query to verify whether MySQL is resolving queries at all
        ret.query("SELECT 1", (error, result) => {
            if(error) {
                throw new Error(`No se ha podido crear una conexión con MySQL o no está resolviendo consultas. Causa: ${error}`);
            } else {
                console.log("Conexión verificada con MySQL.");
                mysqldb = ret;
                resolve(ret);
            }
        });
    });
}


async function initTables() {
    let newbornsTable = profileTable("NACIMIENTOS");
    let existingTables = await performQueryMySQL(`SHOW TABLES FROM CRN LIKE '${newbornsTable}'`) as string[];
    if(existingTables.length == 0) {
        console.log(`Se van a crear las tablas necesarias en MySQL.`);
        try {
            await performQueryMySQL(`
                CREATE TABLE CRN.${newbornsTable} (
                    Id INTEGER PRIMARY KEY AUTO_INCREMENT,
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
                    ObservacionesCruce TEXT,
                    INDEX NombreCarga_idx(NombreCarga),
                    INDEX ViviendaDireccion_idx(ViviendaDireccion(6)),
                    INDEX ViviendaCodigoPostal_idx(ViviendaCodigoPostal)
                );
            `);
            console.log(`Tabla ${newbornsTable} creada en MySQL.`);
        } catch(e) {
            throw new Error(`No se ha podido crear la tabla ${newbornsTable} en MySQL. Causa: ${e}.`);
        }

    }
}