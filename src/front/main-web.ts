import * as filters from "./manage-filters.js";
import * as updates from "./manage-load-updates.js";


filters.enableFilterButtons();
filters.applyDefaultFilter();

updates.enableLoadUpdateButtons();

$(".modal").on("keypress", e => {
    if(e.key == "Enter") {
        $(e.currentTarget).find(".modal-footer .btn:last-child").trigger("click");
    }
});