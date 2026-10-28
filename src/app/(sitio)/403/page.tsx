import Link from "next/link";

export default function Forbidden() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-3xl font-extrabold">No tienes permiso para ver esta página</h1>
      <p className="mt-2 text-muted">Ingresa con una cuenta que tenga acceso.</p>
      <Link href="/" className="btn-primary mt-4">Volver al inicio</Link>
    </div>
  );
}
