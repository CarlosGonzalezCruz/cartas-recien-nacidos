import * as db from './db-connection.js';
import { Newborn } from "./utils.js";

export const NO_LOADS_ERROR = "No loads";


type Load = {
    NombreCarga :string,
    MesCarga :string,
    IdMesCarga :number,
    AnnoCarga :number
};

let lastFilterQueryResult :Newborn[] = [];
let cachedAmountOfRowsUpdated :number | null = null;  // Necessary because MySQL resets ROW_COUNT() after the first query

export function open() {
    return db.open();
}

export async function close() {
    await db.close();
}

export async function getNewbornsFromLastLoad(): Promise<readonly Newborn[]> {
    let result = await db.performQueryMySQL(`
        SELECT * FROM CRN.${db.profileTable("NACIMIENTOS")} WHERE AnnoCarga = (SELECT MAX(AnnoCarga) FROM CRN.${db.profileTable("NACIMIENTOS")})
        AND IdMesCarga = (SELECT MAX(IdMesCarga) FROM CRN.${db.profileTable("NACIMIENTOS")} WHERE AnnoCarga = (SELECT MAX(AnnoCarga) FROM CRN.${db.profileTable("NACIMIENTOS")}))
        ORDER BY NombreCarga DESC, ViviendaCodigoPostal, ViviendaDireccion, Nacido_Nombre, Nacido_Apellido1, Nacido_Apellido2
    `) as Newborn[];
    lastFilterQueryResult = result;
    return result;
}

export async function getAllNewborns(): Promise<readonly Newborn[]> {
    let result = await db.performQueryMySQL(`
        SELECT * FROM CRN.${db.profileTable("NACIMIENTOS")} ORDER BY NombreCarga DESC, ViviendaCodigoPostal, ViviendaDireccion, Nacido_Nombre, Nacido_Apellido1, Nacido_Apellido2
    `) as Newborn[];
    lastFilterQueryResult = result;
    return result;
}

export async function getNewbornsWithAddressOnly(): Promise<readonly Newborn[]> {
    let result = await db.performQueryMySQL(`
        SELECT * FROM CRN.${db.profileTable("NACIMIENTOS")} WHERE ViviendaDireccion Is Not Null
        ORDER BY NombreCarga DESC, ViviendaCodigoPostal, ViviendaDireccion, Nacido_Nombre, Nacido_Apellido1, Nacido_Apellido2
    `) as Newborn[];
    lastFilterQueryResult = result;
    return result;
}

export function getLastInsertedNewborn() {
    return db.performQueryMySQL(`
        SELECT * FROM CRN.${db.profileTable("NACIMIENTOS")} WHERE Id = (SELECT LAST_INSERT_ROWID())
    `) as Promise<Newborn[]>;
}

export function getNewbornsWithIds(...id :(string | number)[]) {
    if(id.length == 0) {
        return new Promise<Newborn[]>(r => r([]));
    }
    return db.performQueryMySQL(`
        SELECT * FROM CRN.${db.profileTable("NACIMIENTOS")} WHERE Id IN (${id.join(",")})
        ORDER BY NombreCarga DESC, ViviendaCodigoPostal, ViviendaDireccion, Nacido_Nombre, Nacido_Apellido1, Nacido_Apellido2
    `) as Promise<Newborn[]>;
}

export async function getNewbornsWithCustomFilter(...params :[string, string][]) {
    let conditions = [];
    for(let p of params) {
        if(!!p[0] && !!p[1]) { // Neither string is null, undefined, or empty
            conditions.push(`${p[0]} LIKE "%${p[1]}%"`);
        }
    }
    let condition = conditions.join(" AND ");
    if(!!condition) {
        let result = await db.performQueryMySQL(`
            SELECT * FROM CRN.${db.profileTable("NACIMIENTOS")} WHERE ${condition}
            ORDER BY NombreCarga DESC, ViviendaCodigoPostal, ViviendaDireccion, Nacido_Nombre, Nacido_Apellido1, Nacido_Apellido2
        `) as Newborn[];
        lastFilterQueryResult = result;
        return result;    
    } else {
        return getAllNewborns();
    }
}

export function getLastFilterQueryResult() :readonly Newborn[] {
    return lastFilterQueryResult;
}

