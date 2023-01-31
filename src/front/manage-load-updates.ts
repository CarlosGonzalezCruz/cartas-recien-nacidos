

const MSG_BOX = $("#modal-dialog");


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
    let fetchRequest = fetch("/newborns-data/loads");
    let data :{"NombreCarga" :string}[] = await (await fetchRequest).json();
    let sortedLoads = data.sort((a1, a2) => a1.NombreCarga > a2.NombreCarga ? 1 : -1); // Oldest first
    $("#selector-remove-load-options").empty();
    for(let load of sortedLoads) {
        let option = $(document.createElement("option"));
        option.attr("value", load.NombreCarga);
        $("#selector-remove-load-options").append(option);
    }
    $("#selector-remove-load").val(sortedLoads[0].NombreCarga);
    console.log(data);
}


async function removeLoads() {
    $(".modal").modal("hide");
    MSG_BOX.find("#modal-dialog-message").text("Eliminando...");
    MSG_BOX.modal("show");
}