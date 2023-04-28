import * as filters from "./manage-filters.js";
import * as updates from "./manage-load-updates.js";
import * as pdfs from "./request-pdfs.js";
import * as msg from "./message-box.js";
import * as utils from "./utils.js"

filters.enableFilterButtons();
filters.applyDefaultFilter();

updates.enableLoadUpdateButtons();
pdfs.assignButtons();
msg.preloadMsgBoxIcons();

utils.addModalButtonKeybinding();
utils.displayProfileEnvironmentLabel();