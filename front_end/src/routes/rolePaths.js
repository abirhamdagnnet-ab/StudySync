const rolePaths = {
  student: "/student",
  teacher: "/teacher",
  admin: "/admin",
};

const getRolePath = (role) => rolePaths[role] ?? "/login";

export { rolePaths, getRolePath };