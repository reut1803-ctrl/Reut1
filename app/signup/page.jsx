import AuthForm from "@/components/auth/AuthForm";

export default function SignupPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <AuthForm mode="signup" />
    </div>
  );
}
