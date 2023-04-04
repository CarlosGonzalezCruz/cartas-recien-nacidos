import * as db from './db-connection.js';
import { Newborn, transcribeDateToISO, getMonthId, enforceTwoDigits } from "./utils.js";

export const NO_LOADS_ERROR = "No loads";
const SORT_CRITERIA = "FechaCarga DESC, NombreCarga DESC, ViviendaCodigoPostal, ViviendaDireccion, Nacido_Nombre, Nacido_Apellido1, Nacido_Apellido2";

type Load = {
    NombreCarga :string,
    FechaCarga :Date
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
        SELECT * FROM CRN.${db.profileTable("NACIMIENTOS")} WHERE NombreCarga = 
        (SELECT MAX(NombreCarga) FROM CRN.${db.profileTable("NACIMIENTOS")} WHERE NombreCarga IS NOT NULL
        AND FechaCarga = (SELECT MAX(FechaCarga) FROM CRN.${db.profileTable("NACIMIENTOS")} WHERE NombreCarga IS NOT NULL))
        ORDER BY ${SORT_CRITERIA}
    `) as Newborn[];
    lastFilterQueryResult = result;
    return result;
}

export async function getAllNewborns(): Promise<readonly Newborn[]> {
    let result = await db.performQueryMySQL(`
        SELECT * FROM CRN.${db.profileTable("NACIMIENTOS")}
        ORDER BY ${SORT_CRITERIA}
    `) as Newborn[];
    lastFilterQueryResult = result;
    return result;
}

export async function getNewbornsWithAddressOnly(): Promise<readonly Newborn[]> {
    let result = await db.performQueryMySQL(`
        SELECT * FROM CRN.${db.profileTable("NACIMIENTOS")} WHERE ViviendaDireccion Is Not Null
        ORDER BY ${SORT_CRITERIA}
    `) as Newborn[];
    lastFilterQueryResult = result;
    return result;
}

export function getLastInsertedNewborn() {
    return db.performQueryMySQL(`
        SELECT * FROM CRN.${db.profileTable("NACIMIENTOS")} WHERE Id = (SELECT LAST_INSERT_ID())
    `) as Promise<Newborn[]>;
}

export function getNewbornsWithIds(...id :(string | number)[]) {
    if(id.length == 0) {
        return new Promise<Newborn[]>(r => r([]));
    }
    return db.performQueryMySQL(`
        SELECT * FROM CRN.${db.profileTable("NACIMIENTOS")} WHERE Id IN (${id.join(",")})
        ORDER BY ${SORT_CRITERIA}
    `) as Promise<Newborn[]>;
}

export async function getNewbornsWithCustomFilter(...params :[string, string][]) {
    let conditions = [];
    let dateConstraint :{year? :string, month? :string} = {};
    let adHocOnly = false;
    for(let p of params) {
        if(!!p[0] && !!p[1]) { // Neither string is null, undefined, or empty
            if(p[0] == "AnnoCarga") { dateConstraint.year = p[1]; continue; }
            if(p[0] == "MesCarga") { dateConstraint.month = p[1]; continue; }
            if(p[0] == "SoloAdHoc") { adHocOnly = !!p[1]; continue; }
            conditions.push(`${p[0]} LIKE "%${p[1]}%"`);
        }
    }
    conditions = conditions.concat(getSQLConditionFromDateConstraint(dateConstraint));
    if(adHocOnly) {
        conditions.push(`NombreCarga IS NULL`);
    }
    let condition = conditions.join(" AND ");
    if(!!condition) {
        let result = await db.performQueryMySQL(`
            SELECT * FROM CRN.${db.profileTable("NACIMIENTOS")} WHERE ${condition}
            ORDER BY ${SORT_CRITERIA}
        `) as Newborn[];
        lastFilterQueryResult = result;
        return result;    
    } else {
        return getAllNewborns();
    }
}

function getSQLConditionFromDateConstraint(dateConstraint :{year? :string, month? :string}) {
    let conditions :string[] = [];
    if(dateConstraint.year != null && dateConstraint.month == null) {
        conditions.push(`FechaCarga BETWEEN '${dateConstraint.year}-01-01' AND '${dateConstraint.year}-12-31'`);
    } else if(dateConstraint.year == null && dateConstraint.month != null) {
        // If year is not specified, assume last matching month
        let currentYear = new Date().getFullYear();
        let monthNumber = getMonthId(dateConstraint.month);
        let year = (new Date().getMonth() + 1) < monthNumber ? currentYear - 1 : currentYear; 
        conditions.push(`FechaCarga >= '${year}-${enforceTwoDigits(monthNumber)}-01'`);
        conditions.push(`FechaCarga < '${monthNumber == 12 ? year + 1 : year}-${enforceTwoDigits(monthNumber == 12 ? 1 : monthNumber + 1)}-01'`);
    } else if(dateConstraint.year != null && dateConstraint.month != null) {
        let monthNumber = getMonthId(dateConstraint.month);
        conditions.push(`FechaCarga >= '${dateConstraint.year}-${enforceTwoDigits(monthNumber)}-01'`);
        conditions.push(`FechaCarga < '${monthNumber == 12 ? Number(dateConstraint.year) + 1 : dateConstraint.year}-${enforceTwoDigits(monthNumber == 12 ? 1 : monthNumber + 1)}-01'`);
    }
    return conditions;
}


export function getLastFilterQueryResult() :readonly Newborn[] {
    return lastFilterQueryResult;
}

export async function insertNewborn(loadName :string | null, ...newborns :Newborn[]) {
    if(!!loadName) {
        console.log(`Solicitada la creación de ${newborns.length} registros en la carga ${loadName}`);
    } else {
        console.log(`Solicitada la creación de ${newborns.length} registros ad hoc.`);
        loadName = null;
    }
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
            entry[key] instanceof Date ? `"${transcribeDateToISO(entry[key])}"` :
            entry[key] == null ? "NULL" :
            entry[key]);
        query_rows.push("(" + fields.join(",") + ")");
    }
    query = query + query_rows.join(",") + ";"
    let success = false;
    let amountOfRowsUpdated = 0;
    try {
        let result = await db.performQueryMySQL(query);
        success = true;
        amountOfRowsUpdated = result.affectedRows;
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


export async function insertNewbornAdHoc(...newborns :Newborn[]) {    
    for(let entry of newborns) {
        entry.NombreCarga = null;
        entry.FechaCarga = new Date();
    }

    return insertNewborn(null, ...newborns);
}


export async function getDistinctLoads() {
    return db.performQueryMySQL(
        `
            SELECT DISTINCT(NombreCarga) FROM CRN.${db.profileTable("NACIMIENTOS")} WHERE NombreCarga IS NOT NULL;
        `
    );
}


export async function getLatestLoad() {
    let query = await db.performQueryMySQL(
        `
            SELECT NombreCarga, FechaCarga FROM CRN.${db.profileTable("NACIMIENTOS")} WHERE NombreCarga IS NOT NULL
            AND FechaCarga = (SELECT MAX(FechaCarga) FROM CRN.${db.profileTable("NACIMIENTOS")} WHERE NombreCarga IS NOT NULL);
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


export async function deleteNewbornsWithIds(...id :(string | number)[]) {
    if(id.length == 0) {
        return;
    }
    console.log(`Solicitada la eliminación de ${id.length} registros`);
    db.performQueryMySQL(`
        DELETE FROM CRN.${db.profileTable("NACIMIENTOS")} WHERE Id IN (${id.join(",")})
    `);
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