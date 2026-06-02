const TU_EMAIL = 'barfirenzinaweb@gmail.com';

function setupSheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var headers = ['Fecha','Email','WhatsApp','Direccion','CP','Productos','Cantidad','Total','Metodo','Estado'];
  sheet.getRange(1,1,1,10).setValues([headers])
    .setFontWeight('bold')
    .setBackground('#323915')
    .setFontColor('#F6F6E9')
    .setHorizontalAlignment('center');

  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Pendiente','En preparacion','Listo','Cancelado'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('J2:J1000').setDataValidation(rule);

  var range = sheet.getRange('A2:J1000');
  var r1 = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$J2="Pendiente"')
    .setBackground('#FFF2CC')
    .setRanges([range])
    .build();
  var r2 = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$J2="En preparacion"')
    .setBackground('#CFE2F3')
    .setRanges([range])
    .build();
  var r3 = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$J2="Listo"')
    .setBackground('#D9EAD3')
    .setRanges([range])
    .build();
  var r4 = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$J2="Cancelado"')
    .setBackground('#EFEFEF')
    .setFontColor('#999999')
    .setRanges([range])
    .build();
  sheet.setConditionalFormatRules([r1, r2, r3, r4]);

  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 130);
  sheet.setColumnWidth(2, 200);
  sheet.setColumnWidth(3, 150);
  sheet.setColumnWidth(4, 250);
  sheet.setColumnWidth(5, 90);
  sheet.setColumnWidth(6, 300);
  sheet.setColumnWidth(7, 80);
  sheet.setColumnWidth(8, 110);
  sheet.setColumnWidth(9, 180);
  sheet.setColumnWidth(10, 150);
  sheet.getRange('G2:H1000').setHorizontalAlignment('right');
  sheet.getRange('J2:J1000').setHorizontalAlignment('center');
}

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    var fecha = Utilities.formatDate(new Date(), 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy HH:mm');
    var productos = data.items.map(function(i){ return i.name + ' x ' + i.qty; }).join(' | ');
    var cantTotal = data.items.reduce(function(s, i){ return s + i.qty; }, 0);
    var totalFmt = '$' + Math.round(data.total).toLocaleString('es-AR');

    sheet.appendRow([
      fecha,
      data.email || '',
      data.phone || '',
      data.address || '',
      data.cp || '',
      productos,
      cantTotal,
      data.total,
      data.metodo || '',
      'Pendiente'
    ]);

    if (data.email) {
      var mensajeCliente = 'Hola!\n\n' +
        'Recibimos tu pedido de BARFirenzina.\n\n' +
        'Productos: ' + productos + '\n' +
        'Total: ' + totalFmt + '\n' +
        'Metodo: ' + (data.metodo || 'A definir') + '\n' +
        'Direccion de entrega: ' + (data.address || '') + ' (CP ' + (data.cp || '') + ')\n\n' +
        'Te contactamos en las proximas horas por WhatsApp para coordinar la entrega refrigerada.\n\n' +
        'Gracias por confiar en nosotros!\n' +
        'BARFirenzina - Alimentacion natural premium para gatos';
      MailApp.sendEmail(data.email, 'Recibimos tu pedido - BARFirenzina', mensajeCliente);
    }

    var mensajeInterno = 'Pedido nuevo recibido:\n\n' +
      'Fecha: ' + fecha + '\n' +
      'Email cliente: ' + (data.email || '(no dejo)') + '\n' +
      'WhatsApp cliente: ' + (data.phone || '(no dejo)') + '\n' +
      'Direccion: ' + (data.address || '') + '\n' +
      'CP: ' + (data.cp || '') + '\n' +
      'Productos: ' + productos + '\n' +
      'Cantidad total: ' + cantTotal + '\n' +
      'Total: ' + totalFmt + '\n' +
      'Metodo: ' + (data.metodo || 'A definir');
    MailApp.sendEmail(TU_EMAIL, 'Pedido nuevo - ' + totalFmt, mensajeInterno);

    return ContentService.createTextOutput(JSON.stringify({ok: true}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ok: false, error: String(err)}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
