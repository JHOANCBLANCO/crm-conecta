import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const BASE_OPERATORS = ['Claro', 'Tigo', 'WOM', 'Movistar', 'ETB'];
const CUSTOM_FILE = path.join(process.cwd(), 'prisma', 'custom-operators.json');

function readCustomOperatorsFile(): string[] {
  try {
    if (fs.existsSync(CUSTOM_FILE)) {
      const content = fs.readFileSync(CUSTOM_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed.filter((x) => typeof x === 'string' && x.trim().length > 0);
      }
    }
  } catch (e) {
    // ignore
  }
  return [];
}

export function saveCustomOperatorToFile(newOp: string): string[] {
  const clean = newOp.trim();
  if (!clean) return readCustomOperatorsFile();

  const current = readCustomOperatorsFile();
  const allLower = new Set([
    ...BASE_OPERATORS.map((o) => o.toLowerCase()),
    ...current.map((o) => o.toLowerCase()),
  ]);

  if (!allLower.has(clean.toLowerCase())) {
    current.push(clean);
    try {
      fs.writeFileSync(CUSTOM_FILE, JSON.stringify(current, null, 2), 'utf-8');
    } catch (e) {
      // ignore write error
    }
  }
  return current;
}

export async function GET() {
  try {
    const fileOps = readCustomOperatorsFile();
    let dbOps: string[] = [];

    try {
      const sales = await prisma.sale.findMany({
        select: { originOperator: true },
        distinct: ['originOperator'],
      });
      dbOps = sales
        .map((s) => s.originOperator?.trim())
        .filter((v): v is string => !!v && v.toLowerCase() !== 'otro');
    } catch (e) {
      // ignore if column not migrated yet
    }

    const merged: string[] = [...BASE_OPERATORS];
    const seen = new Set(BASE_OPERATORS.map((o) => o.toLowerCase()));

    for (const op of [...fileOps, ...dbOps]) {
      const lower = op.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        merged.push(op);
      }
    }

    return NextResponse.json({ operators: merged });
  } catch (error: any) {
    return NextResponse.json({ operators: BASE_OPERATORS });
  }
}

export async function POST(req: Request) {
  try {
    const { operator } = await req.json();
    if (!operator || typeof operator !== 'string' || !operator.trim()) {
      return NextResponse.json({ error: 'Operador inválido' }, { status: 400 });
    }
    const updatedCustom = saveCustomOperatorToFile(operator.trim());
    const merged = [...BASE_OPERATORS, ...updatedCustom];
    return NextResponse.json({ operators: merged });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
