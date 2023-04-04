import * as filters from "./manage-filters.js";
import * as utils from "./utils.js";


let loads :{NombreCarga :string}[] = [];

export async function enableLoadUpdateButtons() {
    await utils.documentReady();

    $("#btn-create-load").on("click", async e => {
        prepareDefaultDate();
        setModalConfirmEnabled($("#btn-create-load-confirm"), validateLoadCreation());
        $("#modal-create-load").modal("show");
    });
    $("#btn-remove-load").on("click", async e => {
        await fetchPossibleLoads();
        setModalConfirmEnabled($("#btn-remove-load-confirm"), validateLoadDeletion());
        $("#modal-remove-load").modal("show");
    });
    $("#btn-adhoc-registry").on("click", async e => {
        setModalConfirmEnabled($("#btn-adhoc-registry-confirm"), validateAdHocRegistry());
        $("#modal-adhoc-registry").modal("show");
    });
    $("#btn-remove-selection").on("click", async e => {
        let selected = utils.getSelectedNewbornIds();
        if(selected.length != 0) {
            $("#modal-remove-selected-number").text(selected.length);
            $("#modal-remove-selected").modal("show");
        } else {
            utils.displayMessageBox("No hay registros seleccionados. No se eliminará ningún registro.", "error");
        }
    })

    $("#btn-create-load-confirm").on("click", async e => {
        if(validateLoadCreation()) {
            createLoads();
            $("#modal-create-load").modal("hide");
        } else {
            utils.displayMessageBox("Los datos introducidos no son correctos. Por favor revíselos.", "error");
        }
    });

    $("#btn-remove-load-confirm").on("click", async e => {
        if(validateLoadDeletion()) {
            removeLoads();
            $("#modal-remove-load").modal("hide");
        } else {
            utils.displayMessageBox("La carga introducida no existe. Por favor revise que la ha escrito correctamente.", "error");
        }
    });

    $("#btn-remove-selected-confirm").on("click", async e => {
        removeSelected();
        $("#modal-remove-selected").modal("hide");
    });

    $("#btn-adhoc-registry-confirm").on("click", async e => {
        if(validateAdHocRegistry()) {
            createAdHocRegistry();
            $("#modal-adhoc-registry").modal("hide");
            filters.applyAdHocRegistrationFilter();
        } else {
            utils.displayMessageBox("Los datos introducidos no son correctos. Por favor revíselos.", "error");
        }
    });

    $("#modal-create-load input[type=file]").on("change", async e => {
        setDefaultLoadIdentifier();
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
    $("#modal-create-load input[type!=file]").on("input", e => setModalConfirmEnabled($("#btn-create-load-confirm"), validateLoadCreation()));
    $("#modal-create-load input[type=file]").on("change", e => setModalConfirmEnabled($("#btn-create-load-confirm"), validateLoadCreation()));

    $("#modal-remove-load input").on("input", e => setModalConfirmEnabled($("#btn-remove-load-confirm"), validateLoadDeletion()));
    $("#modal-adhoc-registry input").on("input", e => setModalConfirmEnabled($("#btn-adhoc-registry-confirm"), validateAdHocRegistry()));
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


function validateLoadDeletion() {
    let value = $("#selector-remove-load").val();
    if(value == "") {
        return false;
    }
    for(let load of loads) {
        if(value == load.NombreCarga) {
            return true;
        }
    }
    return false;
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


function setDefaultLoadIdentifier() {
    let fileInput = $("#selector-create-load-file").get(0) as HTMLInputElement;
    let loadedFile = fileInput.files != null ? fileInput.files[0] : null;
    if(loadedFile == null) {
        return;
    }
    if(!$("#selector-create-load-custom-name").val()) {
        let groups = [...loadedFile.name.matchAll(/.*\.(\d+)$/g)];
        if(groups[0]?.length >= 2) {
            $("#selector-create-load-custom-name").val(groups[0][1]);
        }
    }
}


async function fetchPossibleLoads() {
    let fetchRequest = await fetch("/newborns-data/loads");

    let data :{"NombreCarga" :string}[] = await fetchRequest.json();
    if(data.length == 0) {
        return;
    }
    let sortedLoads = data.sort((a1, a2) => a1.NombreCarga > a2.NombreCarga ? 1 : -1); // Oldest first
    loads = sortedLoads;
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
        let msg = await fetchRequest.text();
        if(fetchRequest.ok) {
            utils.displayMessageBox(msg, "success");
            filters.reapplyCurrentFilter();
        } else {
            utils.displayMessageBox(`No se ha podido crear la carga: ${msg}`, "error");
        }
    } catch(error) {
        utils.displayMessageBox(`Ha ocurrido un problema al conectar con el servidor`, "error");
    }
}


async function createAdHocRegistry() {
    let formData = new FormData($("#form-adhoc-registry").get(0) as HTMLFormElement);

    let fetchInit = {
        method: "post",
        body: formData
    };

    try {
        let fetchRequest = await fetch("/newborns-data/last-load", fetchInit);
        if(fetchRequest.ok) {
            let data = await fetchRequest.json();
            utils.displayMessageBox(`Se ha creado ${data.count} registro correctamente.`, "success");
            filters.reapplyCurrentFilter();
        } else {
            utils.displayMessageBox(`No se ha podido añadir el registro.`, "error");
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
        utils.displayMessageBox(`Se han eliminado ${data.count} registros.`, data.count > 0 ? "success" : "error");
        filters.reapplyCurrentFilter();
    } catch(error) {
        utils.displayMessageBox(`Ha ocurrido un problema al conectar con el servidor`, "error");
    }
}


async function removeSelected() {
    let fetchInit = {
        method: "delete",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            ids: utils.getSelectedNewbornIds()
        })
    };
    
    try {
        let fetchRequest = await fetch("/newborns-data/by-id", fetchInit);
        let data = await fetchRequest.json();
        utils.displayMessageBox(`Se han eliminado ${data.count} registros.`, data.count > 0 ? "success" : "error");
        filters.reapplyCurrentFilter();
    } catch(error) {
        utils.displayMessageBox(`Ha ocurrido un problema al conectar con el servidor`, "error");
    }
}