export async function insertNewborn(loadName :string, ...newborns :Newborn[]) {
    console.log(`Solicitada la creación de ${newborns.length} registros en la carga ${loadName}`);
    if(newborns.length == 0) {
        return {
            success: true,
            count: 0
        };
    }
    let query = `
        INSERT INTO CRN.${db.profileTable("NACIMIENTOS")}(${Object.keys(newborns[0]).join(",")}) VALUES
    `;
    let query_rows :string[] = [];
    for(let entry of newborns) {
        let fields = Array.from(Object.keys(entry), key => 
            typeof entry[key] == "string" ? `"${entry[key].toUpperCase()}"` :
            entry[key] == null ? "NULL" :
            entry[key]);
        query_rows.push("(" + fields.join(",") + ")");
    }
    query = query + query_rows.join(",") + ";"
    let success = false;
    let amountOfRowsUpdated = 0;
    try {
        await db.performQueryMySQL(query);
        success = true;
        amountOfRowsUpdated = await lastOperationAmountOfRowsUpdated();
    } catch(e) {
        console.error("Error al guardar en la base de datos:");
        console.error(e);
    }
    console.log(`Insertadas ${amountOfRowsUpdated} filas nuevas`);
    return {
        success: success,
        count: amountOfRowsUpdated
    };
}


export async function insertNewbornForLatestLoad(...newborns :Newborn[]) {
    let latestLoad = await getLatestLoad();
    if(latestLoad == null) {
        console.error(`No se puede insertar el registro porque no hay "última carga"`);
        throw NO_LOADS_ERROR;
    }

    for(let entry of newborns) {
        entry.NombreCarga = latestLoad.NombreCarga;
        entry.MesCarga = latestLoad.MesCarga;
        entry.IdMesCarga = latestLoad.IdMesCarga;
        entry.AnnoCarga = latestLoad.AnnoCarga;
    }
    return insertNewborn(latestLoad.NombreCarga, ...newborns);
}


export async function getDistinctLoads() {
    return db.performQueryMySQL(
        `
            SELECT DISTINCT(NombreCarga) FROM CRN.${db.profileTable("NACIMIENTOS")};
        `
    );
}


export async function getLatestLoad() {
    let query = await db.performQueryMySQL(
        `
            SELECT NombreCarga, MesCarga, IdMesCarga, MAX(AnnoCarga) AS AnnoCarga FROM CRN.${db.profileTable("NACIMIENTOS")} WHERE IdMesCarga =
            (SELECT MAX(IdMesCarga) FROM CRN.${db.profileTable("NACIMIENTOS")} WHERE AnnoCarga = (SELECT MAX(AnnoCarga) FROM CRN.${db.profileTable("NACIMIENTOS")}));
        `
    );
    if(query.length == 0) {
        return null;
    }
    return query[0] as Load;
}


export async function isLoadPresent(loadName :string) {
    let rows = await db.performQueryMySQL(
        `
            SELECT COUNT(1) AS COUNT FROM CRN.${db.profileTable("NACIMIENTOS")} WHERE NombreCarga = "${loadName}";
        `
    );
    return rows[0]["COUNT"] != 0;
}


export async function deleteLoad(loadName :string) {
    console.log(`Solicitada la eliminación de la carga ${loadName}`);
    await db.performQueryMySQL(
        `
            DELETE FROM CRN.${db.profileTable("NACIMIENTOS")} WHERE NombreCarga = "${loadName}";
        `
    );
    console.log(`Eliminadas ${await lastOperationAmountOfRowsUpdated()} filas`);
}


export async function lastOperationAmountOfRowsUpdated(preferCached = false) {
    if(preferCached && cachedAmountOfRowsUpdated != null) {
        return cachedAmountOfRowsUpdated;
    }
    let query = await db.performQueryMySQL(
        `
            SELECT ROW_COUNT() AS COUNT;
        `
    ) as {COUNT :number}[];
    if(query[0].COUNT != -1) {
        cachedAmountOfRowsUpdated = query[0].COUNT;
    }
    return query[0].COUNT;
}


export async function getAddressByIdDocument(identifier :string, validator :string | null) {
    let query = await db.performQueryOracleDb(
        `
        SELECT DIRTOTDIR, DIRCODPOS, DIRNOMMUN
        FROM REPOS.PMH_HABITANTE H
        INNER JOIN REPOS.PMH_SIT_HABITANTE SIT ON SIT.HABITANTE_ID = H.DBOID
        INNER JOIN REPOS.PMH_VIVIENDA V ON SIT.VIVIENDA_ID = V.DBOID
        INNER JOIN REPOS.SP_BDC_DIRECC D ON V.ADDRESS_ID = D.DIRDBOIDE
        WHERE H.DOC_IDENTIFICADOR = '${identifier}' ${validator != null ? "AND H.DOC_LETRA = '" + validator + "'" : ""}
        AND SIT.ALTA_FECHA = (
            SELECT MAX(SIT.ALTA_FECHA)
	        FROM REPOS.PMH_SIT_HABITANTE SIT
	        INNER JOIN REPOS.PMH_HABITANTE H ON H.DBOID = SIT.HABITANTE_ID
	        WHERE H.DOC_IDENTIFICADOR = '${identifier}' ${validator != null ? "AND H.DOC_LETRA = '" + validator + "'" : ""}
        )`
    ) as {rows :string[][]};
    return query.rows.length > 0 ? query.rows[0] : null;
}