import { populateTable } from "./newborns-table-populate.js";
import * as msg from "./message-box.js";
import * as utils from "./utils.js";


let displayedRows = 0;
let filterButtons = $("#filters-panel .btn");
let currentFilterButton :JQuery<HTMLElement>;
let currentFilterPath :string;
let currentFilterParameters :any;


export async function enableFilterButtons() {
    await utils.documentReady();

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

    $("#btn-filter-custom-clear").on("click", async e => {
        customFilterClear();
    });

    $("#btn-filter-custom-search").on("click", async e => {
        customFilterSubmit();
    });

    $("#filter-custom-ad-hoc").on("click", async e => {
        checkLoadNameFieldBasedOnAdHoc();
    });

    $("#select-all-newborns").on("change", async e => {
        toggleSelectAll();
    });

    checkLoadNameFieldBasedOnAdHoc();
}


export function applyDefaultFilter() {
    currentFilterButton = $("#btn-filter-last-load");
    currentFilterPath = "newborns-data/last-load";
    currentFilterParameters = null;
    populateWithDataFetchedFrom(currentFilterPath, currentFilterButton);
}


export function reapplyCurrentFilter() {
    populateWithDataFetchedFrom(currentFilterPath, currentFilterButton, currentFilterParameters);
}


export function applyAdHocRegistrationFilter() {
    currentFilterButton = $("null");
    currentFilterPath = "newborns-data/last-inserted";
    currentFilterParameters = null;
    populateWithDataFetchedFrom(currentFilterPath, currentFilterButton);
}


function checkLoadNameFieldBasedOnAdHoc() {
    $("#filter-custom-load-name").prop('disabled', $("#filter-custom-ad-hoc").is(":checked"));
}


function customFilterClear() {
    $("#modal-filter-custom input:not(:checkbox)").val("");
    $("#modal-filter-custom input:checkbox").prop({
        checked: false
    });
    checkLoadNameFieldBasedOnAdHoc();
}


function customFilterSubmit() {
    let formData = new FormData($("#form-filter-custom").get(0) as HTMLFormElement);
    populateWithDataFetchedFrom("newborns-data/custom", $("#btn-filter-custom"), Array.from(formData.entries()));
    $("#modal-filter-custom").modal("hide");
}


async function populateWithDataFetchedFrom(path :string, button :JQuery<HTMLElement>, postBody? :any) {
    let loadingHandler = msg.displayLoadingBox("Buscando registros...");
    filterButtons.removeClass("btn-active");
    filterButtons.addClass("btn-inactive");
    button.removeClass("btn-inactive");
    button.addClass("btn-active");
    currentFilterButton = button;
    currentFilterPath = path;
    currentFilterParameters = postBody;

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
        if(fetchResult.status == 400) {
            await utils.concludeAndWait(loadingHandler);
            msg.displayMessageBox(data.message, "error");
            return;
        } else {
            loadingHandler.conclude();
        }
        displayedRows = data.length;
        populateTable(data);
        $("#newborns-table-body :checkbox").on("change", async e => {
            recalculateSelectAllCheckbox();
        });
        recalculateSelectAllCheckbox();
    } catch(error) {
        await utils.concludeAndWait(loadingHandler);
        msg.displayMessageBox("Ha ocurrido un problema al conectar con el servidor.", "error");
    }
}


function toggleSelectAll() {
    if($("#select-all-newborns").is(":checked")) {
        $("#newborns-table-body :checkbox:not(:checked)").prop({
            checked: true
        });
    } else {
        $("#newborns-table-body :checkbox:checked").prop({
            checked: false
        });
    }
}


function recalculateSelectAllCheckbox() {
    let sum = 0;
    let selectAllCheckbox = $("#select-all-newborns");
    $("#newborns-table-body :checkbox:checked").each(() => {sum += 1});

    if(sum == 0) {
        selectAllCheckbox.prop({
            checked: false,
            indeterminate: false
        });
    } else if(sum == displayedRows) {
        selectAllCheckbox.prop({
            checked: true,
            indeterminate: false
        });
    } else {
        selectAllCheckbox.prop({
            checked: false,
            indeterminate: true
        });
    }
}