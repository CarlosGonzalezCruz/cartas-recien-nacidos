import express from "express";
import process from "process";
import formidable from "formidable";
import * as db from "./db-queries.js";
import * as newborns from "./newborns-load-creation.js";
import { UploadedFile } from "./newborns-load-creation.js";

const APP = express();

export function listen(port :number) {
    db.open();
    APP.listen(port, () => {
        console.log(`Atendiendo al puerto ${port}...`);
    });
}

process.on("close", () => {
    db.close();
    console.log("Hasta luego");
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

APP.post('/newborns-data/custom', async (request, result) => {
    result.send(await db.getNewbornsWithCustomFilter(...request.body));
});

APP.post('/newborns-data/loads', async (request, result) => {
    let form = formidable();
    form.parse(request, (error, fields, files) => {
        newborns.createLoads(fields["AnnoCarga"] as string, fields["MesCarga"] as string, files["Fichero"] as unknown as UploadedFile)
        .then(r => result.send(r));
    });

});

APP.delete('/newborns-data/loads', async (request, result) => {
    let loadName = request.body[0][1];
    await db.deleteLoad(loadName);
    result.send(await db.lastOperationAmountOfRowsUpdated());
});