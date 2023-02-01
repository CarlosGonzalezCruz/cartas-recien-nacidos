import * as filters from "./manage-filters.js";
import * as utils from "./utils.js";


export function enableLoadUpdateButtons() {
    $("#btn-remove-load").on("click", async e => {
        fetchPossibleLoads();
        $("#modal-remove-load").modal("show");
        $("#btn-remove-load-confirm").on("click", async e => {
            removeLoads();
        });
    }); 
}


async function fetchPossibleLoads() {
    let fetchRequest = await fetch("/newborns-data/loads");
    let data :{"NombreCarga" :string}[] = await fetchRequest.json();
    let sortedLoads = data.sort((a1, a2) => a1.NombreCarga > a2.NombreCarga ? 1 : -1); // Oldest first
    $("#selector-remove-load-options").empty();
    for(let load of sortedLoads) {
        let option = $(document.createElement("option"));
        option.attr("value", load.NombreCarga);
        $("#selector-remove-load-options").append(option);
    }
    $("#selector-remove-load").val(sortedLoads[0].NombreCarga);
}


async function removeLoads() {
    let formData = new FormData($("#form-remove-load").get(0) as HTMLFormElement);
    let entries = Array.from(formData.entries());

    let fetchInit = {
        method: "delete",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(entries)
    };
    
    try {
        let fetchRequest = await fetch("/newborns-data/loads", fetchInit);
        let data = await fetchRequest.json();
        let count = data['COUNT'];
        utils.displayMessageBox(`Se ha eliminado ${count} registros.`, count > 0 ? "success" : "error");
        filters.reapplyCurrentFilter();
    } catch(error) {
        utils.displayMessageBox(`Ha habido un problema al conectar con el servidor`, "error");
    }
}