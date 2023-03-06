import * as filters from "./manage-filters.js";
import * as utils from "./utils.js";


export function enableLoadUpdateButtons() {
    $("#btn-create-load").on("click", async e => {
        prepareDefaultDate();
        setModalConfirmEnabled($("#btn-create-load-confirm"), validateLoadCreation());
        $("#modal-create-load").modal("show");
    });
    $("#btn-remove-load").on("click", async e => {
        fetchPossibleLoads();
        $("#modal-remove-load").modal("show");
    });
    $("#btn-adhoc-registry").on("click", async e => {
        setModalConfirmEnabled($("#btn-adhoc-registry-confirm"), validateAdHocRegistry());
        $("#modal-adhoc-registry").modal("show");
    });

    $("#btn-create-load-confirm").on("click", async e => {
        if(validateLoadCreation()) {
            createLoads();
            $("#modal-create-load").modal("hide");
        } else {
            utils.displayMessageBox("Los datos introducidos no son correctos. Por favor revíselos.", "error");
        }
    });

    $("#btn-remove-load-confirm").on("click", async e => {
        removeLoads();
    });

    $("#btn-adhoc-registry-confirm").on("click", async e => {
        if(validateAdHocRegistry()) {
            utils.displayMessageBox("Datos del registro recibidos", "success");
        } else {
            utils.displayMessageBox("Los datos introducidos no son correctos. Por favor revíselos.", "error");
        }
    });

    assignModalFocusOutEvents();
}


function prepareDefaultDate() {
    let currentDate = new Date();
    $("#selector-create-load-year").val(currentDate.getFullYear());
    $("#selector-create-load-month").val(utils.getMonthName(currentDate.getMonth() + 1));
    $("#selector-create-load-month-options").empty();
    for(let month of utils.allMonthNames()) {
        let option = $(document.createElement("option"));
        option.attr("value", month);
        $("#selector-create-load-month-options").append(option);
    }
}


function assignModalFocusOutEvents() {
    $("#modal-create-load input[type!=file]").on("blur", e => setModalConfirmEnabled($("#btn-create-load-confirm"), validateLoadCreation()));
    $("#modal-create-load input[type=file]").on("change", e => setModalConfirmEnabled($("#btn-create-load-confirm"), validateLoadCreation()));

    $("#modal-adhoc-registry input").on("blur", e => setModalConfirmEnabled($("#btn-adhoc-registry-confirm"), validateAdHocRegistry()));
}


function setModalConfirmEnabled(button :JQuery<HTMLElement>, state :boolean) {
    if(state) {
        button.removeClass("disabled");
        button.prop("disabled", false);
    } else {
        button.addClass("disabled");
        button.prop("disabled", true);
    }
}


function validateLoadCreation() {
    if($("#selector-create-load-year").val() == "") {
        return false;
    }
    let monthName = $("#selector-create-load-month").val() as string;
    if(monthName == "") {
        return false;
    } else if(utils.getMonthId(monthName) == null) {
        return false;
    }
    let selectorFile = $("#selector-create-load-file").val() as string[];
    if(selectorFile.length == 0) {
        return false;
    }
    return true;
}


function validateAdHocRegistry() {
    if($("#adhoc-newborn-name").val() == "" && $("#adhoc-newborn-surname1").val() == "" && $("#adhoc-newborn-surname2").val() == "") {
        return false;
    }
    if($("#adhoc-newborn-address").val() == "") {
        return false;
    }
    if($("#adhoc-newborn-municipality").val() == "") {
        return false;
    }
    if($("#adhoc-newborn-postalcode").val() == "") {
        return false;
    }
    return true;
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


async function createLoads() {
    let formData = new FormData($("#form-create-load").get(0) as HTMLFormElement);

    let fetchInit = {
        method: "post",
        body: formData
    };

    try {
        let fetchRequest = await fetch("/newborns-data/loads", fetchInit);
        let data = await fetchRequest.json();
        if(data.success) {
            utils.displayMessageBox(data.msg, "success");
            filters.reapplyCurrentFilter();
        } else {
            utils.displayMessageBox(`No se ha podido crear la carga: ${data.msg}`, "error");
        }
    } catch(error) {
        utils.displayMessageBox(`Ha ocurrido un problema al conectar con el servidor`, "error");
    }
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
        let count = data.count;
        utils.displayMessageBox(`Se han eliminado ${count} registros.`, count > 0 ? "success" : "error");
        filters.reapplyCurrentFilter();
    } catch(error) {
        utils.displayMessageBox(`Ha ocurrido un problema al conectar con el servidor`, "error");
    }
}