import PDF from "pdfkit-table";
import { Newborn } from "./utils.js";


// Sizes and distances are indicated in points (pt)

export async function generateLettersForNewborns(...newborns :Newborn[]) {
    return new Promise<Buffer>((resolve, reject) => {      
        if(newborns.length == 0) {
            reject();
        }
        
        let document = new PDF({
            size: [588, 232], // 20.75cm x 8.00cm
            margin: 0
        });

        let buffers :any[] = [];
        document.on("data", buffers.push.bind(buffers));
        document.on("end", () => {
            let pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });

        let firstPage = true;
        let skipped = 0;
        for(let newborn of newborns) {
            if(!newborn.ViviendaDireccion || !newborn.ViviendaCodigoPostal || !newborn.ViviendaNombreMunicipio) {
                skipped++;
                continue;
            }
            if(!firstPage) {
                // PDFKit documents have 1 page by default. If we were to add a new page for the first newborn, we'd be left with a leading blank page
                document.addPage();
            }
            generateEnvelope(document, newborn);
            firstPage = false;
        }
        if(skipped > 0) {
            console.log(`Para la carga seleccionada, ${skipped} registros no tienen datos de dirección, código postal, o municipio. No se ha generado sobre para ellos.`);
        }
        document.end();
    });
}


export async function generateListingForNewborns(...newborns :Newborn[]) {
    return new Promise<Buffer>((resolve, reject) => {
        if(newborns.length == 0) {
            reject();
        }

        let document = new PDF({
            margin: 20
        });

        let buffers :any[] = [];
        document.on("data", buffers.push.bind(buffers));
        document.on("end", () => {
            let pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });

        let commonLoad = determineNewbornsCommonLoad(...newborns);
        let rows = newborns
            .filter(n => n.ViviendaDireccion != null && n.ViviendaCodigoPostal != null)
            .map(n => [`FAMILIARES DE ${n.Nacido_Nombre} ${n.Nacido_Apellido1} ${n.Nacido_Apellido2}`, `${n.ViviendaDireccion}`, `${n.ViviendaCodigoPostal}`]);
        
        document.font("Helvetica-Bold").fontSize(24)
            .text(`Listado Nacidos ${commonLoad.month ? commonLoad.month : "varios meses"} de ${commonLoad.year ? commonLoad.year : "varios años"}`, {align: "center", underline: true});
        document.table({
            headers: [{label: "Nombre", width: 260}, {label: "Dirección", width: 260}, {label: "CP", width: 50}],
            rows: rows
        })
        if(newborns.length > rows.length) {
            console.log(`Para la carga seleccionada, ${newborns.length - rows.length} registros no tienen datos de dirección o código postal. No se han incluido en el listado.`);
        }
        document.font("Helvetica-Bold").fontSize(16).text(`Total de entradas: ${rows.length}`, {align: "center"});
        document.end();
    });
}


function generateEnvelope(document :PDFKit.PDFDocument, newborn :Newborn) {
    document.image("assets/ayto-logo.jpg", 2, 2, {width: 108, height: 108});
    document.image("assets/franqueo-pagado.jpg", 402, 2, {width: 154, height: 64});

    document.fontSize(9);
    document.text(`FAMILIARES DE ${newborn.Nacido_Nombre} ${newborn.Nacido_Apellido1} ${newborn.Nacido_Apellido2}`, 242, 145);
    document.text(`${newborn.ViviendaDireccion}`, 242, 163);
    document.text(`${newborn.ViviendaCodigoPostal} ${newborn.ViviendaNombreMunicipio}`, 242, 182);
}


function determineNewbornsCommonLoad(...newborns :Newborn[]) {

    let sharedMonth :string | null | "many" = null;
    let sharedYear :number | null | "many" = null;

    for(let newborn of newborns) {
        if(sharedMonth == null && newborn.MesCarga) {
            sharedMonth = newborn.MesCarga;
        } else if(sharedMonth != null && sharedMonth != "many" && newborn.MesCarga && sharedMonth != newborn.MesCarga) {
            sharedMonth = "many";
        }

        if(sharedYear == null && newborn.AnnoCarga) {
            sharedYear = newborn.AnnoCarga;
        } else if(sharedYear != null && sharedYear != "many" && newborn.AnnoCarga && sharedYear != newborn.AnnoCarga) {
            sharedYear = "many";
        }
    }

    return {
        month: sharedMonth != "many" ? sharedMonth : null,
        year: sharedYear != "many" ? sharedYear : null
    };
}


