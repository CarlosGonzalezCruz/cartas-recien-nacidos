import { populateTable } from "./newborns-table-populate.js";
import * as utils from "./utils.js";


let filterButtons = $("#filters-panel .btn");
let currentFilterButton :JQuery<HTMLElement>;


export function enableFilterButtons() {
    $("#btn-filter-last-load").on("click", async e => {
        populateWithDataFetchedFrom("newborns-data/last-load", $(e.currentTarget));
    });
    
    $("#btn-filter-all").on("click", async e => {
        populateWithDataFetchedFrom("newborns-data/all", $(e.currentTarget));
    });
    
    $("#btn-filter-address-only").on("click", async e => {
        populateWithDataFetchedFrom("newborns-data/address-only", $(e.currentTarget));
    });

    $("#btn-filter-custom").on("click", async e => {
        $("#modal-filter-custom").modal("show");
    });

    $("#btn-filter-custom-search").on("click", async e => {
        customFilterSubmit();
    });
}


export function applyDefaultFilter() {
    currentFilterButton = $("#btn-filter-last-load");
    populateWithDataFetchedFrom("newborns-data/last-load", $("#btn-filter-last-load"));
}


export function reapplyCurrentFilter() {
    currentFilterButton.trigger("click");
}


function customFilterSubmit() {
    let formData = new FormData($("#form-filter-custom").get(0) as HTMLFormElement);
    populateWithDataFetchedFrom("newborns-data/custom", $("#btn-filter-custom"), Array.from(formData.entries()));
    $("#modal-filter-custom").modal("hide");
}


async function populateWithDataFetchedFrom(path :string, button :JQuery<HTMLElement>, postBody? :any) {
    filterButtons.removeClass("btn-active");
    filterButtons.addClass("btn-inactive");
    button.removeClass("btn-inactive");
    button.addClass("btn-active");
    currentFilterButton = button;

    let fetchInit = postBody == null ?
    {
        method: "get"
    } :
    {
        method: "post",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(postBody)
    };

    try {
        let fetchResult = await fetch(path, fetchInit);
        let data = await fetchResult.json();
        populateTable(data);
    } catch(error) {
        utils.displayMessageBox("Ha ocurrido un problema al conectar con el servidor.", "error");
    }

}