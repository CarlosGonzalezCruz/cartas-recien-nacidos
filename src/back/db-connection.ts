import sqlite3 from "sqlite3";

const DB_PATH = "./db/nacimientos";
let db :sqlite3.Database;


export function open() :Promise<sqlite3.Database> {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(DB_PATH, err => {
            if(err) {
                reject(err);
            }
            console.log(`Conectado a ${DB_PATH}`);
        });
        resolve(db);
    });
}


export function close() {
    db.close();
    console.log(`Conexión terminada con ${DB_PATH}`);
}


export function performQuery(query :string) :Promise<{[key :string] :any}[]> {
    return new Promise((resolve, reject) => {
        db.all(query, (err, rows) => {
            if(err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}