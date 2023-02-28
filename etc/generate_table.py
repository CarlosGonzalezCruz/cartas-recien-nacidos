from typing import NamedTuple
import pyperclip
import re

class DatabaseFile(NamedTuple):
    path :str
    table :str 

NACIMIENTOS = DatabaseFile("Z:\\Cargas_INE_Nacimientos.txt", "Nacimientos")
CRUZA_DNI = DatabaseFile("Z:\\Cruza_con_DNI.txt", "CruzaDNI")


"""
DROP TABLE Nacimientos;
DROP TABLE CruzaDNI;

CREATE TABLE Nacimientos (
    Id INTEGER PRIMARY KEY,
    Nacido_Fecha DATE,
    Nacido_Nombre TEXT,
    Nacido_Apellido1 TEXT,
    Nacido_Apellido2 TEXT,
    Padre_Nombre TEXT,
    Padre_Apellido1 TEXT,
    Padre_Apellido2 TEXT,
    Padre_DNI_Extranjero INTEGER,
    Padre_DNI INTEGER,
    Padre_DNI_Letra TEXT,
    Madre_Nombre TEXT,
    Madre_Apellido1 TEXT,
    Madre_Apellido2 TEXT,
    Madre_DNI_Extranjero INTEGER,
    Madre_DNI INTEGER,
    Madre_DNI_Letra TEXT,
    NombreCarga TEXT,
    AnnoCarga INTEGER,
    MesCarga TEXT,
    IdMesCarga INTEGER,
    ViviendaDireccion TEXT,
    ViviendaCodigoPostal INTEGER,
    ViviendaNombreMunicipio TEXT,
    FechaNacimiento DATE,
    ObservacionesCruce TEXT
);

CREATE TABLE CruzaDNI (
    Doc_Identificador INTEGER,
    Doc_Letra TEXT,
    Es_Ultimo INTEGER,
    Nacim_Fecha DATE,
    Nombre TEXT,
    Apellido1 TEXT,
    Apellido2 TEXT,
    DirTotDir TEXT,
    DirCodigoPostal INTEGER,
    DirNombreMunicipio TEXT,
    Es_Vigente INTEGER,
    SIT_Es_Ultimo INTEGER,
    Es_Valido INTEGER
);
"""

output_buffer = []
cruza_dni_data = dict[str, list]()

def main():
    with open(NACIMIENTOS.path, 'r') as file:
        headers = parse_headers(file.readline())
        output_buffer.append(f"INSERT INTO {NACIMIENTOS.table}({','.join(headers)}) VALUES")
        while next_line := file.readline():
            new_cruza_dni_data = generate_cruza_dni_data(next_line)
            for data in new_cruza_dni_data:
                cruza_dni_data[data[0]] = data
            output_buffer.append(insert_query_nacimientos(next_line, headers))

    buffer_set_final_semicolon(output_buffer)
    headers = "Doc_Identificador,Doc_Letra,Es_Ultimo,Nacim_Fecha,Nombre,Apellido1,Apellido2,DirTotDir,DirCodigoPostal,DirNombreMunicipio,Es_Vigente,SIT_Es_Ultimo,Es_Valido"
    output_buffer.append(f"INSERT INTO {CRUZA_DNI.table}({headers}) VALUES")

    for data in cruza_dni_data.values():
        output_buffer.append(insert_query_cruza_dni(data, headers))

    buffer_set_final_semicolon(output_buffer)
    commit_buffer(output_buffer)


def parse_headers(raw_line :str):
    ret = raw_line.split(';')
    return [h.strip() for h in ret]


def insert_query_nacimientos(raw_line :str, headers :list[str]):
    line = raw_line.split(";")
    assert len(line) == len(headers)
    birth_date = convert_into_date(line[-2].split(" ")[0])
    line[1] = birth_date
    line[-2] = birth_date
    line[8] = "TRUE" if line[8] == 'Y' else "FALSE"
    line[14] = "TRUE" if line[8] == 'Y' else "FALSE"
    quote(line, 1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 13, 16, 17, 19, 21, 23, 24, 25)
    unquote(line, 0, 8, 9, 14, 15, 18, 20, 22)
    clean_nulls(line)
    ret = f"({','.join(line)}),"
    return ret


def generate_cruza_dni_data(raw_line :str):
    line = raw_line.split(";")
    ret = [
        [
            line[9], # Padre_DNI
            line[10], # Padre_DNI_Letra
            "TRUE",
            "1/1/1970",
            line[5], # Padre_Nombre
            line[6], # Padre_Apellido1
            line[7], # Padre_Apellido2
            line[21], # ViviendaDireccion
            line[22], # ViviendaCodigoPostal
            "ALCALA DE HENARES",
            "TRUE", "TRUE", "TRUE"
        ],
        [
            line[15], # Madre_DNI
            line[16], # Madre_DNI_Letra
            "TRUE",
            "1/1/1970",
            line[11], # Madre_Nombre
            line[12], # Madre_Apellido1
            line[13], # Madre_Apellido2
            line[21], # ViviendaDireccion
            line[22], # ViviendaCodigoPostal
            "ALCALA DE HENARES",
            "TRUE", "TRUE", "TRUE"
        ]
    ]
    return ret


def insert_query_cruza_dni(raw_data :list[str], headers :str):
    assert len(raw_data) == len(headers.split(","))
    line = list(raw_data)
    quote(line, 1, 3, 4, 5, 6, 7, 9)
    unquote(line, 0, 2, 8, 10, 11, 12)
    clean_nulls(line)
    ret = f"({','.join(line)}),"
    return ret


def convert_into_date(raw_text :str):
    assert 8 <= len(raw_text) <= 10
    return re.sub("(\d{1,2})/(\d{2})/(\d{4})", "\\3-\\2-\\1", raw_text)


def quote(array :list[str], *positions :int):
    unquote(array, *positions)
    for p in positions:
        assert 0 <= p < len(array)
        array[p] = f"'{array[p]}'"


def unquote(array :list[str], *positions :int):
    for p in positions:
        assert 0 <= p < len(array)
        while len(array[p]) > 0 and array[p][0] in ('\'', '\"'):
            array[p] = array[p][1:]
        while len(array[p]) > 0 and array[p][-1] in ('\'', '\"'):
            array[p] = array[p][:-1]


def clean_nulls(array :list[str]):
    for i, text in enumerate(array):
        if text == "" or text == "''":
            array[i] = "NULL"


def buffer_set_final_semicolon(buffer :list[str]):
    assert len(buffer) > 0
    last_line = buffer[-1]
    if last_line[-1] == ",":
        last_line = last_line[:-1] + ";"
    else:
        last_line += ";"
    
    buffer[-1] = last_line


def commit_buffer(buffer :list[str]):
    for line in buffer:
        print(line)
    pyperclip.copy("\n".join(buffer))
    print("Se han copiado las instrucciones INSERT al portapapeles.")


if __name__ == "__main__":
    main()