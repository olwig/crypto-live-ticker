
const symbols = JSON.parse('[]');

export const symbolIndex = {
  list() {
    return [...symbols];
  },
  length() {
    return symbols.length;
  },
  has(symbol) {
    return symbols.includes(symbol.toUpperCase());
  },
  url(symbol) {
    return `/symbols/${symbol.toLowerCase()}.png`;
  }
};