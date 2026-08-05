import { NextResponse } from "next/server";
import { requireAdmin, getSessionUser } from "@/lib/api-helpers";
import { getLetterById, getAllSettings } from "@/lib/db";
import { renderLetterPdf } from "@/lib/letter-pdf";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing letter id" }, { status: 400 });

  const letter = getLetterById(id);
  if (!letter) return NextResponse.json({ error: "Letter not found" }, { status: 404 });

  const me = await getSessionUser();
  if (me?.role !== "superadmin" && !(letter.created_by_id && letter.created_by_id === me?.id)) {
    return NextResponse.json({ error: "You can only download letters you created" }, { status: 403 });
  }

  const settings = getAllSettings();
  const pdf = await renderLetterPdf(letter, settings);

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${letter.id}.pdf"`,
    },
  });
}
