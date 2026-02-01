

# Plano: Corrigir Redirecionamento WhatsApp com Integracao CRM

## Problema Identificado

Quando a integracao CRM (modo exclusivo) esta ativa, o redirecionamento automatico para WhatsApp nao funciona, mesmo que o CRM externo retorne um `whatsapp_link` na resposta.

### Causa Raiz

O frontend verifica a condicao `responseData?.ok && responseData?.whatsapp_link`, mas:

1. O edge function retorna `ok: crmResponseData.ok ?? true`, dependendo da resposta do CRM externo
2. Se o CRM retornar apenas `whatsapp_link` sem um campo `ok`, a condicao `responseData?.ok` pode ser `undefined`
3. Alem disso, a verificacao deveria usar `success` (que sempre e retornado) ao inves de `ok`

### Fluxo Atual (com problema)

```text
Frontend -> Edge Function -> CRM Externo
                               |
                               v
                    { ok: true, whatsapp_link: "..." }
                               |
                               v
Edge Function retorna: { success: true, ok: true, whatsapp_link: "..." }
                               |
                               v
Frontend verifica: responseData?.ok && responseData?.whatsapp_link
                               |
                               v
        Se CRM nao retornar "ok", condicao falha!
```

---

## Solucao Proposta

### Parte 1: Corrigir Condicao no Frontend

Modificar `src/components/MultiStepFormDynamic.tsx` (linhas 582-587) para usar uma condicao mais robusta:

**De:**
```javascript
if (responseData?.ok && responseData?.whatsapp_link) {
  console.log("🔗 Abrindo WhatsApp do CRM:", responseData.whatsapp_link);
  window.open(responseData.whatsapp_link, "_blank");
  return;
}
```

**Para:**
```javascript
// Verifica se CRM retornou whatsapp_link (independente de ok/success)
if (responseData?.whatsapp_link) {
  console.log("🔗 Abrindo WhatsApp do CRM:", responseData.whatsapp_link);
  window.open(responseData.whatsapp_link, "_blank");
  return;
}
```

### Parte 2: Melhorar Logging para Debug

Adicionar logs mais detalhados para facilitar debug futuro:

```javascript
console.log("📥 Resposta do edge function:", responseData);
```

### Parte 3: Garantir Compatibilidade no Edge Function

Verificar se o edge function esta parseando corretamente a resposta do CRM e extraindo o `whatsapp_link`:

**Codigo atual (linha 121-125):**
```javascript
return jsonResponse({
  success: true,
  ok: crmResponseData.ok ?? true,
  whatsapp_link: crmResponseData.whatsapp_link || null,
  ...
});
```

Este codigo esta correto, mas podemos adicionar logs para confirmar que o `whatsapp_link` esta sendo extraido:

```javascript
console.log("🔗 WhatsApp link do CRM:", crmResponseData.whatsapp_link);
```

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/MultiStepFormDynamic.tsx` | Corrigir condicao de verificacao do whatsapp_link, adicionar logs de debug |
| `supabase/functions/enviar-conversao/index.ts` | Adicionar log para confirmar extracao do whatsapp_link |
| `supabase/functions/enviar-conversao-educa/index.ts` | Mesma alteracao |
| `supabase/functions/enviar-conversao-autoprotecta/index.ts` | Mesma alteracao |

---

## Codigo Corrigido

### MultiStepFormDynamic.tsx (linhas ~582-605)

```typescript
// Adicionar log da resposta
console.log("📥 Resposta do edge function:", responseData);

// === MODO EXCLUSIVO CRM: Se CRM retornou whatsapp_link, usar diretamente ===
// Verifica apenas se whatsapp_link existe (nao depende de ok/success)
if (responseData?.whatsapp_link) {
  console.log("🔗 Abrindo WhatsApp do CRM:", responseData.whatsapp_link);
  window.open(responseData.whatsapp_link, "_blank");
  return; // Nao faz mais nada, CRM gerenciou tudo
}

// Se whatsapp_on_submit esta habilitado, abrir WhatsApp automaticamente
if (settings?.whatsapp_on_submit && settings?.whatsapp_enabled) {
  // Resto do codigo permanece igual...
}
```

### Edge Functions (enviar-conversao, educa, autoprotecta)

Adicionar log antes de retornar:

```typescript
console.log("🔗 WhatsApp link do CRM:", crmResponseData.whatsapp_link || "nao retornado");

return jsonResponse({
  success: true,
  ok: crmResponseData.ok ?? true,
  whatsapp_link: crmResponseData.whatsapp_link || null,
  crm_status: "sent",
  crm_response: crmResponseData,
});
```

---

## Resultado Esperado

1. **Redirecionamento funcional**: Quando o CRM externo retornar `whatsapp_link`, o usuario sera redirecionado automaticamente
2. **Logs para debug**: Logs claros para identificar problemas futuros
3. **Compatibilidade**: Funciona independente de como o CRM externo estrutura sua resposta (com ou sem campo `ok`)

---

## Teste Recomendado

Apos implementacao, testar o fluxo completo:

1. Preencher formulario com CRM exclusivo ativo (ex: subdomain `acessotec`)
2. Verificar logs do console do navegador
3. Verificar logs do edge function
4. Confirmar que WhatsApp abre automaticamente com o link retornado pelo CRM

