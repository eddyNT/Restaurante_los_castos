import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-extrabold">No encontramos esa página</h1>
      <Link href="/menu" className="btn-primary mt-4">Ir al menú</Link>
    </main>
  );
}
