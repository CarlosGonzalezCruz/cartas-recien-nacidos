import re

FILE_PATH = "Z:\\Cargas_INE_Nacimientos.csv"
TABLE_NAME = "Nacimientos"

"""
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
"""

def main():
    with open(FILE_PATH, 'r') as file:
        headers = parse_headers(file.readline())
        print(f"INSERT INTO {TABLE_NAME}({','.join(headers)}) VALUES")
        while next_line := file.readline():
            print(insert_query(next_line, headers))


def parse_headers(raw_line :str):
    ret = raw_line.split(';')
    return [h.strip() for h in ret]


def insert_query(raw_line :str, headers :list[str]):
    line = raw_line.split(";")
    assert len(line) == len(headers)
    birth_date = convert_into_date(line[-2])
    line[1] = birth_date
    line[-2] = birth_date
    line[8] = "TRUE" if line[8] == 'Y' else "FALSE"
    line[14] = "TRUE" if line[8] == 'Y' else "FALSE"
    quote(line, 1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 13, 16, 17, 19, 21, 23, 24, 25)
    clean_nulls(line)
    ret = f"({','.join(line)}),"
    return ret


def convert_into_date(raw_text :str):
    assert len(raw_text) == 10
    return re.sub("(\d{2})/(\d{2})/(\d{4})", "\\3-\\2-\\1", raw_text)


def quote(array :list[str], *positions :int):
    for p in positions:
        array[p] = f"'{array[p]}'"


def clean_nulls(array :list[str]):
    for i, text in enumerate(array):
        if text == "" or text == "''":
            array[i] = "NULL"


if __name__ == "__main__":
    main()