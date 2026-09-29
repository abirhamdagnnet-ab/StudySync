import { useState } from "react";
import { Eye, EyeOff, KeyRound, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input } from "../../components/ui/index.js";
import AuthSplitLayout from "../../layouts/AuthSplitLayout.jsx";
import useAuth from "../../hooks/useAuth.js";
import { getRolePath } from "../../routes/rolePaths.js";
import { notifyPromise } from "../../utils/toast.js";
import authErrorMessage from "../../utils/authErrorMessage.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const nextErrors = {};
    if (!emailPattern.test(credentials.email.trim())) nextErrors.email = "Enter a valid email address.";
    if (credentials.password.length < 8) nextErrors.password = "Password must be at least 8 characters.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const user = await notifyPromise(login({ email: credentials.email.trim(), password: credentials.password }), {
        loading: "Signing in...",
        success: "Welcome back!",
        error: (error) => authErrorMessage(error, "sign in"),
      });
      navigate(getRolePath(user.role), { replace: true });
    } catch {
      // notifyPromise displays the backend error.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthSplitLayout eyebrow="Welcome back" title="Sign in to StudySync" description="Pick up where your preparation left off.">
      <form className="space-y-5" onSubmit={submit} noValidate>
        <Input label="Email address" type="email" autoComplete="email" placeholder="you@example.com" icon={<Mail size={17} />} value={credentials.email} error={errors.email} onChange={(event) => { setCredentials({ ...credentials, email: event.target.value }); setErrors({ ...errors, email: undefined }); }} />
        <div className="relative">
          <Input label="Password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" icon={<KeyRound size={17} />} inputClassName="pr-12" value={credentials.password} error={errors.password} onChange={(event) => { setCredentials({ ...credentials, password: event.target.value }); setErrors({ ...errors, password: undefined }); }} />
          <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-[38px] rounded-lg p-1 text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
        </div>
        <Button type="submit" loading={submitting} className="w-full" disabled={submitting}>Sign in</Button>
        <p className="text-center text-sm text-slate-500">New to StudySync? <Link to="/register" className="font-semibold text-indigo-700 hover:text-indigo-900">Create an account</Link></p>
      </form>
    </AuthSplitLayout>
  );
}

export default Login;
