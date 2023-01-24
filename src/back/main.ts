import express from 'express'
import sqlite3 from 'sqlite3'
import path from 'path'

const PORT = 3000;
const DB_PATH = "./db/nacimientos"
const WEB_INDEX = "./web/index.html"

const APP = express();

let nacimientos = await openDatabase();

APP.get('/', (request, result) => {
    result.sendFile(path.resolve(WEB_INDEX));
});

APP.get('/test-content', (request, result) => {
    result.send("Este texto ha sido enviado desde el servidor");
});

APP.use(express.static("web"));
APP.use(express.static("out/front"));
APP.listen(PORT, () => {
    console.log(`Atendiendo al puerto ${PORT}...`);
});


function openDatabase() :Promise<sqlite3.Database> {
    return new Promise((resolve, reject) => {
        let success = false;
        let db = new sqlite3.Database(DB_PATH, err => {
            if(err) {
                reject(err);
            }
            console.log(`Conectado a ${DB_PATH}`);
        });
        resolve(db);
    });
}


function select_all_data(db :sqlite3.Database) {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM Nacimientos", (err, rows) => {
            if(err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}