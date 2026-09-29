import { Users } from "lucide-react";
import { Card, EmptyState } from "../../components/ui/index.js";

function TeacherSectionPage({ title, description }) {
  return <Card><EmptyState icon={<Users size={22} />} title={title} description={description} /></Card>;
}

export default TeacherSectionPage;