import * as filters from "./manage-filters.js";
import * as updates from "./manage-load-updates.js";
import * as pdfs from "./request-pdfs.js";
import * as msg from "./message-box.js";
import * as utils from "./utils.js"

filters.enableFilterButtons();
filters.applyDefaultFilter();

updates.enableLoadUpdateButtons();
pdfs.assignButtons();
msg.preloadMsgBoxIcons();

utils.addModalButtonKeybinding();
utils.displayProfileEnvironmentLabel();

$("#sample-loads-download-link").on("click", downloadSampleLoadsZip);


async function downloadSampleLoadsZip() {
    let loadingHandler = msg.displayLoadingBox("Generando archivo con cargas de muestra...");
    try {
        let fetchRequest = await fetch("/sample-ine-loads");
        let zipData = await fetchRequest.blob();
        window.open(window.URL.createObjectURL(zipData));
        
        await utils.concludeAndWait(loadingHandler);
        msg.displayMessageBox("Ha recibido un archivo que contiene varias cargas con el formato que emite habitualmente el INE. " +
            "Pruebe a añadir las cargas a la aplicación. Nota: Todos los datos de estas cargas son estrictamente ficticios.", 'success');
    } catch(e) {
        await utils.concludeAndWait(loadingHandler);
        console.error(`Ha ocurrido un problema inesperado al generar el archivo de cargas de muestra: ${e}`);
        msg.displayMessageBox("Ha ocurrido un problema al generar el archivo con cargas de muestra.", 'error');
    }
}