/**
 * Script do Google Sheets para receber dados do webhook
 * VERSÃO UNIFICADA - Suporta GET e POST, cria abas dinamicamente
 * 
 * INSTRUÇÕES DE USO:
 * 1. Abra sua planilha do Google Sheets
 * 2. Vá em Extensions → Apps Script
 * 3. Cole este código
 * 4. CONFIGURE O ID DA SUA PLANILHA na linha 23 (opcional - se não configurar, usa a planilha ativa)
 * 5. Clique em "Deploy" → "New deployment"
 * 6. Type: "Web app"
 * 7. Execute as: "Me"
 * 8. Who has access: "Anyone"
 * 9. Copie a URL gerada
 * 10. Adicione no Lovable Cloud: Secrets → WEBHOOK_URL = [URL do Google Script]
 */

// CONFIGURAÇÃO (OPCIONAL): Cole o ID da sua planilha aqui, ou deixe vazio para usar a planilha ativa
const PLANILHA_ID = "10TuRwzFGYyP67FwpbZ21bmxPqMmLqFFpsOLTRW22eX0"; // Seu ID atual

function doPost(e) {
  try {
    // Suporta JSON e FormData
    var data = e.postData.type === "application/json"
      ? JSON.parse(e.postData.contents)
      : Object.fromEntries(e.parameter ? Object.entries(e.parameter) : []);
    return handleRequest(data);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ 
        success: false, 
        error: "Erro no POST: " + error.message 
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var data = e.parameter;
    return handleRequest(data);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ 
        success: false, 
        error: "Erro no GET: " + error.message 
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleRequest(data) {
  // Abre a planilha (por ID ou usa a ativa)
  var ss = PLANILHA_ID 
    ? SpreadsheetApp.openById(PLANILHA_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  
  // Define a aba baseado no campo "origem" ou usa "Leads" como padrão
  var nomeAba = data.origem || "Leads";
  var sheet = ss.getSheetByName(nomeAba) || ss.insertSheet(nomeAba);
  
  // Adiciona timestamp se não vier nos dados
  if (!data.data_cadastro && !data.timestamp) {
    data.data_cadastro = new Date().toLocaleString('pt-BR');
  }
  
  // Pega os headers atuais (primeira linha)
  var headers = [];
  if (sheet.getLastRow() > 0) {
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }
  
  // Se não houver headers, cria com Data/Hora primeiro
  if (headers.length === 0 || headers[0] === '') {
    headers = ['Data/Hora'];
  }
  
  // Garante que Data/Hora está sempre na primeira coluna
  if (headers[0] !== 'Data/Hora') {
    headers.unshift('Data/Hora');
  }
  
  // Prepara array de dados
  var rowData = new Array(headers.length).fill('');
  rowData[0] = data.data_cadastro || data.timestamp || new Date().toLocaleString('pt-BR');
  
  var headersUpdated = false;
  
  // Itera sobre todos os campos recebidos
  for (var key in data) {
    if (data.hasOwnProperty(key) && key !== 'data_cadastro' && key !== 'timestamp' && key !== 'origem') {
      var headerIndex = headers.indexOf(key);
      
      // Se a coluna não existe, adiciona
      if (headerIndex === -1) {
        headers.push(key);
        headerIndex = headers.length - 1;
        headersUpdated = true;
      }
      
      // Garante que o array de dados tenha o tamanho correto
      while (rowData.length < headers.length) {
        rowData.push('');
      }
      
      rowData[headerIndex] = data[key] || '';
    }
  }
  
  // Atualiza os headers se necessário
  if (headersUpdated || sheet.getLastRow() === 0) {
    // Limpa a primeira linha e escreve os novos headers
    if (sheet.getLastRow() > 0) {
      sheet.getRange(1, 1, 1, sheet.getMaxColumns()).clear();
    }
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Formata cabeçalho
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#4285f4");
    headerRange.setFontColor("#ffffff");
  }
  
  // Adiciona nova linha com os dados
  sheet.appendRow(rowData);
  
  // Retorna sucesso
  return ContentService.createTextOutput(
    JSON.stringify({ 
      success: true, 
      message: "Lead registrado na aba: " + nomeAba,
      columns: headers.length
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * RECURSOS DESTA VERSÃO:
 * ✅ Suporta POST (JSON e FormData) e GET
 * ✅ Cria abas automaticamente baseado no campo "origem"
 * ✅ Adiciona timestamp automaticamente
 * ✅ Cria cabeçalhos formatados automaticamente
 * ✅ Adiciona COLUNAS AUTOMATICAMENTE quando novos campos aparecem no formulário
 * ✅ Usa planilha específica por ID ou planilha ativa
 * ✅ Retorna JSON com status de sucesso/erro
 */
