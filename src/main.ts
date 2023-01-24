import express from 'express'
import sqlite3 from 'sqlite3';

const PORT = 3000;
const DB_PATH = "./db/nacimientos"

const APP = express();

let nacimientos = await openDatabase();

APP.get('/', (request, result) => {
    select_all_data(nacimientos)
        .then(rows => result.send(rows));
});

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