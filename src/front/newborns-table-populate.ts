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
    let matches = rowHtml.matchAll(/{{(\w*)}}/g);

    for(let match of matches) {
        if(match[1] in data) {
            rowHtml = rowHtml.replace(match[0], data[match[1]] == null ? '—' : data[match[1]]);
        }
    }

    row.html(rowHtml);
    tableBody.append(row);
    row.show();
}