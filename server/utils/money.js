const DECIMAL_SCALE = 2;

export const parseAmountToMinor = (amount) => {
  if (amount === null || amount === undefined) {
    return null;
  }

  const value = typeof amount === "number" ? amount.toString() : String(amount);
  const trimmed = value.trim();

  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return null;
  }

  const [wholePart, fractionalPart = ""] = trimmed.split(".");
  const paddedFraction = (fractionalPart + "00").slice(0, DECIMAL_SCALE);
  const wholeMinor = Number.parseInt(wholePart, 10) * 10 ** DECIMAL_SCALE;
  const fractionMinor = Number.parseInt(paddedFraction, 10);

  return wholeMinor + fractionMinor;
};

export const splitEqualAmount = (totalMinor, memberCount) => {
  const baseShare = Math.floor(totalMinor / memberCount);
  const remainder = totalMinor % memberCount;

  return Array.from({ length: memberCount }, (_, index) =>
    index < remainder ? baseShare + 1 : baseShare
  );
};
