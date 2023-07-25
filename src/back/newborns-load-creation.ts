import fs from "fs";
import PersistentFile from "formidable/PersistentFile.js";
import * as db from "./db-queries.js";
import * as properties from "./properties.js";
import { Newborn, enforceTwoDigits, getMonthId } from "./utils.js";

type LoadCreationResult = {
    success :boolean,
    msg :string
};

enum IdDocumentType {
    UNKNOWN, NIE, DNI, PASSPORT
}

enum Parent {
    FATHER = "Padre", MOTHER = "Madre"
}

export type UploadedFile = PersistentFile & {
    filepath :string  // Not included in library documentation, for some reason
};


let busy = false; // This variable prevents the user from running multiple load creation queries simultaneously

export async function createLoads(year :string | number, month :string, loadName :string | null, file :UploadedFile) :Promise<LoadCreationResult> {
    if(busy) {
        return failure("Hay otra carga en proceso. Inténtelo de nuevo dentro de unos segundos.");
    }
    busy = true;
    let connectionSuccess = await db.openOracleDB();
    if(!connectionSuccess) {
        db.closeOracleDB();
        busy = false;
        return failure("La base de datos no está disponible en estos momentos.");
    }
    try {
        let generatedLoadName = await generateLoadName(year, month, loadName);
        if(typeof generatedLoadName != "string") {
            busy = false;
            return generatedLoadName;
        }

        let newborns :Newborn[] = []
        let newbornDataPromises :Promise<void>[] = [];
        let currentDate = new Date();
        if(!!year) {
            currentDate.setFullYear(Number(year));
        }
        let monthId = getMonthId(month);
        if(!!monthId) {
            currentDate.setMonth(monthId - 1);
        }

        for await(let dbNewbornData of readFileEntries(file)) {
            let newborn = {
                Nacido_Fecha: dbNewbornData.Nacido_Fecha ? formatDate(dbNewbornData.Nacido_Fecha) : null,
                Nacido_Nombre: dbNewbornData.Nacido_Nombre ?? null,
                Nacido_Apellido1: dbNewbornData.Nacido_Apellido1 ?? null,
                Nacido_Apellido2: dbNewbornData.Nacido_Apellido2 ?? null,
                Padre_Nombre: dbNewbornData.Padre_Nombre ?? null,
                Padre_Apellido1: dbNewbornData.Padre_Apellido1 ?? null,
                Padre_Apellido2: dbNewbornData.Padre_Apellido2 ?? null,
                Padre_DNI_Extranjero: dbNewbornData.Padre_DNI_Extranjero ?? null,
                Padre_DNI: dbNewbornData.Padre_DNI ?? null,
                Padre_DNI_Letra: dbNewbornData.Padre_DNI_Letra ?? null,
                Madre_Nombre: dbNewbornData.Madre_Nombre ?? null,
                Madre_Apellido1: dbNewbornData.Madre_Apellido1 ?? null,
                Madre_Apellido2: dbNewbornData.Madre_Apellido2 ?? null,
                Madre_DNI_Extranjero: dbNewbornData.Madre_DNI_Extranjero ?? null,
                Madre_DNI: dbNewbornData.Madre_DNI ?? null,
                Madre_DNI_Letra: dbNewbornData.Madre_DNI_Letra ?? null,
                NombreCarga: generatedLoadName,
                FechaCarga: currentDate,
                ViviendaDireccion: null,
                ViviendaCodigoPostal: null,
                ViviendaNombreMunicipio: null,
                ObservacionesCruce: null
            } as Newborn;

            newbornDataPromises.push(new Promise(async (resolve, reject) => {
                pickAddress(dbNewbornData, newborn).then(() => {
                    newborns.push(newborn);
                    resolve();
                }).catch(e => {
                    reject(`Ha habido un problema al averiguar la dirección. Es posible que el archivo de la carga no sea válido. Causa: ${e}`);
                });
            }))
        }

        await Promise.all(newbornDataPromises);
        let result = await db.insertNewborn(generatedLoadName, ...newborns);
        db.closeOracleDB()
        busy = false;
        if(result.success) {
            return success(`Se han añadido ${result.count} registros nuevos correspondientes a la carga ${generatedLoadName}.`);
        } else {
            return failure(`Consulta la consola del servidor para más información.`);
        }
    } catch(e) {
        console.error(`${e}`);
        db.closeOracleDB();
        busy = false;
        return failure(`Consulta la consola del servidor para más información.`);
    }
}


