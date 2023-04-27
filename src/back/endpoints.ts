import express from "express";
import process from "process";
import formidable from "formidable";
import * as db from "./db-queries.js";
import * as newborns from "./newborns-load-creation.js";
import * as properties from "./properties.js";
import { NewbornAdHoc, getNewbornDataFromAdHoc } from "./utils.js";
import { UploadedFile } from "./newborns-load-creation.js";
import { generateLettersForNewborns, generateListingForNewborns } from "./generate-letters.js";


const APP = express();

const STATUS_OK = 200;
const STATUS_CONFLICT = 409;
const STATUS_UNHANDLED_ERROR = 500;

export async function listen(port :number) {
    await db.openMySQL();
    APP.listen(port, () => {
        console.log(`Atendiendo al puerto ${port}...`);
    });
}

process.on("SIGINT", async () => {
    await db.closeAll();
    console.log("Hasta luego");
    setTimeout(process.exit, 500);
});

process.on("exit", async () => {
    await db.closeAll(); // In case it wasn't properly closed on SIGINT
});

APP.use(express.static("web"));
APP.use(express.static("out/front"));
APP.use(express.json());
APP.use(express.urlencoded({extended: true}));

APP.get('/', (request, result) => {
    result.sendFile("index.html");
});

APP.get('/profile-environment', (request, result) => {
    result.send(properties.get("Application.environment-label", ""));
});

APP.get('/newborns-data/last-load', async (request, result) => {
    result.send(await db.getNewbornsFromLastLoad());
});

APP.get('/newborns-data/last-inserted', async (request, result) => {
    result.send(await db.getLastInsertedNewborn());
})

APP.get('/newborns-data/all', async (request, result) => {
    result.send(await db.getAllNewborns());
});

APP.get('/newborns-data/address-only', async (request, result) => {
    result.send(await db.getNewbornsWithAddressOnly());
});

APP.get('/newborns-data/loads', async (request, result) => {
    result.send(await db.getDistinctLoads());
});

APP.post('/newborns-data/letters', async (request, result) => {
    console.log("Generación de cartas solicitada");
    let selectedNewborns = await db.getNewbornsWithIds(...request.body.ids);
    try {
        let letterData = await generateLettersForNewborns(...selectedNewborns);
        result.writeHead(200, {
            "Content-Length": Buffer.byteLength(letterData),
            "Content-Type": "application/pdf",
            "Content-disposition": "attachment;filename=cartas.pdf"
        }).end(letterData);
    } catch(e) {
        result.writeHead(400).end();
    }
});

APP.post('/newborns-data/listing', async (request, result) => {
    console.log("Generación de listado solicitado");
    let selectedNewborns = await db.getNewbornsWithIds(...request.body.ids);
    try {
        let letterData = await generateListingForNewborns(...selectedNewborns);
        result.writeHead(200, {
            "Content-Length": Buffer.byteLength(letterData),
            "Content-Type": "application/pdf",
            "Content-disposition": "attachment;filename=cartas.pdf"
        }).end(letterData);
    } catch(e) {
        result.writeHead(400).end();
    }
});

APP.post('/newborns-data/custom', async (request, result) => {
    try {
        result.send(await db.getNewbornsWithCustomFilter(...request.body));
    } catch(e) {
        result.status(400).send({ message: `Ha ocurrido un problema con la búsqueda: ${e.message}` });
    }
});

APP.post('/newborns-data/loads', async (request, result) => {
    let form = formidable();
    form.parse(request, (error, fields, files) => {
        newborns.createLoads(fields["AnnoCarga"] as string, fields["MesCarga"] as string, fields["NombreCarga"] as string, files["Fichero"] as unknown as UploadedFile)
        .then(r => result.status(r.success ? STATUS_OK : STATUS_CONFLICT).send(r.msg));
    });
});

APP.post('/newborns-data/last-load', async (request, result) => {
    let form = formidable();
    form.parse(request, async (error, fields) => {
        let newborn :NewbornAdHoc = {
            Nacido_Nombre: fields["Nacido_Nombre"] as string,
            Nacido_Apellido1: fields["Nacido_Apellido1"] as string,
            Nacido_Apellido2: fields["Nacido_Apellido2"] as string,
            ViviendaDireccion :fields["ViviendaDireccion"] as string,
            ViviendaCodigoPostal :fields["ViviendaCodigoPostal"] as string,
            ViviendaNombreMunicipio :fields["ViviendaNombreMunicipio"] as string
        };
        try {
            let r = await db.insertNewbornAdHoc(getNewbornDataFromAdHoc(newborn))
            result.status(r.success ? STATUS_OK : STATUS_CONFLICT).send(JSON.stringify({count: r.count.toString()}));
        } catch(e) {
            if(e == db.NO_LOADS_ERROR) {
                result.sendStatus(STATUS_CONFLICT);
            } else {
                result.sendStatus(STATUS_UNHANDLED_ERROR);
            }
        }
    });
});

APP.delete('/newborns-data/loads', async (request, result) => {
    let loadName = request.body[0][1];
    await db.deleteLoad(loadName);
    result.send({
        count: await db.lastOperationAmountOfRowsUpdated(true)
    });
});

APP.delete('/newborns-data/by-id', async (request, result) => {
    await db.deleteNewbornsWithIds(...request.body.ids);
    result.send({
        count: await db.lastOperationAmountOfRowsUpdated(true)
    });
});