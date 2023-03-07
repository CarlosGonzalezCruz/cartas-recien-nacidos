import PDF from "pdfkit";
import { Newborn } from "./db-queries";


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
                // PDFKit documents have 1 page by default. If we were to add a new page for the first newborn, we'd be left with a blank leading page
                document.addPage();
            }
            generatePage(document, newborn);
            firstPage = false;
        }
        if(skipped > 0) {
            console.log(`Para la carga seleccionada, ${skipped} registros no tienen datos de dirección, código postal, o municipio. No se ha generado sobre para ellos.`);
        }
        document.end();
    });
}


function generatePage(document :PDFKit.PDFDocument, newborn :Newborn) {
    document.image("assets/ayto-logo.jpg", 2, 2, {width: 108, height: 108});
    document.image("assets/franqueo-pagado.jpg", 402, 2, {width: 154, height: 64});

    document.fontSize(9);
    document.text(`FAMILIARES DE ${newborn.Nacido_Nombre} ${newborn.Nacido_Apellido1} ${newborn.Nacido_Apellido2}`, 242, 145);
    document.text(newborn.ViviendaDireccion, 242, 163);
    document.text(`${newborn.ViviendaCodigoPostal} ${newborn.ViviendaNombreMunicipio}`, 242, 182);
}