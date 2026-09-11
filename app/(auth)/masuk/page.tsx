import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Masuk — NGEBOLANG",
};

export default function MasukPage() {
  return (
    <div className="auth-page">
      <LoginForm />
    </div>
  );
}
