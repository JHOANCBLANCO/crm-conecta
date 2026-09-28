import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDateShort(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Genera automáticamente el usuario con formato: primer_nombre.primer_apellido
 * Si ya existe otro usuario con ese mismo identificador, toma letra por letra
 * del segundo apellido pegado sin espacios (ej: andres.gomez -> andres.gomezr -> andres.gomezro).
 */
export function generateUsername(
  fullName: string,
  existingUsernames: string[] = []
): string {
  const normalized = fullName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/gi, 'n')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .trim();

  if (!normalized) return '';

  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';

  const taken = new Set(
    existingUsernames
      .filter(Boolean)
      .map((u) => u.trim().toLowerCase().split('@')[0].replace(/\s+/g, ''))
  );

  if (words.length === 1) {
    const base = words[0];
    if (!taken.has(base)) return base;
    let i = 2;
    while (taken.has(`${base}${i}`)) i++;
    return `${base}${i}`;
  }

  const firstName = words[0];
  let firstLastName = '';
  let secondLastName = '';

  if (words.length === 2) {
    firstLastName = words[1];
    secondLastName = '';
  } else if (words.length === 3) {
    // PrimerNombre PrimerApellido SegundoApellido -> ej: "Andrés Gómez Rojas" -> andres.gomezr
    firstLastName = words[1];
    secondLastName = words[2];
  } else {
    // PrimerNombre SegundoNombre PrimerApellido SegundoApellido -> ej: "Andrés Felipe Gómez Rojas" -> andres.gomezr
    firstLastName = words[2];
    secondLastName = words.slice(3).join('');
  }

  const base = `${firstName}.${firstLastName}`.replace(/\s+/g, '');
  if (!taken.has(base)) {
    return base;
  }

  if (secondLastName) {
    const cleanSecond = secondLastName.replace(/\s+/g, '');
    for (let len = 1; len <= cleanSecond.length; len++) {
      const candidate = `${base}${cleanSecond.slice(0, len)}`;
      if (!taken.has(candidate)) {
        return candidate;
      }
    }
  }

  const fallbackBase = secondLastName ? `${base}${secondLastName.replace(/\s+/g, '')}` : base;
  let counter = 2;
  while (taken.has(`${fallbackBase}${counter}`)) {
    counter++;
  }
  return `${fallbackBase}${counter}`;
}

