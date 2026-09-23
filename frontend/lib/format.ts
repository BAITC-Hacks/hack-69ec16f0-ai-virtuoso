import type { Direction } from "./types";

export const directionLabels: Record<Direction, string> = {
  transport: "Транспорт",
  ecology: "Экология",
  social: "Соцсфера",
  safety: "Безопасность",
  services: "Сервисы"
};

export function fmt(value: number, digits = 2): string {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
}

export function signed(value: number): string {
  return `${value >= 0 ? "+" : ""}${fmt(value)}`;
}
