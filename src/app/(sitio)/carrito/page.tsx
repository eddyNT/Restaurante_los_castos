import { CartView } from "./CartView";

export const metadata = { title: "Carrito" };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-3xl font-extrabold">Tu carrito</h1>
      <CartView />
    </div>
  );
}
