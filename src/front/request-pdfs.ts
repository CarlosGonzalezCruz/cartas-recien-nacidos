import * as utils from "./utils.js";


export async function assignButtons() {
    await utils.documentReady();

    $("#btn-generate-pdf-letters").on("click", requestLetters);
    $("#btn-generate-pdf-listing").on("click", requestListing);
}


async function requestLetters() {
    try {
        let fetchRequest = await fetch("/newborns-data/letters", {
            method: "post",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                ids: utils.getSelectedNewbornIds()
            })
        });
        if(!fetchRequest.ok) {
            utils.displayMessageBox("No hay registros seleccionados. No se generarán sobres.", "error");
        } else {
            let data = await fetchRequest.blob();
            utils.displayMessageBox("Se han generado sobres para los registros seleccionados. "
            + "El archivo debería haberse abierto en otra pestaña.", "success");
            window.open(window.URL.createObjectURL(data));
        }
    } catch(e) {
        utils.displayMessageBox(`Ha ocurrido un problema al conectar con el servidor.`, "error");
    }
}


async function requestListing() {
    try {
        let fetchRequest = await fetch("/newborns-data/listing", {
            method: "post",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                ids: utils.getSelectedNewbornIds()
            })
        });
        if(!fetchRequest.ok) {
            utils.displayMessageBox("No hay registros seleccionados. No se generará ningún listado.", "error");
        } else {
            let data = await fetchRequest.blob();
            utils.displayMessageBox("Se ha generado un listado con los registros seleccionados. "
            + "El archivo debería haberse abierto en otra pestaña.", "success");
            window.open(window.URL.createObjectURL(data));
        }
    } catch(e) {
        utils.displayMessageBox(`Ha ocurrido un problema al conectar con el servidor.`, "error");
    }
}