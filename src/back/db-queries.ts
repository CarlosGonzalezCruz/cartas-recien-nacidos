import * as db from './db-connection.js';

export type Newborn = {
    Nacido_Fecha :string,
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
    FechaNacimiento :string,
    ObservacionesCruce :string,
    [index :string] :any
}


let lastFilterQueryResult :Newborn[] = [];

export function open() {
    return db.open();
}

export function close() {
    db.close();
}

export async function getNewbornsFromLastLoad(): Promise<readonly Newborn[]> {
    let result = await db.performQuery(`
        SELECT * FROM Nacimientos WHERE AnnoCarga = (SELECT MAX(AnnoCarga) FROM Nacimientos)
        AND IdMesCarga = (SELECT MAX(IdMesCarga) FROM Nacimientos WHERE AnnoCarga = (SELECT MAX(AnnoCarga) FROM Nacimientos))
        ORDER BY NombreCarga DESC, Nacido_Nombre, Nacido_Apellido1, Nacido_Apellido2
    `) as Newborn[];
    lastFilterQueryResult = result;
    return result;
}

export async function getAllNewborns(): Promise<readonly Newborn[]> {
    let result = await db.performQuery(`
        SELECT * FROM Nacimientos ORDER BY NombreCarga DESC, Nacido_Nombre, Nacido_Apellido1, Nacido_Apellido2
    `) as Newborn[];
    lastFilterQueryResult = result;
    return result;
}

export async function getNewbornsWithAddressOnly(): Promise<readonly Newborn[]> {
    let result = await db.performQuery(`
        SELECT * FROM Nacimientos WHERE ViviendaDireccion Is Not Null
        ORDER BY NombreCarga DESC, Nacido_Nombre, Nacido_Apellido1, Nacido_Apellido2
    `) as Newborn[];
    lastFilterQueryResult = result;
    return result;
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
        let result = await db.performQuery(`
            SELECT * FROM Nacimientos WHERE ${condition}
            ORDER BY NombreCarga DESC, Nacido_Nombre, Nacido_Apellido1, Nacido_Apellido2
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
    console.log(`Solicitada la creación de la carga ${loadName}`);
    let query = `
        INSERT INTO Nacimientos(Nacido_Fecha, Nacido_Nombre, Nacido_Apellido1, Nacido_Apellido2, Padre_Nombre, Padre_Apellido1, Padre_Apellido2, Padre_DNI_Extranjero, Padre_DNI, Padre_DNI_Letra, Madre_Nombre, Madre_Apellido1, Madre_Apellido2, Madre_DNI_Extranjero, Madre_DNI, Madre_DNI_Letra, NombreCarga, AnnoCarga, MesCarga, IdMesCarga, ViviendaDireccion, ViviendaCodigoPostal, ViviendaNombreMunicipio, FechaNacimiento, ObservacionesCruce) VALUES
    `;
    let query_rows :string[] = [];
    for(let entry of newborns) {
        let fields = Array.from(Object.keys(entry), key => typeof entry[key] == "string" ? `"${entry[key]}"` : entry[key]);
        query_rows.push("(" + fields.join(",") + ")");
    }
    query = query + query_rows.join(",") + ";"
    let success = false;
    let amountOfRowsUpdated = 0;
    try {
        await db.performQuery(query);
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
    console.log(`Solicitada la eliminación de la carga ${loadName}`);
    await db.performQuery(
        `
            DELETE FROM Nacimientos WHERE NombreCarga = "${loadName}";
        `
    );
    console.log(`Eliminadas ${await lastOperationAmountOfRowsUpdated()} filas`);
}

export async function lastOperationAmountOfRowsUpdated() {
    let query = await db.performQuery(
        `
            SELECT CHANGES() AS COUNT;
        `
    ) as {COUNT :number}[];
    return query[0].COUNT;
}
