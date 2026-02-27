export function formatCurrencyBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function extractDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function formatBrlFromDigits(digits: string) {
  if (!digits) {
    return "";
  }

  const value = Number(digits) / 100;
  return formatCurrencyBRL(value);
}

export function formatBrlFromNumber(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "";
  }

  return formatCurrencyBRL(value);
}

export function parseBrlToNumber(maskedValue: string) {
  const digits = extractDigits(maskedValue);
  if (!digits) {
    return null;
  }

  return Number((Number(digits) / 100).toFixed(2));
}

export function normalizeQuantityInput(rawValue: string) {
  let sanitized = rawValue.replace(/[^0-9.,]/g, "").replace(/,/g, ".");
  const dotIndex = sanitized.indexOf(".");
  if (dotIndex !== -1) {
    const integerPart = sanitized.slice(0, dotIndex);
    const decimalPart = sanitized
      .slice(dotIndex + 1)
      .replace(/\./g, "")
      .slice(0, 3);
    sanitized = `${integerPart}.${decimalPart}`;
  }

  return sanitized;
}

export function isBlockedNumericKey(key: string) {
  return ["e", "E", "+", "-", "@"].includes(key);
}
