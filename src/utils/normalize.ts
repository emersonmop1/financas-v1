/**
 * Normaliza uma string para facilitar comparações
 * Remove acentos, converte para lowercase e remove espaços extras
 */
export function normalizeDescription(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, ' ') // Normaliza espaços
    .trim();
}
