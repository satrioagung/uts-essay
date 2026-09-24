import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function requireRole(role: "admin" | "siswa") {
  const session = await getSession();
  if (!session || session.role !== role) return { response: NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 }) } as const;
  return { session } as const;
}
