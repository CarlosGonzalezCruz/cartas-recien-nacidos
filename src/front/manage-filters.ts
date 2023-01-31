import { populateTable } from "./newborns-table-populate.js";


let filterButtons = $("#filters-panel .btn");


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
    populateWithDataFetchedFrom("newborns-data/last-load", $("#btn-filter-last-load"));
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

    let fetchInit = postBody == null ?
    {
        method: "get"
    } :
    {
        method: "post",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(postBody)
    };

    let fetchResult = await fetch(path, fetchInit);
    let data = await fetchResult.json();

    populateTable(data);
}