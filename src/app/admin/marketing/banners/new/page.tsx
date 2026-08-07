import { BannerEditor, emptyBanner } from "@/components/admin/marketing/banner-editor";

export default function NewBannerPage() {
  return <BannerEditor initial={emptyBanner} isNew />;
}
