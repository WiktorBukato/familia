import type { Person } from './model';

export const relationLabels = {
  birth: 'По рождению',
  marriage: 'Через брак',
} as const;

const fullDate = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function lifespan({ birth, death }: Person, detailed = false) {
  if (!birth) return undefined;
  if (!death) return `р. ${birth.slice(0, 4)}`;
  const display = (date: string) => detailed && date.length > 4
    ? fullDate.format(new Date(date))
    : date.slice(0, 4);
  return detailed ? `${display(birth)} — ${display(death)}` : `${display(birth)}–${display(death)}`;
}
