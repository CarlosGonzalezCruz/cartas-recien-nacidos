import express from "express";
import process from "process";
import formidable from "formidable";
import * as db from "./db-queries.js";
import * as newborns from "./newborns-load-creation.js";
import { UploadedFile } from "./newborns-load-creation.js";
import { generateLettersForNewborns } from "./generate-letters.js";


const APP = express();

const STATUS_OK = 200;
const STATUS_CONFLICT = 409;
const STATUS_UNHANDLED_ERROR = 500;

export async function listen(port :number) {
    await db.open();
    APP.listen(port, () => {
        console.log(`Atendiendo al puerto ${port}...`);
    });
}

process.on("SIGINT", async () => {
    await db.close();
    console.log("Hasta luego");
    process.exit();
});

APP.use(express.static("web"));
APP.use(express.static("out/front"));
APP.use(express.json());
APP.use(express.urlencoded({extended: true}));

APP.get('/', (request, result) => {
    result.sendFile("index.html");
});

APP.get('/newborns-data/last-load', async (request, result) => {
    result.send(await db.getNewbornsFromLastLoad());
});

APP.get('/newborns-data/all', async (request, result) => {
    result.send(await db.getAllNewborns());
});

APP.get('/newborns-data/address-only', async (request, result) => {
    result.send(await db.getNewbornsWithAddressOnly());
});

APP.get('/newborns-data/loads', async (request, result) => {
    result.send(await db.getDistinctLoads());
});

APP.get('/newborns-data/letters', async (request, result) => {
    console.log("Generación de cartas solicitada");
    let selectedNewborns = db.getLastFilterQueryResult();
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

APP.post('/newborns-data/custom', async (request, result) => {
    result.send(await db.getNewbornsWithCustomFilter(...request.body));
});

APP.post('/newborns-data/loads', async (request, result) => {
    let form = formidable();
    form.parse(request, (error, fields, files) => {
        newborns.createLoads(fields["AnnoCarga"] as string, fields["MesCarga"] as string, files["Fichero"] as unknown as UploadedFile)
        .then(r => result.status(r.success ? STATUS_OK : STATUS_CONFLICT).send(r.msg));
    });
});

APP.post('/newborns-data/last-load', async (request, result) => {
    let form = formidable();
    form.parse(request, async (error, fields) => {
        let newborn :db.Newborn = {
            Nacido_Nombre: fields["Nacido_Nombre"] as string,
            Nacido_Apellido1: fields["Nacido_Apellido1"] as string,
            Nacido_Apellido2: fields["Nacido_Apellido2"] as string,
            ViviendaDireccion :fields["ViviendaDireccion"] as string,
            ViviendaCodigoPostal :Number(fields["ViviendaCodigoPostal"] as string),
            ViviendaNombreMunicipio :fields["ViviendaNombreMunicipio"] as string
        };
        try {
            let r = await db.insertNewbornForLatestLoad(newborn)
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
        count: await db.lastOperationAmountOfRowsUpdated()
    });
});