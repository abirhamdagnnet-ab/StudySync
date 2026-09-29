import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const titles = [
  [/^\/$/, "Home"], [/^\/login\/?$/, "Log in"], [/^\/register\/?$/, "Create account"],
  [/^\/student\/?$/, "Student dashboard"], [/^\/student\/quiz\/?$/, "Quiz"], [/^\/student\/learning\/?$/, "My learning"],
  [/^\/student\/progress\/?$/, "Progress"], [/^\/student\/weak-topics\/?$/, "Weak topics"],
  [/^\/student\/ai\/?$/, "AI study"], [/^\/student\/assistant\/?$/, "Study assistant"],
  [/^\/teacher\/?$/, "Teacher dashboard"], [/^\/teacher\/classes\/?$/, "Classes"], [/^\/teacher\/questions\/?$/, "Questions"],
  [/^\/teacher\/students\/?$/, "Students"], [/^\/teacher\/trends\/?$/, "Class trends"],
  [/^\/admin\/?$/, "Admin dashboard"], [/^\/admin\/users\/?$/, "Users"], [/^\/admin\/subjects\/?$/, "Subjects"],
  [/^\/admin\/topics\/?$/, "Topics"], [/^\/admin\/questions\/?$/, "Questions"], [/^\/admin\/analytics\/?$/, "Analytics"], [/^\/admin\/settings\/?$/, "Settings"],
];

function DocumentTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const match = titles.find(([pattern]) => pattern.test(pathname));
    document.title = `${match?.[1] ?? (pathname === "/403" ? "Access denied" : "Page not found")} | StudySync`;
  }, [pathname]);
  return null;
}

export default DocumentTitle;
