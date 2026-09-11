import RegisterForm from "@/components/auth/RegisterForm";

export const metadata = {
  title: "Daftar — NGEBOLANG",
};

export default function DaftarPage() {
  return (
    <div className="auth-page">
      <RegisterForm />
    </div>
  );
}
