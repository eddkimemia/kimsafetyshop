import { NextResponse } from "next/server";
import { createReview, getReviewByUserAndProduct, hasPurchasedProduct, listReviewsForProduct } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";
import { liveGetProduct } from "@/lib/catalog";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("product");
  if (!productId) return NextResponse.json({ error: "Missing product" }, { status: 400 });

  const reviews = await listReviewsForProduct(productId);

  let canReview: boolean | null = null;
  let hasReviewed = false;
  if (searchParams.get("eligible") === "1") {
    const user = await getSessionUser();
    if (user) {
      const existing = await getReviewByUserAndProduct(user.id, productId);
      hasReviewed = Boolean(existing);
      canReview = !hasReviewed && (await hasPurchasedProduct(user.id, productId));
    }
  }

  return NextResponse.json({ reviews, canReview, hasReviewed });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in to leave a review" }, { status: 401 });

  let body: { productId?: string; rating?: number; title?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const productId = body.productId?.trim();
  const rating = Number(body.rating);
  const title = body.title?.trim() ?? "";
  const text = body.text?.trim() ?? "";

  if (!productId) return NextResponse.json({ error: "Missing product" }, { status: 400 });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5 stars" }, { status: 400 });
  }
  if (title.length < 3) return NextResponse.json({ error: "Please add a short review title" }, { status: 400 });
  if (text.length < 10) return NextResponse.json({ error: "Please write at least a sentence about the product" }, { status: 400 });

  const product = await liveGetProduct(productId);
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const purchased = await hasPurchasedProduct(user.id, productId);
  if (!purchased) {
    return NextResponse.json({ error: "Only verified purchasers can review this product. Reviews unlock after your order is placed." }, { status: 403 });
  }

  const existing = await getReviewByUserAndProduct(user.id, productId);
  if (existing) {
    return NextResponse.json({ error: "You have already reviewed this product — you can edit it from your account." }, { status: 409 });
  }

  const review = await createReview({
    product_id: productId,
    user_id: user.id,
    user_name: user.name || "KimSafety Customer",
    rating,
    title,
    text,
    status: "pending",
    verified: 1,
  });
  return NextResponse.json({ review }, { status: 201 });
}
