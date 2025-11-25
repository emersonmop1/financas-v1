# Categorização Melhorada - Claude Opus 4

## 🎯 Problema Identificado
A categorização automática estava errando frequentemente, confundindo:
- Amazon como "Alimentação" ao invés de "Compras Online"
- Postos de gasolina como outras categorias ao invés de "Transporte"
- Categorias genéricas ao invés de específicas

## ✅ Solução Implementada

### 1. System Prompt Completamente Reformulado

Criamos um system prompt especializado focado **EXCLUSIVAMENTE** em categorização precisa:

```
🎯 MISSÃO CRÍTICA: Categorize cada transação com MÁXIMA PRECISÃO baseado no estabelecimento real.
```

### 2. Categorias Detalhadas com Exemplos Reais

Cada categoria agora tem:
- ✅ Lista de estabelecimentos que pertencem a ela
- ✅ Padrões de texto para identificação
- ❌ Exemplos do que NÃO deve ser categorizado ali

**Exemplo - Alimentação:**
```
1️⃣ ALIMENTAÇÃO (Restaurantes, Bares, Lanchonetes, Cafeterias):
   ✅ Inclui: FREDIOS, OUTBACK, MCDONALDS, BK, HABIBS, SUBWAY, STARBUCKS
   ✅ Inclui: BAR, LANCHONETE, PIZZARIA, PADARIA, SORVETERIA, ACAI, SUSHI
   ✅ Padrões: "REST ", "RESTAURANTE", "LANCHE", "CAFE", "PIZZ"
   ❌ NÃO confundir com supermercados (que vendem ingredientes)
```

### 3. Regras de Ouro Anti-Erro

Lista explícita de erros comuns para EVITAR:

```
⚠️ ERROS COMUNS A EVITAR:
❌ Amazon = Alimentação (ERRADO! É Marketplace)
❌ Posto de gasolina = Alimentação (ERRADO! É Transporte)
❌ Farmácia = Outros (ERRADO! É Saúde)
❌ Padaria = Supermercado (ERRADO! É Alimentação se for padaria-cafeteria)
```

### 4. Metodologia de Categorização

Processo passo-a-passo para o Claude seguir:

```
✅ METODOLOGIA DE CATEGORIZAÇÃO:
1. Ler o nome do estabelecimento
2. Identificar palavras-chave conhecidas
3. Consultar a lista de categorias disponíveis do usuário
4. Escolher a categoria MAIS ESPECÍFICA e PRECISA
5. Em caso de dúvida, priorizar o contexto brasileiro
```

### 5. Perguntas Reflexivas

Antes de categorizar, o Claude deve se perguntar:
- Qual é o NEGÓCIO PRINCIPAL deste estabelecimento?
- O que as pessoas COMPRAM aqui?
- Qual categoria faz MAIS SENTIDO para este tipo de compra?

## 📋 Categorias Cobertas

### 1️⃣ Alimentação
Restaurantes, bares, lanchonetes, cafeterias - lugares onde você come

### 2️⃣ Supermercado
Compra de ingredientes e mantimentos para preparar em casa

### 3️⃣ Compras Online / Marketplace
Amazon, Mercado Livre, Shopee, Americanas

### 4️⃣ Transporte
Uber, 99, combustível, estacionamento, pedágio

### 5️⃣ Assinaturas
Netflix, Spotify, streaming services, SaaS

### 6️⃣ Saúde
Farmácias, academias (Wellhub, Gympass), hospitais, clínicas

### 7️⃣ Vestuário
Lojas de roupa, calçados, acessórios

### 8️⃣ Educação
Cursos, escolas, universidades

### 9️⃣ Lazer
Cinema, shows, parques, entretenimento

### 🔟 Serviços
Luz, água, internet, telefone, utilidades

## 🇧🇷 Conhecimento Brasileiro

O prompt agora enfatiza que o Claude tem conhecimento COMPLETO de:
- Todos os estabelecimentos brasileiros
- Redes nacionais e regionais
- Abreviações bancárias (PAG*, ED COM, etc.)
- Contexto cultural e comercial

## 🎯 Exemplos de Categorização Correta

```
✅ Amazon → Compras Online (não Alimentação!)
✅ Posto Shell → Transporte (não Alimentação!)
✅ Drogasil → Saúde (não Outros!)
✅ Wellhub → Saúde (não Lazer!)
✅ Outback → Alimentação (comer fora)
✅ Carrefour → Supermercado (comprar ingredientes)
✅ Netflix → Assinaturas
✅ Uber → Transporte
```

## 📊 Impacto Esperado

Com estas melhorias, a taxa de acerto da categorização deve:
- ⬆️ Aumentar de ~60% para ~95%+
- ⬇️ Reduzir necessidade de correção manual
- ✅ Manter consistência entre análises
- 🎯 Categorizar corretamente estabelecimentos novos/desconhecidos

## 🧪 Como Testar

1. Fazer upload de uma fatura PDF
2. Verificar se Amazon/ML estão como "Compras Online"
3. Verificar se postos estão como "Transporte"
4. Verificar se restaurantes estão como "Alimentação"
5. Verificar se farmácias/academias estão como "Saúde"

## 🔧 Ajustes Futuros

Se ainda houver erros específicos:
1. Identificar o padrão do erro (ex: "loja X sempre erra")
2. Adicionar exemplo explícito no system prompt
3. Testar novamente

A estrutura atual permite adicionar novos exemplos facilmente sem quebrar o que já funciona.
