import { BookOpenCheck } from "lucide-react";
import { Card, EmptyState } from "../../components/ui/index.js";

function StudentSectionPage({ title, description }) {
  return <Card className="overflow-hidden"><EmptyState icon={<BookOpenCheck size={22} />} title={title} description={description} /></Card>;
}

export default StudentSectionPage;