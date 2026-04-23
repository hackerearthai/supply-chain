import { PageHeader } from "@/components/PageHeader";
import { GoogleSheetsIntegration as GoogleSheetsImporter } from "@/components/GoogleSheetsIntegration";

const GoogleSheetsIntegration = () => {
  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Data"
        title="Google Sheets"
        description="Import publicly shared Google Sheets into your supply chain workspace."
      />

      <GoogleSheetsImporter />
    </div>
  );
};

export default GoogleSheetsIntegration;
