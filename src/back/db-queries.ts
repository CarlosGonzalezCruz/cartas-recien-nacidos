import * as db from './db-connection.js';


export function open() {
    return db.open();
}

export function close() {
    db.close();
}

export function getNewbornsFromLastLoad() {
    return db.performQuery(`
        SELECT * FROM Nacimientos WHERE AnnoCarga = (SELECT MAX(AnnoCarga) FROM Nacimientos)
        AND IdMesCarga = (SELECT MAX(IdMesCarga) FROM Nacimientos WHERE AnnoCarga = (SELECT MAX(AnnoCarga) FROM Nacimientos))
        ORDER BY NombreCarga DESC, Nacido_Nombre, Nacido_Apellido1, Nacido_Apellido2
    `);
}

export function getAllNewborns() {
    return db.performQuery(`
        SELECT * FROM Nacimientos ORDER BY NombreCarga DESC, Nacido_Nombre, Nacido_Apellido1, Nacido_Apellido2
    `);
}

export function getNewbornsWithAddressOnly() {
    return db.performQuery(`
        SELECT * FROM Nacimientos WHERE ViviendaDireccion Is Not Null
        ORDER BY NombreCarga DESC, Nacido_Nombre, Nacido_Apellido1, Nacido_Apellido2
    `);
}

export function getNewbornsWithCustomFilter(...params :[string, string][]) {
    let conditions = [];
    for(let p of params) {
        if(!!p[0] && !!p[1]) { // Neither string is null, undefined, or empty
            conditions.push(`${p[0]} LIKE "%${p[1]}%"`);
        }
    }
    let condition = conditions.join(" AND ");
    if(!!condition) {
        return db.performQuery(`
            SELECT * FROM Nacimientos WHERE ${condition}
            ORDER BY NombreCarga DESC, Nacido_Nombre, Nacido_Apellido1, Nacido_Apellido2
        `);    
    } else {
        return getAllNewborns();
    }
}

export function getDistinctLoads() {
    return db.performQuery(
        `
            SELECT DISTINCT(NombreCarga) FROM Nacimientos;
        `
    );
}

export function isLoadPresent(loadName :string) {
    return db.performQuery(
        `
            SELECT COUNT(1) AS COUNT from Nacimientos WHERE NombreCarga = "${loadName}";
        `
    ).then(rows => rows[0]["COUNT"] != 0);
}

export function deleteLoad(loadName :string) {
    console.log(`Requested load ${loadName} deletion`);
    return db.performQuery(
        `
            DELETE FROM Nacimientos WHERE NombreCarga = "${loadName}";
        `
    ).then(rows => console.log(`Deleted ${lastOperationAmountOfRowsUpdated()} rows`));
}

export async function lastOperationAmountOfRowsUpdated() {
    let query = await db.performQuery(
        `
            SELECT CHANGES() AS COUNT;
        `
    ) as {COUNT :number}[];
    return query[0];
}
