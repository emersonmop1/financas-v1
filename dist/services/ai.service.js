"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const openai_1 = __importDefault(require("openai"));
const database_1 = __importDefault(require("../config/database"));
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
class AIService {
    /**
     * Processa arquivo bruto diretamente e extrai transações
     * Não depende de colunas específicas - a IA identifica tudo
     */
    async processRawFileData(userId, rawData) {
        if (rawData.length === 0) {
            return [];
        }
        // Buscar categorias disponíveis
        const categories = await database_1.default.category.findMany({
            where: {
                OR: [{ userId }, { isDefault: true }],
            },
            select: {
                id: true,
                name: true,
                type: true,
                icon: true,
            },
        });
        const incomeCategories = categories.filter((c) => c.type === 'INCOME');
        const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');
        // Processar em lotes
        const batchSize = 20;
        const results = [];
        for (let i = 0; i < rawData.length; i += batchSize) {
            const batch = rawData.slice(i, i + batchSize);
            const batchResults = await this.processRawBatch(batch, incomeCategories, expenseCategories);
            results.push(...batchResults);
        }
        return results;
    }
    /**
     * Processa um lote de dados brutos
     */
    async processRawBatch(rawBatch, incomeCategories, expenseCategories) {
        const prompt = this.buildRawDataPrompt(rawBatch, incomeCategories, expenseCategories);
        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `Você é um especialista em análise de extratos bancários brasileiros.

Sua tarefa é:
1. Analisar dados de extratos em QUALQUER formato
2. Identificar e extrair: data, descrição e valor de cada transação
3. Determinar se é receita (INCOME) ou despesa (EXPENSE)
4. Categorizar cada transação nas categorias disponíveis

REGRAS IMPORTANTES:
- Ignore linhas vazias ou cabeçalhos
- Extraia apenas transações válidas
- Use o contexto brasileiro (estabelecimentos, padrões de extratos)
- Valores podem estar em qualquer formato (1.234,56 ou 1234.56)
- Datas podem estar em qualquer formato
- Se não conseguir extrair alguma transação, pule-a

Retorne APENAS JSON válido.`,
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.3,
                response_format: { type: 'json_object' },
            });
            const content = response.choices[0].message.content;
            if (!content) {
                throw new Error('Resposta vazia da API OpenAI');
            }
            const result = JSON.parse(content);
            return this.parseRawAIResponse(result);
        }
        catch (error) {
            console.error('Erro ao processar dados brutos com IA:', error);
            throw new Error(`Erro na IA: ${error.message}`);
        }
    }
    /**
     * Constrói prompt para processamento de dados brutos
     */
    buildRawDataPrompt(rawBatch, incomeCategories, expenseCategories) {
        const rawDataText = rawBatch
            .map((row, idx) => `Linha ${idx}: ${JSON.stringify(row)}`)
            .join('\n');
        const incomeCategoriesText = incomeCategories
            .map((c) => `${c.id}: ${c.icon} ${c.name}`)
            .join('\n');
        const expenseCategoriesText = expenseCategories
            .map((c) => `${c.id}: ${c.icon} ${c.name}`)
            .join('\n');
        return `Analise os dados abaixo e extraia as transações financeiras:

DADOS DO ARQUIVO:
${rawDataText}

CATEGORIAS DE RECEITA DISPONÍVEIS:
${incomeCategoriesText}

CATEGORIAS DE DESPESA DISPONÍVEIS:
${expenseCategoriesText}

Retorne um JSON com o seguinte formato:
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "descrição da transação",
      "amount": 123.45,
      "type": "INCOME" ou "EXPENSE",
      "suggestedCategoryId": "id-da-categoria",
      "suggestedCategoryName": "nome-da-categoria",
      "confidence": "high" | "medium" | "low"
    }
  ]
}

IMPORTANTE:
- Normalize datas para formato ISO (YYYY-MM-DD)
- Normalize valores para número decimal (use ponto como separador)
- Use valores absolutos (sem sinal negativo)
- Categorize baseado no contexto da descrição
- confidence "high" para certezas, "medium" para prováveis, "low" para incertos`;
    }
    /**
     * Parseia resposta da IA de dados brutos
     */
    parseRawAIResponse(aiResponse) {
        const transactions = aiResponse.transactions || [];
        return transactions.map((t) => ({
            date: t.date,
            description: t.description || 'Sem descrição',
            amount: parseFloat(t.amount) || 0,
            type: t.type || 'EXPENSE',
            suggestedCategoryId: t.suggestedCategoryId || '',
            suggestedCategoryName: t.suggestedCategoryName || 'Outros',
            confidence: t.confidence || 'low',
        }));
    }
    /**
     * Categoriza transações usando GPT-4 (método antigo mantido para compatibilidade)
     */
    async categorizeTransactions(userId, transactions) {
        // Buscar categorias disponíveis para o usuário
        const categories = await database_1.default.category.findMany({
            where: {
                OR: [{ userId }, { isDefault: true }],
            },
            select: {
                id: true,
                name: true,
                type: true,
                icon: true,
            },
        });
        // Separar categorias por tipo
        const incomeCategories = categories.filter((c) => c.type === 'INCOME');
        const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');
        const categorizedTransactions = [];
        // Processar em lotes para otimizar chamadas à API
        const batchSize = 10;
        for (let i = 0; i < transactions.length; i += batchSize) {
            const batch = transactions.slice(i, i + batchSize);
            const batchResults = await this.categorizeBatch(batch, incomeCategories, expenseCategories);
            categorizedTransactions.push(...batchResults);
        }
        return categorizedTransactions;
    }
    /**
     * Categoriza um lote de transações
     */
    async categorizeBatch(transactions, incomeCategories, expenseCategories) {
        const prompt = this.buildPrompt(transactions, incomeCategories, expenseCategories);
        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `Você é um especialista em finanças pessoais. Sua tarefa é categorizar transações financeiras brasileiras com base na descrição.

Analise cada descrição e atribua a categoria mais apropriada. Considere:
- Contexto brasileiro (estabelecimentos, serviços, termos comuns)
- Tipo de transação (receita ou despesa)
- Padrões de descrição de extratos bancários

Responda APENAS com um JSON válido, sem explicações adicionais.`,
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.3,
                response_format: { type: 'json_object' },
            });
            const content = response.choices[0].message.content;
            if (!content) {
                throw new Error('Resposta vazia da API OpenAI');
            }
            const result = JSON.parse(content);
            return this.parseAIResponse(transactions, result);
        }
        catch (error) {
            console.error('Erro ao chamar OpenAI:', error);
            // Fallback: retornar com categorias padrão
            return this.getFallbackCategories(transactions, expenseCategories);
        }
    }
    /**
     * Constrói o prompt para o GPT
     */
    buildPrompt(transactions, incomeCategories, expenseCategories) {
        const transactionsText = transactions
            .map((t, idx) => `${idx}: ${t.description} (${t.type || 'EXPENSE'}) - R$ ${t.amount}`)
            .join('\n');
        const incomeCategoriesText = incomeCategories
            .map((c) => `${c.id}: ${c.icon} ${c.name}`)
            .join('\n');
        const expenseCategoriesText = expenseCategories
            .map((c) => `${c.id}: ${c.icon} ${c.name}`)
            .join('\n');
        return `Categorize as seguintes transações:

TRANSAÇÕES:
${transactionsText}

CATEGORIAS DE RECEITA DISPONÍVEIS:
${incomeCategoriesText}

CATEGORIAS DE DESPESA DISPONÍVEIS:
${expenseCategoriesText}

Retorne um JSON com o seguinte formato:
{
  "categorizations": [
    {
      "index": 0,
      "categoryId": "id-da-categoria",
      "categoryName": "nome-da-categoria",
      "confidence": "high" | "medium" | "low"
    }
  ]
}

Regras:
- Use categoryId das categorias disponíveis
- confidence "high" para correspondências óbvias, "medium" para prováveis, "low" para incertas
- Considere o tipo da transação (INCOME/EXPENSE) ao escolher a categoria
- Para transações em estabelecimentos específicos (ex: "PAG*NETFLIX"), use contexto
- Para descrições genéricas, use "low" confidence`;
    }
    /**
     * Parseia a resposta da IA e mescla com transações originais
     */
    parseAIResponse(transactions, aiResponse) {
        const categorizations = aiResponse.categorizations || [];
        return transactions.map((transaction, index) => {
            const categorization = categorizations.find((c) => c.index === index);
            return {
                ...transaction,
                suggestedCategoryId: categorization?.categoryId || '',
                suggestedCategoryName: categorization?.categoryName || 'Outros',
                confidence: categorization?.confidence || 'low',
            };
        });
    }
    /**
     * Categorização fallback em caso de erro
     */
    getFallbackCategories(transactions, expenseCategories) {
        const defaultCategory = expenseCategories.find((c) => c.name === 'Outros') || expenseCategories[0];
        return transactions.map((transaction) => ({
            ...transaction,
            suggestedCategoryId: defaultCategory.id,
            suggestedCategoryName: defaultCategory.name,
            confidence: 'low',
        }));
    }
    /**
     * Valida se a API Key está configurada
     */
    static isConfigured() {
        return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here';
    }
}
exports.AIService = AIService;
//# sourceMappingURL=ai.service.js.map