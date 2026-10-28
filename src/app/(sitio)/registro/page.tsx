import Link from "next/link";
import { AuthForm } from "../login/AuthForm";

export const metadata = { title: "Crear cuenta" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-3xl font-extrabold">Crear cuenta</h1>
      <p className="mb-6 mt-1 text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand">
          Ingresa
        </Link>
      </p>
      <AuthForm mode="register" next={next} />
    </div>
  );
}
