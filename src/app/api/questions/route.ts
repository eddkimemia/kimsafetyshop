import { NextResponse } from "next/server";
import { createProductQuestion, listQuestionsForProduct } from "@/lib/db";
import { rateLimit, tooMany } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Public: answered Q&A for a product, plus (authenticated-free) question submission. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  if (!productId) return NextResponse.json({ questions: [] });
  const all = await listQuestionsForProduct(productId);
  return NextResponse.json({ questions: all.filter((q) => q.answer) });
}

export async function POST(req: Request) {
  const rl = rateLimit(req, "questions", 5, 600000);
  if (!rl.ok) return tooMany(rl.retryAfter);

  let body: { product_id?: string; name?: string; email?: string; question?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const product_id = body.product_id?.trim();
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const question = body.question?.trim();
  if (!product_id || !name || !email || !question) {
    return NextResponse.json({ error: "Product, name, email and question are required" }, { status: 400 });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
  }
  if (question.length > 500) {
    return NextResponse.json({ error: "Question is too long (max 500 characters)" }, { status: 400 });
  }
  const q = await createProductQuestion({ product_id, name, email, question });
  return NextResponse.json({ question: q, message: "Thanks — our team will answer shortly." }, { status: 201 });
}
