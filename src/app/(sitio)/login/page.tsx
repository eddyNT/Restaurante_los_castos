import Link from "next/link";
import { AuthForm } from "./AuthForm";

export const metadata = { title: "Ingresar" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-3xl font-extrabold">Ingresar</h1>
      <p className="mb-6 mt-1 text-muted">
        ¿No tienes cuenta?{" "}
        <Link href={`/registro${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand">
          Regístrate
        </Link>
      </p>
      <AuthForm mode="login" next={next} />
    </div>
  );
}
