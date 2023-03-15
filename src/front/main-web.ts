import * as filters from "./manage-filters.js";
import * as updates from "./manage-load-updates.js";
import * as pdfs from "./request-pdfs.js";
import * as utils from "./utils.js"

filters.enableFilterButtons();
filters.applyDefaultFilter();

updates.enableLoadUpdateButtons();
pdfs.assignButtons();

utils.addModalButtonKeybinding();
utils.preloadMsgBoxIcons();
