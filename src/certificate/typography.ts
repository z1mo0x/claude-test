/**
 * Satori не подставляет кириллическое подмножество, если оно зарегистрировано
 * под тем же именем, что и латинское. Поэтому кириллица живёт в отдельном
 * семействе с суффиксом «Cyrillic» (см. fonts.ts) и стоит в стеке вторым.
 * Браузер этого имени не знает и просто берёт первое: там @fontsource сам
 * разбирает подмножества по unicode-range.
 */
export const typeface = {
  serif: "'Cormorant Garamond', 'Cormorant Garamond Cyrillic'",
  mono: "'JetBrains Mono', 'JetBrains Mono Cyrillic'",
  sans: "'Manrope', 'Manrope Cyrillic'",
}
