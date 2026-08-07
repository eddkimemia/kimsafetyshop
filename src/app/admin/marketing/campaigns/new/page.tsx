import { CampaignEditor, emptyCampaign } from "@/components/admin/marketing/campaign-editor";

export default function NewCampaignPage() {
  return <CampaignEditor initial={emptyCampaign} isNew />;
}
