import { Settings } from "lucide-react";
import { Card, EmptyState } from "../../components/ui/index.js";

function AdminSectionPage({ title, description }) {
  return <Card><EmptyState icon={<Settings size={22} />} title={title} description={description} /></Card>;
}

export default AdminSectionPage;