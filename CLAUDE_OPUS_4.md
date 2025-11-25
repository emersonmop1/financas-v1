# Claude Opus 4 - Configuração e Uso

## Modelo Atual
**Claude Opus 4** (`claude-opus-4-20250514`)
- Mesmo modelo usado na interface web do Claude
- Máxima precisão para análise de documentos
- Conhecimento profundo de contexto brasileiro

## Características da Implementação

### 1. System Prompt Otimizado
O system prompt foi configurado para replicar a experiência da interface web:

```typescript
const systemPrompt = `Você é o Claude Opus 4.1, com todas as capacidades da interface web.

CAPACIDADES HABILITADAS:
- Processamento visual completo de PDFs com compreensão total de layout
- Conhecimento profundo do contexto e estabelecimentos brasileiros
- Análise de tabelas complexas e faturas de cartão de crédito
- Compreensão de abreviações bancárias e códigos brasileiros
...
`;
```

### 2. Configuração de Temperatura
- **Temperature: 0.3** - Mantém consistência entre análises
- **Top P: 0.9** - Otimizado para determinismo
- Configuração idêntica à interface web para resultados previsíveis

### 3. Custos
Claude Opus 4 tem preços diferentes dos modelos anteriores:
- **Input**: $15 por milhão de tokens
- **Output**: $75 por milhão de tokens

**Exemplo de custo:**
- Fatura de 2 páginas: ~5,000 tokens input + ~2,000 tokens output
- Custo: ~$0.075 + ~$0.15 = **~$0.225 por fatura**

### 4. Conhecimento Brasileiro Aprimorado
O system prompt inclui conhecimento específico sobre:
- Estabelecimentos brasileiros (restaurantes, marketplaces, etc.)
- Padrões de abreviação bancária ("PAG*", "ED COM", etc.)
- Categorização contextual precisa
- Identificação de créditos vs débitos

## Funções Auxiliares

### Verificar Modelos Disponíveis
Para descobrir quais modelos Claude 4 estão disponíveis na sua API:

```typescript
import { ClaudeService } from './services/claude.service';

const availableModels = await ClaudeService.checkAvailableModels();
console.log('Modelos disponíveis:', availableModels);
```

### Benchmark de Performance
Para comparar velocidade e custo entre modelos:

```typescript
const pdfBuffer = fs.readFileSync('fatura.pdf');
const results = await ClaudeService.benchmarkModels(pdfBuffer);

console.log('Resultados:', results);
// {
//   'claude-opus-4-20250514': {
//     available: true,
//     time: 3450,
//     inputTokens: 5234,
//     outputTokens: 1876,
//     cost: 0.2187
//   },
//   ...
// }
```

## Paridade com Interface Web

A implementação atual garante paridade com a interface web do Claude através de:

1. **Mesmo Modelo**: `claude-opus-4-20250514`
2. **System Prompt Detalhado**: Instruções específicas sobre contexto brasileiro
3. **Temperatura Consistente**: 0.3 para resultados determinísticos
4. **Formato de Entrada**: PDF via base64 com tipo `document`
5. **Conhecimento Contextual**: Estabelecimentos e padrões brasileiros

## Próximos Modelos a Testar

Quando disponíveis, considerar testar:
- `claude-opus-4-1-20250805` - Versão mais recente (verificar data)
- `claude-sonnet-4-20250514` - Versão mais econômica (se existir)
- `claude-haiku-4-20250514` - Para casos de alto volume (se existir)

## Monitoramento

Os logs incluem informações detalhadas:
```
🤖 Iniciando análise de fatura com Claude Opus 4.1 (mesmo da interface web)...
📥 Resposta recebida do Claude
✅ 47 transações extraídas de 2 cartão(ões)
💰 Total da fatura: R$ 38967.12
📊 Tokens usados: 5234 input, 1876 output
💵 Custo Claude Opus 4: $0.2187 (input: $0.0785, output: $0.1407)
```

## Fallback para Sonnet 4.5

Em caso de indisponibilidade do Opus 4, o sistema pode facilmente voltar para Sonnet 4.5:

```typescript
model: process.env.CLAUDE_MODEL || 'claude-opus-4-20250514',
```

E configurar no `.env`:
```
CLAUDE_MODEL=claude-sonnet-4-5-20250929  # Para usar Sonnet 4.5
```

## Otimizações Futuras

1. **Caching de System Prompt**: Claude suporta prompt caching para reduzir custos
2. **Streaming**: Para feedback em tempo real durante análise
3. **Batch Processing**: Para processar múltiplas faturas em paralelo
4. **Model Routing**: Usar Opus 4 para casos complexos, Sonnet para casos simples
