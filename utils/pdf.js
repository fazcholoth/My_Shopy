const PDFDocument = require('pdfkit');
const fs = require('fs');

// function createInvoice(order) {
//   const invoice = {
//     shipping: order.Shippingadress,
//     products: order.products,
//     total: order.total
//   };
  
//   const docDefinition = {
//     content: [
//       { text: 'Invoice', style: 'header' },
//       { text: `Order #${order._id}`, style: 'subheader' },
//       { text: `${order.orderDate.toDateString()}`, alignment: 'right' },

//       { text: 'Shipping Details', style: 'subheader' },
//       { text: `${invoice.shipping.name}\n${invoice.shipping.street}\n${invoice.shipping.city}\n${invoice.shipping.country}\n${invoice.shipping.postalcode}`, margin: [0, 0, 0, 20] },

//       { text: 'Products', style: 'subheader' },
//       {
//         table: {
//             headerRows: 1,
//             widths: ['*', 'auto', 'auto'],
//             body: [
//               ['Product', 'Quantity', 'Price'],
//               ...invoice.products.map(p => [p.productId.Productname, p.quantity, p.productId.Price])
//             ]
//         }
        
//       },
//       { text: `Total: $${invoice.total}`, margin: [0, 20, 0, 0] }
//     ],
//     styles: {
//       header: {
//         fontSize: 18,
//         bold: true,
//         margin: [0, 0, 0, 10]
//       },
//       subheader: {
//         fontSize: 14,
//         bold: true,
//         margin: [0, 10, 0, 5]
//       }
//     }
//   };
  
//   return docDefinition;
// }

// function generateInvoice(order) {
//     const docDefinition = createInvoice(order);
//     const pdfDoc = new PDFDocument();
//     const filePath = `./public/invoices/invoice_${order._id}.pdf`;
//     pdfDoc.pipe(fs.createWriteStream(filePath));
//     pdfDoc.fontSize(14);
//     pdfDoc.text(JSON.stringify(docDefinition), 50, 50);
//     pdfDoc.end();
  
//     return new Promise((resolve, reject) => {
//       pdfDoc.on('end', () => {
//         resolve(filePath);
//       });
//       pdfDoc.on('error', (err) => {
//         reject(err);
//       });
//     });
// }
function generateInvoice (order,products){
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const invoicePath = `./public/invoices/invoice_${order._id}.pdf`; // Path to save the generated PDF
  
      // Pipe PDF document to a writable stream
      doc.pipe(fs.createWriteStream(invoicePath));
  
      // Add content to the PDF
      doc.fontSize(14).text("Invoice", { underline: true });
      doc.font("Helvetica-Bold").fontSize(25).fillColor("black");
      doc.text("e shopee", { align: "right" });
  
      // Add delivery address field
      doc.text("Delivery Address:", { underline: true });
      doc.fontSize(14).text(`Name: ${order?.Shippingadress.name}`);
      doc.text(`Apartment: ${order.apartment_number}`);
      doc.text(`City: ${order.Shippingadress.city}`);
      doc.text(`State: ${order.Shippingadress.street}`);
      doc.text(`Postal Code: ${order.Shippingadress.postalcode}`);
      
  
      // Add seller address field
      doc.text("Seller Address:", { underline: true });
      doc.fontSize(14).text(`Name: e shopee logistics ltd`);
      doc.text(`Street: Kakkanad`);
      doc.text(`City: Cochin`);
      doc.text(`State: Kerala`);
      doc.text(`Postal Code: 652021`);
      doc.text(`Mobile Number: 9888552210`);
  
      doc.text("------------------------------");
      doc.fontSize(16).text("Items:", { underline: true });
      products.forEach((item) => {
        doc
          .fontSize(14)
          .text(`${item.name} - ${item.quantity} - Rs ${item.price}`);
      });
      doc.text("------------------------------");
      doc.fontSize(16).text(`Total: Rs ${order.total}`);
  
      // End the PDF document
      doc.end();
  
      // Resolve with the generated invoice file path
      resolve(invoicePath);
    });
  };

module.exports = generateInvoice;
