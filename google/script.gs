 // ============================================
  // CASAMENTO BRUFU - Google Apps Script
  // ============================================

  // ID da pasta no Drive para salvar comprovantes
  // Crie uma pasta no Drive e cole o ID aqui (da URL: /folders/XXXXX)
  // NOTA: Este ID não é sensível - acesso requer permissão no Drive
  const RECEIPTS_FOLDER_ID = '1FeH4dpsz_ohe27Gse6RfQkhMI1TCyqZu';

  // Handle GET requests (login, fetch data)
  function doGet(e) {
    try {
      const action = e.parameter.action;

      switch(action) {
        case 'login':
          return handleLogin(e.parameter.code);
        case 'getGuest':
          return getGuestInfo(e.parameter.code);
        case 'getRSVP':
          return getRSVPStatus(e.parameter.code);
        case 'getAuction':
          return getAuctionStatus();
        default:
          return jsonResponse({ error: 'Invalid action' }, 400);
      }
    } catch (error) {
      return jsonResponse({ error: error.message }, 500);
    }
  }

  // Handle POST requests (submit forms)
  function doPost(e) {
    try {
      const data = JSON.parse(e.postData.contents);
      const action = data.action;

      switch(action) {
        case 'submitRSVP':
          return submitRSVP(data);
        case 'submitMusic':
          return submitMusic(data);
        case 'submitGift':
          return submitGift(data);
        case 'submitBid':
          return submitBid(data);
        default:
          return jsonResponse({ error: 'Invalid action' }, 400);
      }
    } catch (error) {
      return jsonResponse({ error: error.message }, 500);
    }
  }

  // ============================================
  // LOGIN
  // ============================================

  function handleLogin(code) {
    if (!code) {
      return jsonResponse({ success: false, error: 'Code required' });
    }

    const sheet = getSheet('Guests');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // Find guest by code (case insensitive)
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString().toLowerCase() === code.toLowerCase()) {
        return jsonResponse({
          success: true,
          guest: {
            code: data[i][0],
            name: data[i][1],
            isPlusOne: data[i][2] === true || data[i][2] === 'TRUE'
          }
        });
      }
    }

    return jsonResponse({ success: false, error: 'Invalid code' });
  }

  // ============================================
  // GET GUEST INFO
  // ============================================

  function getGuestInfo(code) {
    if (!code) {
      return jsonResponse({ success: false, error: 'Code required' });
    }

    const sheet = getSheet('Guests');
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString().toLowerCase() === code.toLowerCase()) {
        return jsonResponse({
          success: true,
          guest: {
            code: data[i][0],
            name: data[i][1],
            isPlusOne: data[i][2] === true || data[i][2] === 'TRUE'
          }
        });
      }
    }

    return jsonResponse({ success: false, error: 'Guest not found' });
  }

  // ============================================
  // RSVP
  // ============================================

  function getRSVPStatus(code) {
    if (!code) {
      return jsonResponse({ error: 'Code required' });
    }

    const sheet = getSheet('RSVP');
    const data = sheet.getDataRange().getValues();
    const responses = [];
    const codeLower = code.toString().toLowerCase();

    // Find all responses confirmed by this code (case insensitive)
    for (let i = 1; i < data.length; i++) {
      if (data[i][4] && data[i][4].toString().toLowerCase() === codeLower) { // ConfirmedBy column
        responses.push({
          guestCode: data[i][0],
          guestName: data[i][1],
          attending: data[i][2],
          dietary: data[i][3],
          firstConfirmed: data[i][5],
          lastUpdated: data[i][6]
        });
      }
    }

    return jsonResponse({ success: true, responses: responses });
  }

  function submitRSVP(data) {
    const sheet = getSheet('RSVP');
    const guestsSheet = getSheet('Guests');
    const confirmedBy = data.confirmedBy;
    const guests = data.guests; // Array of { code, name, attending, dietary }

    const now = new Date();
    const results = [];

    for (const guest of guests) {
      // Validate guest code exists
      if (!isValidCode(guestsSheet, guest.code)) {
        results.push({ code: guest.code, success: false, error: 'Invalid code' });
        continue;
      }

      // Check if already exists
      const existingRow = findRowByColumn(sheet, 0, guest.code);

      if (existingRow) {
        // Update existing
        sheet.getRange(existingRow, 2).setValue(guest.name);
        sheet.getRange(existingRow, 3).setValue(guest.attending);
        sheet.getRange(existingRow, 4).setValue(guest.dietary);
        sheet.getRange(existingRow, 5).setValue(confirmedBy);
        sheet.getRange(existingRow, 7).setValue(now);
        results.push({ code: guest.code, success: true, action: 'updated' });
      } else {
        // Insert new
        sheet.appendRow([
          guest.code,
          guest.name,
          guest.attending,
          guest.dietary,
          confirmedBy,
          now,
          now
        ]);
        results.push({ code: guest.code, success: true, action: 'created' });
      }
    }

    return jsonResponse({ success: true, results: results });
  }

  // ============================================
  // MUSIC SUGGESTIONS
  // ============================================

  function submitMusic(data) {
    const sheet = getSheet('Musicas');
    const guestsSheet = getSheet('Guests');

    // Validate guest code
    if (!isValidCode(guestsSheet, data.guestCode)) {
      return jsonResponse({ success: false, error: 'Invalid code' });
    }

    const now = new Date();

    sheet.appendRow([
      data.guestCode,
      data.guestName,
      data.song,
      data.artist,
      data.why || '',
      now
    ]);

    return jsonResponse({ success: true });
  }

  // ============================================
  // GIFT CONFIRMATION
  // ============================================

  function submitGift(data) {
    const sheet = getSheet('Presentes');
    const guestsSheet = getSheet('Guests');

    // Validate guest code
    if (!isValidCode(guestsSheet, data.guestCode)) {
      return jsonResponse({ success: false, error: 'Invalid code' });
    }

    const now = new Date();
    let receiptUrl = '';

    // Upload receipt if provided
    if (data.receiptBase64 && data.receiptName) {
      try {
        receiptUrl = uploadReceiptToDrive(data.receiptBase64, data.receiptName, data.receiptType);
      } catch (e) {
        return jsonResponse({ success: false, error: 'Erro ao salvar comprovante: ' + e.message });
      }
    }

    // Columns: GuestCode | GuestName | Gift | Value | Message | Receipt | Date
    sheet.appendRow([
      data.guestCode,
      data.guestName,
      data.giftName || '',
      data.giftValue || '',
      data.message || '',
      receiptUrl,
      now
    ]);

    return jsonResponse({ success: true, receiptUrl: receiptUrl });
  }

  // Upload comprovante para o Google Drive
  function uploadReceiptToDrive(base64Data, fileName, mimeType) {
    const folder = DriveApp.getFolderById(RECEIPTS_FOLDER_ID);
    const decodedData = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(decodedData, mimeType || 'application/octet-stream', fileName);
    const file = folder.createFile(blob);
    return file.getUrl();
  }

  // ============================================
  // AUCTION
  // ============================================

  function getAuctionStatus() {
    const sheet = getSheet('Leilao');
    const data = sheet.getDataRange().getValues();

    // Group by item and find highest bid
    const highestBids = {};

    for (let i = 1; i < data.length; i++) {
      const item = data[i][2];
      const amount = parseFloat(data[i][3]) || 0;
      const bidder = data[i][1];

      if (!highestBids[item] || amount > highestBids[item].amount) {
        highestBids[item] = {
          item: item,
          bidder: bidder,
          amount: amount
        };
      }
    }

    return jsonResponse({
      success: true,
      auctions: Object.values(highestBids)
    });
  }

  function submitBid(data) {
    const sheet = getSheet('Leilao');
    const guestsSheet = getSheet('Guests');

    // Validate guest code
    if (!isValidCode(guestsSheet, data.guestCode)) {
      return jsonResponse({ success: false, error: 'Invalid code' });
    }

    const now = new Date();

    sheet.appendRow([
      data.guestCode,
      data.guestName,
      data.item,
      data.amount,
      now
    ]);

    return jsonResponse({ success: true });
  }

  // ============================================
  // TEST FUNCTIONS
  // ============================================

  // Rode esta função manualmente para verificar permissões
  function testDrivePermission() {
    try {
      const folder = DriveApp.getFolderById(RECEIPTS_FOLDER_ID);
      Logger.log('Drive OK - Pasta: ' + folder.getName());
      return 'OK: ' + folder.getName();
    } catch (e) {
      Logger.log('Drive ERRO: ' + e.message);
      return 'ERRO: ' + e.message;
    }
  }

  function testSheetPermission() {
    try {
      const sheet = getSheet('Presentes');
      Logger.log('Sheet OK: ' + sheet.getName());
      return 'OK';
    } catch (e) {
      Logger.log('Sheet ERRO: ' + e.message);
      return 'ERRO: ' + e.message;
    }
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  function getSheet(name) {
    return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  }

  function isValidCode(guestsSheet, code) {
    const data = guestsSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString().toLowerCase() === code.toString().toLowerCase()) {
        return true;
      }
    }
    return false;
  }

  function findRowByColumn(sheet, colIndex, value) {
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][colIndex].toString().toLowerCase() === value.toString().toLowerCase()) {
        return i + 1; // Sheets are 1-indexed
      }
    }
    return null;
  }

  function jsonResponse(data, status = 200) {
    return ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }
