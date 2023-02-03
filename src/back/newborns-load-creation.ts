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

    console.log(readFileEntries(file).next().value);
    return success(loadName);
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
    let data = fs.readFileSync(file.filepath, "utf-8");
    for(let row of data.split("\n")) {
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
        throw new RangeError(`No such month name: ${name}`);
    }
}


function enforceTwoDigits(value :number) {
    if(value < 10) {
        return "0" + value;
    } else {
        return value.toString();
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