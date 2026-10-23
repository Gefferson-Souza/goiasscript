import { RESERVATION_SEPARATOR } from './quota-ledger.constants';
import type { ParsedReservation } from './quota.types';

export function formatReservation(day: number, id: string, networkKey: string): string {
  return [String(day), id, networkKey].join(RESERVATION_SEPARATOR);
}

export function parseReservation(reservation: string): ParsedReservation | null {
  const [dayText, id, networkKey, ...extra] = reservation.split(RESERVATION_SEPARATOR);
  const day = Number(dayText);
  if (extra.length > 0 || !Number.isInteger(day) || !id || !networkKey) return null;
  return { day, id, networkKey };
}
