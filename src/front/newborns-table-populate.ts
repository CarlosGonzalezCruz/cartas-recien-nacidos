let template = $("#newborns-row-template");
let tableBody = $("#newborns-table-body");
template.remove();


export function populateTable(data :any[]) {
    clearTable(tableBody);

    for(let newborn of data) {
        generateRow(newborn, template, tableBody);
    }
}


function clearTable(tableBody :JQuery<HTMLElement>) {
    tableBody.find(":not(#newborns-row-template)").remove();
}


function generateRow(data :any, template :JQuery<HTMLElement>, tableBody :JQuery<HTMLElement>) {
    let row = template.clone();
    row.removeAttr("id");
    row.attr("newborn-id", data["Id"]);
    let rowHtml = row.html();

    // Find all {{placeholders}} and replace them with the value corresponding to the field of the same name in received data
    let matches = rowHtml.matchAll(/{{(\w*)}}/g);

    for(let match of matches) {
        if(match[1] in data) {
            // If this value is an ISO string, trim for clarity
            if(typeof data[match[1]] == "string") {
                data[match[1]] = data[match[1]].replace(/^(\d{4}-\d{2}-\d{2})(T\d{2}:\d{2}:\d{2}\.\d{3}Z)$/, "$1");
            }
            rowHtml = rowHtml.replace(match[0], data[match[1]] == null ? '—' : data[match[1]]);
        }
    }

    row.html(rowHtml);
    tableBody.append(row);
    row.show();
}