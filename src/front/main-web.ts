import * as filters from "./manage-filters.js";
import * as updates from "./manage-load-updates.js";
import * as utils from "./utils.js"

filters.enableFilterButtons();
filters.applyDefaultFilter();

updates.enableLoadUpdateButtons();
$("#btn-generate-pdf").on("click", utils.downloadLetters);

utils.addModalButtonKeybinding();
utils.preloadMsgBoxIcons();
