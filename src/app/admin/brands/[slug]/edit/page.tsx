import { BrandForm } from "@/components/admin/brand-form";

export default async function AdminBrandEditPage({ params }: { params: { slug: string } }) {
  return <BrandForm mode="edit" slug={decodeURIComponent(params.slug)} />;
}
