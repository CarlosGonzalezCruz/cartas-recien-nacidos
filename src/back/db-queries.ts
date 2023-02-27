import * as db from './db-connection.js';

export type Newborn = {
    Nacido_Fecha :Date,
    Nacido_Nombre :string,
    Nacido_Apellido1 :string,
    Nacido_Apellido2 :string,
    Padre_Nombre :string,
    Padre_Apellido1 :string,
    Padre_Apellido2 :string,
    Padre_DNI_Extranjero :boolean,
    Padre_DNI :number,
    Padre_DNI_Letra :string,
    Madre_DNI_Extranjero :boolean,
    Madre_DNI :number,
    Madre_DNI_Letra :string,
    NombreCarga :string,
    AnnoCarga :number,
    MesCarga :string,
    IdMesCarga :number,
    ViviendaDireccion :string,
    ViviendaCodigoPostal :number,
    ViviendaNombreMunicipio :string,
    FechaNacimiento :Date,
    ObservacionesCruce :string,
    [index :string] :any
}


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
    `) as Promise<Newborn[]>;
}

export function getAllNewborns() {
    return db.performQuery(`
        SELECT * FROM Nacimientos ORDER BY NombreCarga DESC, Nacido_Nombre, Nacido_Apellido1, Nacido_Apellido2
    `) as Promise<Newborn[]>;
}

export function getNewbornsWithAddressOnly() {
    return db.performQuery(`
        SELECT * FROM Nacimientos WHERE ViviendaDireccion Is Not Null
        ORDER BY NombreCarga DESC, Nacido_Nombre, Nacido_Apellido1, Nacido_Apellido2
    `) as Promise<Newborn[]>;
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
        `) as Promise<Newborn[]>;    
    } else {
        return getAllNewborns();
    }
}


export async function insertNewborn(...newborns :Newborn[]) {
    let query = `
        INSERT INTO Nacimientos(Nacido_Fecha, Nacido_Nombre, Nacido_Apellido1, Nacido_Apellido2, Padre_Nombre, Padre_Apellido1, Padre_Apellido2, Padre_DNI_Extranjero, Padre_DNI, Padre_DNI_Letra, Madre_Nombre, Madre_Apellido1, Madre_Apellido2, Madre_DNI_Extranjero, Madre_DNI, Madre_DNI_Letra, NombreCarga, AnnoCarga, MesCarga, IdMesCarga, ViviendaDireccion, ViviendaCodigoPostal, ViviendaNombreMunicipio, FechaNacimiento, ObservacionesCruce) VALUES
    `;
    let query_rows :string[] = [];
    for(let entry of newborns) {
        let fields = Array.from(Object.keys(entry), key => entry[key]);
        query_rows.push("(" + fields.join(",") + ")");
    }
    query = query + query_rows.join(",") + ";"
    await db.performQuery(query);
    console.log(`Created ${lastOperationAmountOfRowsUpdated()} rows`);
}


export function getDistinctLoads() {
    return db.performQuery(
        `
            SELECT DISTINCT(NombreCarga) FROM Nacimientos;
        `
    );
}

export async function isLoadPresent(loadName :string) {
    let rows = await db.performQuery(
        `
            SELECT COUNT(1) AS COUNT from Nacimientos WHERE NombreCarga = "${loadName}";
        `
    );
    return rows[0]["COUNT"] != 0;
}

export async function deleteLoad(loadName :string) {
    console.log(`Requested load ${loadName} deletion`);
    await db.performQuery(
        `
            DELETE FROM Nacimientos WHERE NombreCarga = "${loadName}";
        `
    );
    console.log(`Deleted ${lastOperationAmountOfRowsUpdated()} rows`);
}

export async function lastOperationAmountOfRowsUpdated() {
    let query = await db.performQuery(
        `
            SELECT CHANGES() AS COUNT;
        `
    ) as {COUNT :number}[];
    return query[0];
}
