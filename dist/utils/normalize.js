"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeDescription = normalizeDescription;
/**
 * Normaliza uma string para facilitar comparações
 * Remove acentos, converte para lowercase e remove espaços extras
 */
function normalizeDescription(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/\s+/g, ' ') // Normaliza espaços
        .trim();
}
//# sourceMappingURL=normalize.js.map