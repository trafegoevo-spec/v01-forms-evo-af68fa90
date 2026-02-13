
# Plano: Otimizar Velocidade de Carregamento e Redirecionamento do Formulario

## Problemas Encontrados

### 1. Chamada Duplicada ao Backend (maior impacto)
A pagina `Index.tsx` chama `get-public-settings` para carregar configuracoes de capa. Quando o formulario aparece, `MultiStepFormDynamic.tsx` chama **a mesma API novamente** para carregar perguntas e configuracoes. Sao **2 chamadas identicas** ao backend, dobrando o tempo de carregamento.

### 2. Verificacao de Autenticacao Desnecessaria
O `useAuth` roda `getSession()` e `checkRole()` para todos os visitantes, incluindo usuarios anonimos do formulario publico. Isso adiciona ~200-500ms antes de qualquer coisa aparecer na tela.

### 3. Carregamento Sequencial (nao paralelo)
O fluxo atual e:
```text
useAuth (getSession + checkRole)
         |
         v (espera terminar)
Index.tsx chama get-public-settings
         |
         v (espera terminar)
Mostra "Carregando..."
         |
         v (usuario clica "Comecar")
MultiStepFormDynamic monta
         |
         v
Chama get-public-settings DE NOVO
         |
         v (espera terminar)
Mostra primeiro passo do formulario
```

### 4. Redirecionamento Lento Apos Submit
Apos envio, o sistema faz operacoes sequenciais antes de redirecionar:
- Chama edge function (enviar-conversao)
- Insere em form_analytics (espera resposta)
- Chama get-whatsapp-link (outra chamada ao backend)
- So entao redireciona

---

## Solucao

### Parte 1: Eliminar Chamada Duplicada
Carregar dados publicos UMA VEZ no `Index.tsx` e passar para o formulario via props.

**Index.tsx**: Ja faz a chamada a `get-public-settings` — basta passar `questions`, `settings` e `successPages` como props para `MultiStepFormDynamic`.

**MultiStepFormDynamic.tsx**: Aceitar props opcionais `initialQuestions`, `initialSettings`, `initialSuccessPages`. Se recebidos, pular a chamada `loadPublicData()`.

### Parte 2: Nao Bloquear Renderizacao com Auth
Para a rota publica (`/`), nao esperar `useAuth` terminar antes de mostrar o conteudo. O auth so e necessario para o botao Admin.

**Index.tsx**: Remover a dependencia de `loading` (auth) para mostrar o formulario. O estado de admin pode carregar em segundo plano.

### Parte 3: Tornar Analytics Nao-Bloqueante no Submit
A insercao em `form_analytics` e a chamada `getWhatsAppLink` nao devem bloquear o redirecionamento.

**MultiStepFormDynamic.tsx (onSubmit)**:
- Mover `form_analytics.insert` para um `.then()` sem `await` (fire-and-forget)
- Se o edge function ja retornar `whatsapp_link` (CRM), redirecionar IMEDIATAMENTE sem chamar `getWhatsAppLink`
- Se precisar chamar `getWhatsAppLink`, fazer isso em paralelo com analytics

### Parte 4: Adicionar Skeleton/Loading Rapido
Substituir "Carregando..." por um skeleton visual leve que aparece instantaneamente.

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/Index.tsx` | Carregar dados uma vez, passar via props, nao bloquear com auth |
| `src/components/MultiStepFormDynamic.tsx` | Aceitar props iniciais, otimizar onSubmit |

---

## Detalhes Tecnicos

### Index.tsx - Mudancas

1. Usar `usePublicSettings` (hook existente) ao inves de fetch manual duplicado
2. Passar dados carregados para `MultiStepFormDynamic` via props
3. Nao bloquear renderizacao enquanto auth carrega

```typescript
// Antes: 2 fetches separados
// Index.tsx -> get-public-settings (cover)
// MultiStepFormDynamic -> get-public-settings (questions)

// Depois: 1 fetch compartilhado
const { settings, questions, successPages, loading } = usePublicSettings(formName);

// Passa para o form
<MultiStepFormDynamic 
  initialSettings={settings}
  initialQuestions={questions}
  initialSuccessPages={successPages}
/>
```

### MultiStepFormDynamic.tsx - Mudancas

1. Adicionar props opcionais:
```typescript
interface MultiStepFormDynamicProps {
  initialSettings?: any;
  initialQuestions?: Question[];
  initialSuccessPages?: SuccessPage[];
}
```

2. Usar dados das props se disponiveeis, sem fazer nova chamada:
```typescript
useEffect(() => {
  if (initialQuestions && initialQuestions.length > 0) {
    setQuestions(initialQuestions);
    setSettings(initialSettings);
    setSuccessPages(initialSuccessPages || []);
    setLoading(false);
  } else {
    loadPublicData();
  }
}, []);
```

3. Otimizar onSubmit - fire-and-forget para analytics:
```typescript
// ANTES (bloqueante):
await supabase.from("form_analytics").insert({...});

// DEPOIS (nao bloqueante):
supabase.from("form_analytics").insert({...})
  .then(({ error }) => { if (error) console.error(error); });

// Redirecionar IMEDIATAMENTE apos receber whatsapp_link
```

---

## Resultado Esperado

| Metrica | Antes | Depois |
|---------|-------|--------|
| Chamadas ao backend no carregamento | 2 | 1 |
| Tempo ate formulario aparecer | ~2-4s | ~1-2s |
| Tempo entre submit e redirect | ~2-3s | ~0.5-1s |
| Bloqueio por auth (usuarios anonimos) | Sim | Nao |
