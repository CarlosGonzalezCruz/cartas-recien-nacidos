import express from "express";
import process from "process";
import * as db from "./db-queries.js";

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