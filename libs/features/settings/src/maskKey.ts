/** Shows only the start and the last four characters of a key: `sk-ant-…a1b2`. */
export const maskKey = (key: string): string =>
  key.length <= 12 ? '••••' : `${key.slice(0, 7)}…${key.slice(-4)}`;
