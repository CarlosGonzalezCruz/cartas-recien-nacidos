import archiver, { Archiver } from "archiver";
import * as properties from "../back/properties.js";
import * as db from "../back/db-queries.js";
import * as utils from "../back/utils.js";

const MEN_FIRST_NAMES = ['Adrián', 'Agustín', 'Alberto', 'Alejandro', 'Alfonso', 'Alfredo', 'Álvaro', 'Andrés', 'Ángel', 'Antonio', 'Arturo', 'Benjamín', 'Bernardo', 'Carlos', 'César', 'Cristian', 'Cristóbal', 'Daniel', 'David', 'Diego', 'Eduardo', 'Emilio', 'Enrique', 'Ernesto', 'Esteban', 'Federico', 'Felipe', 'Fernando', 'Francisco', 'Gabriel', 'Germán', 'Gonzalo', 'Guillermo', 'Gustavo', 'Héctor', 'Hugo', 'Ignacio', 'Ismael', 'Iván', 'Javier', 'Jesús', 'Joaquín', 'Jorge', 'Jordi', 'José', 'Juan', 'Julio', 'Lorenzo', 'Lucas', 'Luis', 'Manuel', 'Marc', 'Marcelo', 'Marco', 'Mariano', 'Mario', 'Martín', 'Miguel', 'Nicolás', 'Óscar', 'Pablo', 'Patricio', 'Pedro', 'Rafael', 'Ramón', 'Raúl', 'Ricardo', 'Roberto', 'Rodrigo', 'Rubén', 'Salvador', 'Santiago', 'Sergio', 'Sebastián', 'Simón', 'Tomás', 'Vicente', 'Víctor', 'Xavier', 'Yago', 'Zacarías'];
const WOMEN_FIRST_NAMES = ['Lucia', 'Martina', 'Sofia', 'Maria', 'Valeria', 'Carmen', 'Marta', 'Ana', 'Laura', 'Paula', 'Alba', 'Elena', 'Julia', 'Emma', 'Adriana', 'Clara', 'Lola', 'Isabella', 'Alicia', 'Natalia', 'Beatriz', 'Carla', 'Luna', 'Olivia', 'Sara', 'Ines', 'Celia', 'Diana', 'Rocio', 'Aitana', 'Irene', 'Nerea', 'Cristina', 'Lourdes', 'Eva', 'Raquel', 'Silvia', 'Angela', 'Patricia', 'Marina', 'Lara', 'Rosa', 'Miriam', 'Ainhoa', 'Lidia', 'Noelia', 'Gloria', 'Cecilia', 'Esther', 'Monica', 'Pilar', 'Elsa', 'Leticia', 'Mireia', 'Sandra', 'Nuria', 'Ariadna', 'Carmen', 'Eloisa', 'Candela', 'Elisa', 'Iris', 'Leire', 'Margarita', 'Teresa', 'Victoria', 'Yolanda', 'Zoe', 'Abril', 'Beatriz', 'Carlota', 'Daniela', 'Fernanda', 'Gabriela', 'Hanna', 'Ivana', 'Jazmin', 'Karen', 'Linda', 'Melissa', 'Natalie', 'Oriana', 'Penelope', 'Rebeca', 'Sabrina', 'Tamara', 'Ursula', 'Vanessa', 'Wendy', 'Ximena', 'Yamila', 'Zara'];

