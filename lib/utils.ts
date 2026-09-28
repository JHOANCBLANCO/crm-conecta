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

const COMMON_MIDDLE_NAMES = new Set([
  'carlos', 'david', 'andres', 'felipe', 'jose', 'luis', 'miguel', 'angel',
  'fernando', 'alejandro', 'sebastian', 'camilo', 'daniel', 'santiago', 'nicolas',
  'maria', 'fernanda', 'paula', 'andrea', 'camila', 'valentina', 'natalia',
  'daniela', 'marcela', 'patricia', 'sofia', 'laura', 'juliana', 'carolina',
  'alejandra', 'paola', 'viviana', 'milena', 'catalina', 'lorena', 'diana',
  'claudia', 'sandra', 'liliana', 'alberto', 'eduardo', 'mauricio', 'ivan',
  'oscar', 'cesar', 'javier', 'ricardo', 'leonardo', 'diego', 'cristian',
  'fabian', 'hernan', 'german', 'gustavo', 'hector', 'jaime', 'jairo', 'jesus',
  'jhon', 'john', 'jorge', 'juan', 'julian', 'manuel', 'marco', 'mario',
  'nelson', 'omar', 'pedro', 'rafael', 'ramiro', 'raul', 'rene', 'roberto',
  'rodrigo', 'ruben', 'sergio', 'victor', 'william', 'wilson', 'yesid',
  'adriana', 'alba', 'angela', 'angie', 'beatriz', 'blanca', 'carmen',
  'cecilia', 'clara', 'constanza', 'cristina', 'dora', 'edna', 'elena',
  'elizabeth', 'elsa', 'esperanza', 'estela', 'fabiola', 'flor', 'gloria',
  'helena', 'ines', 'ingrid', 'irene', 'isabel', 'jenny', 'jessica', 'johana',
  'julieta', 'karen', 'karina', 'kelly', 'lady', 'leidy', 'lina', 'lucia',
  'luisa', 'luz', 'magda', 'margarita', 'martha', 'mayra', 'melissa',
  'mercedes', 'monica', 'nancy', 'nelly', 'nidia', 'norma', 'olga', 'pilar',
  'rocio', 'rosa', 'ruby', 'ruth', 'sara', 'silvia', 'sonia', 'stella',
  'susana', 'tatiana', 'teresa', 'vanessa', 'veronica', 'victoria', 'wendy',
  'ximena', 'yamile', 'yenny', 'yolanda', 'yuli', 'zulma'
]);

/**
 * Genera automáticamente el usuario con formato: primer_nombre.primer_apellido
 * Si ya existe otro usuario con ese mismo identificador, toma letra por letra
 * del segundo apellido (ej: juan.perez -> juan.perezg -> juan.perezgo).
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
      .map((u) => u.trim().toLowerCase().split('@')[0])
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
    const candidateAsFirstSurname = `${words[0]}.${words[1]}`;
    if (taken.has(candidateAsFirstSurname) || !COMMON_MIDDLE_NAMES.has(words[1])) {
      // Ej: "Andrés Gómez Rojas" -> primer nombre: andres, primer apellido: gomez, segundo apellido: rojas
      firstLastName = words[1];
      secondLastName = words[2];
    } else {
      // Ej: "Juan Fernando Restrepo" -> primer nombre: juan, segundo nombre: fernando, primer apellido: restrepo
      firstLastName = words[2];
      secondLastName = '';
    }
  } else {
    // 4 o más palabras: PrimerNombre SegundoNombre PrimerApellido SegundoApellido
    firstLastName = words[2];
    secondLastName = words.slice(3).join('');
  }

  const base = `${firstName}.${firstLastName}`;
  if (!taken.has(base)) {
    return base;
  }

  if (secondLastName) {
    for (let len = 1; len <= secondLastName.length; len++) {
      const candidate = `${base}${secondLastName.slice(0, len)}`;
      if (!taken.has(candidate)) {
        return candidate;
      }
    }
  }

  const fallbackBase = secondLastName ? `${base}${secondLastName}` : base;
  let counter = 2;
  while (taken.has(`${fallbackBase}${counter}`)) {
    counter++;
  }
  return `${fallbackBase}${counter}`;
}

