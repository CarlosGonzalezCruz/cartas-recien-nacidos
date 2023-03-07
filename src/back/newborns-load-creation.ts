import fs from "fs";
import PersistentFile from "formidable/PersistentFile.js";
import * as db from "./db-queries.js";

type LoadCreationResult = {
    success :boolean,
    msg :string
};

export type UploadedFile = PersistentFile & {
    filepath :string                        // Not included in library documentation, for some reason
};

const MONTH_NAMES = ["<0>", "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];


export async function createLoads(year :string | number, month :string, file :UploadedFile) :Promise<LoadCreationResult> {
    let loadName = await generateLoadName(year, month);
    if(typeof loadName != "string") {
        return loadName;
    }

    let newborns :db.Newborn[] = []

    for(let dbNewbornData of readFileEntries(file)) {
        let newborn = {
            Nacido_Fecha: dbNewbornData.Nacido_Fecha,
            Nacido_Nombre: dbNewbornData.Nacido_Nombre,
            Nacido_Apellido1: dbNewbornData.Nacido_Apellido1,
            Nacido_Apellido2: dbNewbornData.Nacido_Apellido2,
            Padre_Nombre: dbNewbornData.Padre_Nombre,
            Padre_Apellido1: dbNewbornData.Padre_Apellido1,
            Padre_Apellido2: dbNewbornData.Padre_Apellido2,
            Padre_DNI_Extranjero: dbNewbornData.Padre_DNI_Extranjero == '1',
            Padre_DNI: Number(dbNewbornData.Padre_DNI),
            Padre_DNI_Letra: dbNewbornData.Padre_DNI_Letra,
            Madre_Nombre: dbNewbornData.Madre_Nombre,
            Madre_Apellido1: dbNewbornData.Madre_Apellido1,
            Madre_Apellido2: dbNewbornData.Madre_Apellido2,
            Madre_DNI_Extranjero: dbNewbornData.Madre_DNI_Extranjero == '1',
            Madre_DNI: Number(dbNewbornData.Madre_DNI),
            Madre_DNI_Letra: dbNewbornData.Madre_DNI_Letra,
            NombreCarga: loadName,
            AnnoCarga: Number(year),
            MesCarga: month,
            IdMesCarga: getMonthId(month),
            ViviendaNombreMunicipio: "ALCALA DE HENARES"
        } as db.Newborn;

        pickAddress(dbNewbornData, newborn);
        newborns.push(newborn);
    }

    let result = await db.insertNewborn(loadName, ...newborns);
    if(result.success) {
        return success(`Se han añadido ${result.count} registros nuevos correspondientes a la carga ${loadName}.`);
    } else {
        return failure(`Consulta la consola del servidor para más información.`);
    }
}


async function generateLoadName(year :string | number, month :string) {
    let loadName = `${year}-${enforceTwoDigits(getMonthId(month))}-${month.toUpperCase()}`;
    if(await db.isLoadPresent(loadName)) {
        return failure(`La carga ${loadName} ya existe.`);
    } else {
        return loadName;
    }
}


function* readFileEntries(file :UploadedFile) {
    let data = fs.readFileSync(file.filepath, "latin1");
    // Substring removes the last \n. Without it, a final empty row would be added with every insert query.
    for(let row of data.substring(0, data.length - 1).split("\n")) {
        yield {
            Nacido_Fecha: row.substring(26, 34).trim(),
            Nacido_Nombre: row.substring(34, 54).trim(),
            Nacido_Apellido1: row.substring(54, 79).trim(),
            Nacido_Apellido2: row.substring(79, 104).trim(),
            Padre_Nombre: row.substring(105, 125).trim(),
            Padre_Apellido1: row.substring(125, 150).trim(),
            Padre_Apellido2: row.substring(150, 175).trim(),
            Padre_DNI_Extranjero: row.substring(176, 177).trim(),
            Padre_DNI: row.substring(177, 185).trim(),
            Padre_DNI_Letra: row.substring(185, 186).trim(),
            Padre_ViviendaDireccion: {
                TipoVia: row.substring(194, 199).trim(),
                NombreVia: row.substring(199, 249).trim(),
                Numero: row.substring(249, 254).trim(),
                Linea2: row.substring(254, 263).trim(),
            },
            Padre_ViviendaCodigoPostal: row.substring(263, 268).trim(),
            Madre_Nombre: row.substring(268, 288).trim(),
            Madre_Apellido1: row.substring(288, 313).trim(),
            Madre_Apellido2: row.substring(313, 338).trim(),
            Madre_DNI_Extranjero: row.substring(339, 340).trim(),
            Madre_DNI: row.substring(340, 348).trim(),
            Madre_DNI_Letra: row.substring(348, 349).trim(),
            Madre_ViviendaDireccion: {
                TipoVia: row.substring(357, 362).trim(),
                NombreVia: row.substring(362, 412).trim(),
                Numero: row.substring(412, 417).trim(),
                Linea2: row.substring(417, 426).trim(),
            },
            Madre_ViviendaCodigoPostal: row.substring(426, 431).trim()
        }
    }
}


function getMonthId(name :string) {
    let selectedId = MONTH_NAMES.indexOf(name.toUpperCase());
    if(selectedId != -1) {
        return selectedId;
    } else {
        throw new RangeError(`No existe el mes ${name}`);
    }
}


function enforceTwoDigits(value :number) {
    if(value < 10) {
        return "0" + value;
    } else {
        return value.toString();
    }
}


function stringifyAddress(address :{TipoVia :string, NombreVia :string, Numero :string, Linea2 :string}) {
    return `${address.TipoVia} ${address.NombreVia}           , Nº ${address.Numero}, ${address.Linea2}`;
}


function pickAddress(db_entry :any, newborn :db.Newborn) {
    newborn.ObservacionesCruce = "";
    if(db_entry.Nacido_Fecha == null) {
        newborn.ObservacionesCruce += `Fecha de nacimiento nula. Ni se intenta el cruce (es un criterio básico para cruzar). `;
    } else if(db_entry.Madre_ViviendaDireccion && db_entry.Madre_ViviendaCodigoPostal) {
        newborn.ViviendaDireccion = stringifyAddress(db_entry.Madre_ViviendaDireccion);
        newborn.ViviendaCodigoPostal = Number(db_entry.Madre_ViviendaCodigoPostal);
        newborn.ObservacionesCruce += `Dirección cruzada por madre. `;
    } else if(db_entry.Padre_ViviendaDireccion && db_entry.Padre_ViviendaCodigoPostal) {
        newborn.ViviendaDireccion = stringifyAddress(db_entry.Padre_ViviendaDireccion);
        newborn.ViviendaCodigoPostal = Number(db_entry.Padre_ViviendaCodigoPostal);
        newborn.ObservacionesCruce += `Dirección cruzada por padre. `;
    } else {
        newborn.ObservacionesCruce += `Dirección de los padres no encontrada, o hijo/a no vive allí. `;
    }
}


function success(msg :string = "Todo bien.") {
    return {
        success: true,
        msg: msg
    };
}


function failure(message :string) {
    return {
        success: false,
        msg: message
    };
}