const LAST_NAMES = ['García', 'Fernández', 'González', 'Rodríguez', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez', 'Torres', 'Ortega', 'Morales', 'Serrano', 'Ramírez', 'Rubio', 'Molina', 'Delgado', 'Suárez', 'Ortiz', 'Castro', 'Silva', 'Vargas', 'Cruz', 'Vega', 'Ramos', 'Pascual', 'Santos', 'Guerrero', 'Blanco', 'Núñez', 'Iglesias', 'Medina', 'Garrido', 'Cortés', 'León', 'Peña', 'Cabrera', 'Campos', 'Cano', 'Prieto', 'Reyes', 'Méndez', 'Calvo', 'Gallego', 'Vidal', 'Mora', 'Soto', 'Rojas', 'Esteban', 'Crespo', 'Diez', 'Lozano', 'Santana', 'Pardo', 'Velasco', 'Moya', 'Santiago', 'Varela', 'Ríos', 'Ferrer', 'Aguilar', 'Herrera', 'Pereira', 'Castaño', 'Cordero', 'Rosario', 'Guzmán', 'De la Cruz', 'Castillo', 'Gómez', 'Reyes', 'Sánchez', 'Peña', 'García', 'Hernández', 'Torres', 'Ortega', 'Moreno', 'López', 'González', 'Pérez', 'Serrano', 'Romero', 'Ramírez', 'Rubio', 'Álvarez', 'Molina', 'Suárez', 'Ortiz', 'Silva', 'Cruz', 'Vega', 'Pascual', 'Santos', 'Blanco', 'Iglesias', 'Cortés', 'León', 'Cabrera', 'Campos', 'Cano', 'Prieto', 'Méndez', 'Calvo', 'Gallego', 'Vidal', 'Mora', 'Soto', 'Rojas', 'Esteban', 'Crespo', 'Diez', 'Lozano', 'Santana', 'Pardo', 'Velasco', 'Moya', 'Santiago', 'Varela', 'Ríos', 'Ferrer', 'Aguilar', 'Herrera', 'Pereira', 'Castaño', 'Cordero', 'Rosario', 'Guzmán'];

const STREET_NAMES = ["Cl Mayor", "Av Constitución", "Pº Castellana", "Cl Gran Vía", "Cl Alcalá", "Av España", "Pza Mayor", "Av Mar", "Cl San Juan", "Pº Marítimo", "Av Reyes", "Cl Real", "Av Libertad", "Cl Santa María", "Av Paz", "Pº Prado", "Cl San Miguel", "Av Flores", "Cl San Pedro", "Av Ángeles", "Pza España", "Cl San Francisco", "Av Sol", "Cl San Antonio", "Pº Victoria", "Av Cruz", "Cl San José", "Av Olivos", "Cl San Sebastián", "Av Fuente", "Cl San Pablo", "Av Pinos", "Pza Constitución", "Cl San Juan Bautista", "Av Esperanza", "Cl San Andrés", "Av Rosales", "Cl San Nicolás", "Av Alegría", "Cl San Rafael", "Av Cedros", "Pza Carmen", "Cl San Gabriel", "Av Victoria", "Cl San Mateo", "Av Lirios", "Cl San Lorenzo", "Av Amistad", "Cl San Agustín", "Av Naranjos", "Pza Catedral", "Cl San Isidro", "Av Esperanza", "Cl San Esteban", "Av Jazmines", "Cl San Cristóbal", "Av Gloria", "Cl San Lucas", "Av Girasoles", "Pza Ayuntamiento", "Cl San Marcos", "Av Felicidad", "Cl San Miguel", "Av Almendros", "Cl San Pedro", "Av Juventud", "Cl San Francisco", "Av Pájaros", "Pza Merced", "Cl San José", "Av Paz", "Cl San Andrés", "Av Robles", "Cl San Nicolás", "Av Alegría", "Cl San Rafael", "Av Cedros", "Pza Carmen", "Cl San Gabriel", "Av Victoria", "Cl San Mateo", "Av Lirios", "Cl San Lorenzo", "Av Amistad", "Cl San Agustín", "Av Naranjos", "Pza Catedral", "Cl San Isidro", "Av Esperanza", "Cl San Esteban", "Av Jazmines", "Cl San Cristóbal", "Av Gloria", "Cl San Lucas", "Av Girasoles", "Pza Ayuntamiento", "Cl San Marcos", "Av Felicidad", "Cl San Miguel", "Av Almendros"];


async function generateRandomNewborn() {
    let fatherLastName = utils.pickRandom(LAST_NAMES).toUpperCase();
    let fatherDNI = getRandomDNI();
    let motherLastName = utils.pickRandom(LAST_NAMES).toUpperCase();
    let motherDNI = getRandomDNI();
    let address;
    if(Math.random() >= 0.1) {
        address = generateRandomAddress(utils.pickRandom([fatherDNI, motherDNI]));
    } else {
        address = null;
    }
    
    let newborn = ""
    .padEnd(26).concat(formatDate(getRandomDate()))
    .padEnd(34).concat(getRandomName().toUpperCase())
    .padEnd(54).concat(fatherLastName)
    .padEnd(79).concat(motherLastName)
    .padEnd(105).concat(getRandomName("man").toUpperCase())
    .padEnd(125).concat(fatherLastName)
    .padEnd(150).concat(utils.pickRandom(LAST_NAMES).toUpperCase())
    .padEnd(176).concat(fatherDNI.foreign)
    .padEnd(177).concat(fatherDNI.number.toString())
    .padEnd(185).concat(fatherDNI.letter)
    .padEnd(268).concat(getRandomName("woman").toUpperCase())
    .padEnd(288).concat(motherLastName)
    .padEnd(313).concat(utils.pickRandom(LAST_NAMES).toUpperCase())
    .padEnd(339).concat(motherDNI.foreign)
    .padEnd(340).concat(motherDNI.number.toString())
    .padEnd(348).concat(motherDNI.letter)
    .padEnd(431);
    
    return { newborn, address };
}


async function generateRandomLoadDocumentContent() {
    let promises :Promise<string>[] = [];
    let newbornAmount = utils.randomNumber(15, 45);
    let newborns :string[] = [];
    let addresses :{identifier :string, address :string, postalCode :number, municipality :string}[] = [];
    for(let i = 0; i < newbornAmount; i++) {
        let {newborn, address} = await generateRandomNewborn();
        newborns.push(newborn);
        if(address != null) {
            addresses.push(address);
        }
    }
    await db.addAddressesByIdDocument(addresses);
    return newborns.join('\n');
}


export async function generateZipWithRandomLoads() :Promise<Archiver> {
    console.log(`Se ha solicitado la generación de un archivo con cargas de muestra.`);
    return new Promise(async (resolve, reject) => {
        let archive = archiver("zip", {
            zlib: { level: 9 }
        });
    
        archive.on('error', err => {
            reject(err);
        });

        for(let i = 1; i <= 12; i++) {
            if(typeof process.stdout.cursorTo == "function") {
                process.stdout.write(`Generando cargas de muestra... ${(i).toString().padStart(2, ' ')}/12`);
                process.stdout.cursorTo(0);
            }
            let content = Buffer.from(await generateRandomLoadDocumentContent(), properties.get("Application.load-encoding", 'utf-8'));
            archive.append(content, {name: `Muestra.${i}99`});
        }
    
        archive.finalize();
        resolve(archive);
    });
}


function generateRandomAddress(dni :{foreign :string, number :string}) {
    let identifier = !dni.foreign ? dni.number.padStart(9, '0') : dni.foreign + dni.number;
    let address = utils.pickRandom(STREET_NAMES).toUpperCase() + ' ' + utils.randomNumber(1, 151);
    let postalCode = 28800 + utils.randomNumber(1, 6);
    return {
        identifier,
        address,
        postalCode,
        municipality: "ALCALA DE HENARES"
    };
}


function getRandomDate() {
    let today = new Date();
    let maxDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30);
    let minDate = new Date(today.getFullYear(), today.getMonth() - 2, today.getDate() + 1);
    let timestamp = Math.floor(Math.random() * (maxDate.getTime() - minDate.getTime() + 1) + minDate.getTime());
    return new Date(timestamp);
}


function formatDate(date :Date) {
    let year = date.getFullYear();
    let month = (date.getMonth() + 1).toString().padStart(2, '0');
    let day = date.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
}


function getRandomName(gender?: "man" | "woman") {
    let randomArray :string[];
    if (gender == "man") {
        randomArray = MEN_FIRST_NAMES;
    } else if (gender == "woman") {
        randomArray = WOMEN_FIRST_NAMES;
    } else {
        let randomIndex = Math.floor(Math.random() * 2);
        if (randomIndex === 0) {
            randomArray = MEN_FIRST_NAMES;
        } else {
            randomArray = WOMEN_FIRST_NAMES;
        }
    }
    return utils.pickRandom(randomArray);
}


function getRandomDNI() {
    const LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";
    if(Math.random() >= 0.05) {
        // National
        let number = utils.randomNumber(0, 10**8);
        let letter = LETTERS.charAt(number % 23);
        return {
            foreign: "",
            number: number.toString().padStart(8, '0'),
            letter
        };
    } else {
        // Foreign
        let number = utils.randomNumber(0, 10**7);
        let letter = LETTERS.charAt(number % 23);
        return {
            foreign: "X",
            number: number.toString().padStart(7, '0'),
            letter
        };
    }
}