async function generateLoadName(year :string | number, month :string, requestedName :string | null = null) {
    let loadName :string;
    if(!!requestedName) {
        loadName = `${year}-${requestedName}`;
    } else {
        let monthId = getMonthId(month);
        loadName = `${year}-${!!monthId ? enforceTwoDigits(monthId) : 'N/A'}-${month.toUpperCase()}`;
    }
    if(await db.isLoadPresent(loadName)) {
        return failure(`La carga ${loadName} ya existe.`);
    } else {
        return loadName;
    }
}


function* readFileEntries(file :UploadedFile) {
    let data :string;
    try {
        data = fs.readFileSync(file.filepath, properties.get<BufferEncoding>("Application.load-encoding"));
    } catch(e) {
        throw new Error("No se ha podido abrir el archivo de la carga. ¿Es correcto el valor de la propiedad [Application] load-encoding?");
    }
    try {
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
                Madre_Nombre: row.substring(268, 288).trim(),
                Madre_Apellido1: row.substring(288, 313).trim(),
                Madre_Apellido2: row.substring(313, 338).trim(),
                Madre_DNI_Extranjero: row.substring(339, 340).trim(),
                Madre_DNI: row.substring(340, 348).trim(),
                Madre_DNI_Letra: row.substring(348, 349).trim(),
            }
        }
    } catch(e) {
        throw new Error("Ha ocurrido un problema al leer el archivo de la carga.");
    }
}


function formatDate(rawDate :string) {
    return rawDate.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
}


async function pickAddress(db_entry :any, newborn :Newborn) {
    newborn.ObservacionesCruce = "";
    if(db_entry.Nacido_Fecha == null) {
        newborn.ObservacionesCruce += `Fecha de nacimiento nula. Ni se intenta el cruce (es un criterio básico para cruzar). `;
        return;
    }
    let observaciones :string[] = [];
    let found = false;

    for(let p of [Parent.MOTHER, Parent.FATHER]) {
        let idData =  processIdDocument(newborn[`${p}_DNI`], newborn[`${p}_DNI_Extranjero`], newborn[`${p}_DNI_Letra`]);
        if(idData == null) {
            observaciones.push(`Doc identidad ${p} no válido.`);
        } else {
            let foundAddress = await db.getAddressByIdDocument(idData.identifier, idData.validator);
            if(foundAddress != null) {
                newborn.ViviendaDireccion = foundAddress[0];
                newborn.ViviendaCodigoPostal = foundAddress[1];
                newborn.ViviendaNombreMunicipio = foundAddress[2];
                observaciones.push(`Dirección cruzada por ${p}.`);
                found = true;
                break;
            }
        }
    }
    if(!found) {
        observaciones.push(`Dirección de los padres no encontrada, o hijo/a no vive allí.`);
    }
    newborn.ObservacionesCruce = observaciones.join(" ");
}


function processIdDocument(identifier? :string | null, nieValidator? :string | null, dniValidator? :string | null) {
    if(!!identifier) {
        if(!!nieValidator) {
            return {
                type: IdDocumentType.NIE,
                identifier: `${nieValidator}${identifier.substring(identifier.length-7)}`,
                validator: null
            }
        } else if(!!dniValidator) {
            return {
                type: IdDocumentType.DNI,
                identifier: identifier.padStart(9, "0"),
                validator: dniValidator
            }
        } else if(identifier != "00000000") {
            return {
                type: IdDocumentType.PASSPORT,
                identifier: identifier,
                validator: null
            }
        }
    }
    return null;
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