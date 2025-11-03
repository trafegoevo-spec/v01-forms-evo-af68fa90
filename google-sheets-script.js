/**
 * Script do Google Sheets para receber dados do webhook
 * 
 * INSTRUÇÕES DE USO:
 * 1. Abra sua planilha do Google Sheets
 * 2. Vá em Extensions → Apps Script
 * 3. Cole este código
 * 4. Clique em "Deploy" → "New deployment"
 * 5. Type: "Web app"
 * 6. Execute as: "Me"
 * 7. Who has access: "Anyone"
 * 8. Copie a URL gerada
 * 9. Adicione no Lovable Cloud: Secrets → WEBHOOK_URL = [URL do Google Script]
 */

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Parse dos dados recebidos
    const data = JSON.parse(e.postData.contents);
    
    // Adiciona uma nova linha com os dados
    sheet.appendRow([
      new Date(),           // Data/hora do cadastro
      data.nome,            // Nome
      data.email,           // Email
      data.telefone,        // Telefone
      data.curso,           // Curso
      data.cidade || '',    // Cidade (opcional)
      data.origem           // Origem (Site EAD)
    ]);
    
    // Retorna sucesso
    return ContentService.createTextOutput(
      JSON.stringify({ success: true })
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Log do erro
    console.error('Erro ao processar webhook:', error);
    
    // Retorna erro
    return ContentService.createTextOutput(
      JSON.stringify({ 
        success: false, 
        error: error.toString() 
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * CABEÇALHOS RECOMENDADOS PARA SUA PLANILHA:
 * 
 * Coluna A: Data/Hora
 * Coluna B: Nome
 * Coluna C: Email
 * Coluna D: Telefone
 * Coluna E: Curso
 * Coluna F: Cidade
 * Coluna G: Origem
 */
