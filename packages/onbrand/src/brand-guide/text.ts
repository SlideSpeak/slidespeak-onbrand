export const titleCase = (value: string): string =>
  value.replace(/\b[a-z]/giu, (character) => character.toUpperCase());
