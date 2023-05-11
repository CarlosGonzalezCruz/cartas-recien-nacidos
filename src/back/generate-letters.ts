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
        console.log(
            `Se han generado sobres para ${newborns.length - skipped} registros.`
            + (skipped > 0 ? ` Para la carga seleccionada, ${skipped} registros no tienen datos de dirección, código postal, o municipio. No se ha generado sobre para ellos.` : "")
        );
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
        
        for(let i = 0; i < rows.length; i++) {
            rows[i].unshift(`${(i + 1)}.`);
        }

        document.font("Helvetica-Bold").fontSize(24)
            .text(`Listado Nacidos ${commonLoad ? "Carga " + commonLoad : "varias cargas"}`, {align: "center", underline: true});
        document.table({
            headers: [
                {label: "", width: 20, columnColor: "#BEBEBE", columnOpacity: 0.1, align: "right"},
                {label: "Nombre", width: 260}, {label: "Dirección", width: 260}, {label: "CP", width: 50}
            ],
            rows: rows
        });
        let skipped = newborns.length - rows.length;
        console.log(
            `Se ha generado un listado para ${rows.length} registros.`
            + (skipped > 0 ? ` Para la carga seleccionada, ${skipped} registros no tienen datos de dirección, código postal, o municipio. No se ha generado sobre para ellos.` : "")
        );
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
    let sharedLoad :string | null = null;

    for(let newborn of newborns) {
        if(sharedLoad == null) {
            sharedLoad = newborn.NombreCarga;
        } else if(sharedLoad != newborn.NombreCarga) {
            sharedLoad = null;
            break;
        }
    }

    return sharedLoad;
}


