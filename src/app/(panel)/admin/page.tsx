import { OrderBoard } from "./OrderBoard";

export const metadata = { title: "Pedidos" };

export default function AdminHome() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold">Pedidos</h1>
      <p className="mb-6 text-sm text-muted">Se actualiza solo cada 5 segundos. Los pedidos nuevos suenan.</p>
      <OrderBoard />
    </div>
  );
}
