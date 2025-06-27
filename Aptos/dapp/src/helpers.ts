export const convertAptToOcta = (amount: number): number => {
  return amount * Math.pow(10, 8);
};

export const formatAPTAmount = (amount: number): string => {
  return new Intl.NumberFormat("en-US").format(amount);
};
