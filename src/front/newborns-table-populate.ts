let template = $("#newborns-row-template");
let tableBody = $("#newborns-table-body");
template.remove();

(async () => {
    let fetchResult = await fetch("newborns-data");
    let data = await fetchResult.json();

    for(let newborn of data) {
        generateRow(newborn, template, tableBody);
    }
})();


function generateRow(data :any, template :JQuery<HTMLElement>, tableBody :JQuery<HTMLElement>) {
    let row = template.clone();
    row.removeAttr("id");
    let rowHtml = row.html();
    let matches = rowHtml.matchAll(/{{(\w*)}}/g);

    for(let match of matches) {
        if(match[1] in data) {
            rowHtml = rowHtml.replace(match[0], data[match[1]] == null ? '—' : data[match[1]]);
        }
    }

    row.html(rowHtml);
    tableBody.append(row);
}