
const MSG_BOX = $("#modal-dialog");
const MSG_BOX_ICONS = {
    none: "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=", // 1x1 blank image to use as placeholder
    success: "icons/hands-thumbs-up.svg",
    error: "icons/exclamation-circle.svg"
};


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


export function addsModalButtonKeybinding() {
    $(".modal").on("keypress", e => {
        if(e.key == "Enter") {
            e.preventDefault();
            $(e.currentTarget).find(".modal-footer .btn:last-child").trigger("click");
        }
    });
}