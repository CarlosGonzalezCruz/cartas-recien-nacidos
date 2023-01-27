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
}


export function applyDefaultFilter() {
    populateWithDataFetchedFrom("newborns-data/last-load", $("#btn-filter-last-load"));
}


async function populateWithDataFetchedFrom(path :string, button :JQuery<HTMLElement>) {
    filterButtons.removeClass("btn-active");
    filterButtons.addClass("btn-inactive");
    button.removeClass("btn-inactive");
    button.addClass("btn-active");

    let fetchResult = await fetch(path);
    let data = await fetchResult.json();

    populateTable(data);
}