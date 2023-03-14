
const MSG_BOX = $("#modal-dialog");
const MSG_BOX_ICONS = {
    none: "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=", // 1x1 blank image to use as placeholder
    success: "icons/hand-thumbs-up.svg",
    error: "icons/exclamation-circle.svg"
};

const MONTH_NAMES = ["<0>", "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];


export function displayMessageBox(message :string, icon :keyof typeof MSG_BOX_ICONS = "none") {
    MSG_BOX.find("#modal-dialog-message").text(message);
    MSG_BOX.find("#modal-dialog-icon").attr("src", MSG_BOX_ICONS[icon]);
    if($(".modal:visible").length == 0) {
        MSG_BOX.modal("show");
    } else {
        $(".modal:visible").modal("hide");
        $(".modal:visible").on("hidden.bs.modal", e => {
            MSG_BOX.modal("show");
            $(".modal").off("hidden.bs.modal");
        });
    }
}


export function preloadMsgBoxIcons() {
    for(let entry of Object.entries(MSG_BOX_ICONS)) {
        let newImgElement = new Image();
        newImgElement.src = entry[1];
        $("#modal-preloaded-icons").append(newImgElement);
    }
}


export function documentReady() {
    return new Promise<void>(resolve => {
        jQuery(resolve);
    });
}


export async function downloadLetters() {
    try {
        let fetchRequest = await fetch("/newborns-data/letters", {
            method: "post",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                ids: getSelectedNewbornIds()
            })
        });
        if(!fetchRequest.ok) {
            displayMessageBox("La carga seleccionada está vacía. Es posible que el servidor "
            + "haya sido reiniciado durante su sesión. Recargue la página e inténtelo de nuevo.", "error");
        } else {
            let data = await fetchRequest.blob();
            displayMessageBox("Se han generado sobres para el último filtro seleccionado o, en su defecto, "
            + "para la carga más reciente. El archivo debería haberse abierto en otra pestaña.", "success");
            window.open(window.URL.createObjectURL(data));
        }
    } catch(e) {
        displayMessageBox(`Ha ocurrido un problema al conectar con el servidor.`, "error");
    }
}


export function getMonthName(id :number) {
    if(id >= 1 && id <= 12) {
        return MONTH_NAMES[id];
    } else {
        throw new RangeError(`Only values from 1 to 12 are allowed. Received: ${id}`);
    }
}


export function getMonthId(name :string) {
    let selectedId = MONTH_NAMES.indexOf(name.toUpperCase());
    if(selectedId != -1) {
        return selectedId;
    } else {
        return null;
    }
}


export function* allMonthNames() {
    for(let i = 1; i < 13; i++) {
        yield MONTH_NAMES[i];
    }
}


export function addModalButtonKeybinding() {
    $(document).on("keypress", e => {
        if(e.key == "Enter") {
            $(".modal:visible input").trigger("blur");
            $(".modal:visible .modal-footer .btn:last-child").get(0)?.click();
        }
    });
}


export function getSelectedNewbornIds() {
    let ret :string[] = [];
    $("#newborns-table-body tr").has(":checkbox:checked").each(function() {
        ret.push($(this).attr("newborn-id") as string);
    })
    return ret;
}