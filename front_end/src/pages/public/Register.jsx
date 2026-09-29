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

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const nextErrors = {};
    if (!emailPattern.test(credentials.email.trim())) nextErrors.email = "Enter a valid email address.";
    if (credentials.password.length < 8) nextErrors.password = "Password must be at least 8 characters.";
    if (credentials.confirmPassword !== credentials.password) nextErrors.confirmPassword = "Passwords do not match.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const user = await notifyPromise(register({ email: credentials.email.trim(), password: credentials.password }), {
        loading: "Creating your account...",
        success: "Account created!",
        error: (error) => authErrorMessage(error, "create your account"),
      });
      navigate(getRolePath(user.role), { replace: true });
    } catch {
      // notifyPromise displays the backend error.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthSplitLayout mode="register" eyebrow="Start preparing" title="Create your account" description="Join StudySync and build a study routine that works for you.">
      <form className="space-y-4" onSubmit={submit} noValidate>
        <Input label="Email address" type="email" autoComplete="email" placeholder="you@example.com" icon={<Mail size={17} />} value={credentials.email} error={errors.email} onChange={(event) => { setCredentials({ ...credentials, email: event.target.value }); setErrors({ ...errors, email: undefined }); }} />
        <div className="relative">
          <Input label="Password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="At least 8 characters" icon={<KeyRound size={17} />} inputClassName="pr-12" value={credentials.password} error={errors.password} onChange={(event) => { setCredentials({ ...credentials, password: event.target.value }); setErrors({ ...errors, password: undefined }); }} />
          <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-[38px] rounded-lg p-1 text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
        </div>
        <div className="relative">
          <Input label="Confirm password" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" placeholder="Enter your password again" icon={<KeyRound size={17} />} inputClassName="pr-12" value={credentials.confirmPassword} error={errors.confirmPassword} onChange={(event) => { setCredentials({ ...credentials, confirmPassword: event.target.value }); setErrors({ ...errors, confirmPassword: undefined }); }} />
          <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} className="absolute right-3 top-[38px] rounded-lg p-1 text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}>{showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
        </div>
        <p className="text-xs leading-5 text-slate-500">Registration creates a student account.</p>
        <Button type="submit" loading={submitting} className="w-full" disabled={submitting}>Create account</Button>
        <p className="text-center text-sm text-slate-500">Already registered? <Link to="/login" className="font-semibold text-indigo-700 hover:text-indigo-900">Sign in</Link></p>
      </form>
    </AuthSplitLayout>
  );
}

export default Register;
