import child_process from "child_process";

export type Newborn = {
    Nacido_Fecha :Date | null,
    Nacido_Nombre :string | null,
    Nacido_Apellido1 :string | null,
    Nacido_Apellido2 :string | null,
    Padre_Nombre :string | null,
    Padre_Apellido1 :string | null,
    Padre_Apellido2 :string | null,
    Padre_DNI_Extranjero :string | null,
    Padre_DNI :string | null,
    Padre_DNI_Letra :string | null,
    Madre_DNI_Extranjero :string | null,
    Madre_DNI :string | null,
    Madre_DNI_Letra :string | null,
    NombreCarga :string | null,
    FechaCarga :Date,
    ViviendaDireccion :string | null,
    ViviendaCodigoPostal :string | null,
    ViviendaNombreMunicipio :string | null,
    ObservacionesCruce :string | null,
    [index :string] :any
}

export type NewbornAdHoc = {
    Nacido_Nombre :string,
    Nacido_Apellido1 :string,
    Nacido_Apellido2 :string,
    ViviendaDireccion :string,
    ViviendaCodigoPostal :string,
    ViviendaNombreMunicipio :string
}


export function getNewbornDataFromAdHoc(newborn :NewbornAdHoc) {
    return {
        Nacido_Fecha: null,
        Nacido_Nombre: newborn.Nacido_Nombre,
        Nacido_Apellido1: newborn.Nacido_Apellido1,
        Nacido_Apellido2: newborn.Nacido_Apellido2,
        Padre_Nombre: null,
        Padre_Apellido1: null,
        Padre_Apellido2: null,
        Padre_DNI_Extranjero: null,
        Padre_DNI: null,
        Padre_DNI_Letra: null,
        Madre_DNI_Extranjero: null,
        Madre_DNI: null,
        Madre_DNI_Letra: null,
        NombreCarga: null,
        FechaCarga: new Date(),
        ViviendaDireccion: newborn.ViviendaDireccion,
        ViviendaCodigoPostal: newborn.ViviendaCodigoPostal,
        ViviendaNombreMunicipio: newborn.ViviendaNombreMunicipio,
        ObservacionesCruce: "",
    } as Newborn;
}


const MONTH_NAMES = ["<0>", "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];


export function getMonthId(name :string) {
    if(!isNaN(parseInt(name))) { // Month was given as a number
        let selectedId = parseInt(name);
        if(selectedId < 1 || selectedId > 12) {
            throw new Error(`'${name}' no es un mes válido.`);
        }
        return selectedId;
    }
    let selectedId = MONTH_NAMES.indexOf(name.toUpperCase());
    if(selectedId != -1) {
        return selectedId;
    } else {
        throw new Error(`'${name}' no es un mes válido.`);
    }
}


export function transcribeDateToISO(date :Date, includeTimeOfDay :boolean = false) {
    return `${date.getFullYear()}-${enforceTwoDigits(date.getMonth() + 1)}-${enforceTwoDigits(date.getDate())}`
        + (includeTimeOfDay ? ` ${enforceTwoDigits(date.getHours())}:${enforceTwoDigits(date.getMinutes())}:${enforceTwoDigits(date.getSeconds())}` : ``);
}


export function enforceTwoDigits(value :number) {
    if(value < 10) {
        return "0" + value;
    } else {
        return value.toString();
    }
}