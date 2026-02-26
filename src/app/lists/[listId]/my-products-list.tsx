"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  clearProductPurchaseAction,
  recordProductPurchaseAction,
  type PurchaseActionState,
} from "./actions";

type MyProductEntry = {
  id: string;
  name: string;
  categoryName: string;
  unit: "un" | "kg" | "L";
  purchased: boolean;
  paidPrice: number | null;
};

type MyProductsListProps = {
  listId: string;
  products: MyProductEntry[];
};

type Feedback = {
  status: "success" | "error";
  message: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function buildFormData(listId: string, productId: string) {
  const formData = new FormData();
  formData.append("listId", listId);
  formData.append("productId", productId);
  return formData;
}

export function MyProductsList({ listId, products }: MyProductsListProps) {
  const router = useRouter();
  const [activeProduct, setActiveProduct] = useState<MyProductEntry | null>(null);
  const [priceInput, setPriceInput] = useState("");
  const [saveReference, setSaveReference] = useState(true);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const productsCountLabel = useMemo(() => `${products.length} cadastrado(s)`, [products.length]);

  function closeModal() {
    setActiveProduct(null);
    setPriceInput("");
    setSaveReference(true);
  }

  async function handleUncheck(productId: string) {
    setPendingProductId(productId);

    const formData = buildFormData(listId, productId);
    const result = (await clearProductPurchaseAction(formData)) as PurchaseActionState;

    setFeedback({ status: result.status, message: result.message });
    setPendingProductId(null);

    if (result.status === "success") {
      router.refresh();
    }
  }

  function handleCheckboxChange(product: MyProductEntry, checked: boolean) {
    if (checked) {
      setFeedback(null);
      setActiveProduct(product);
      setPriceInput(product.paidPrice ? String(product.paidPrice.toFixed(2)).replace(".", ",") : "");
      setSaveReference(true);
      return;
    }

    startTransition(async () => {
      await handleUncheck(product.id);
    });
  }

  function handleConfirmPurchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeProduct) {
      return;
    }

    startTransition(async () => {
      const formData = buildFormData(listId, activeProduct.id);
      formData.append("paidPrice", priceInput);
      if (saveReference) {
        formData.append("saveReference", "on");
      }

      const result = (await recordProductPurchaseAction(formData)) as PurchaseActionState;
      setFeedback({ status: result.status, message: result.message });

      if (result.status === "success") {
        closeModal();
        router.refresh();
      }
    });
  }

  return (
    <section className="card stack-sm">
      <div className="row-between">
        <h2 className="subheading">Meus produtos</h2>
        <span className="text-muted">{productsCountLabel}</span>
      </div>

      {feedback ? (
        <p className={feedback.status === "success" ? "text-success" : "text-error"}>{feedback.message}</p>
      ) : null}

      {products.length === 0 ? (
        <p className="text-muted">Nenhum produto cadastrado ainda.</p>
      ) : (
        products.map((product) => {
          const isBusy = isPending && pendingProductId === product.id;

          return (
            <article className="list-card" key={product.id}>
              <label className="checkline" htmlFor={`product-check-${product.id}`}>
                <input
                  id={`product-check-${product.id}`}
                  type="checkbox"
                  checked={product.purchased}
                  disabled={isBusy}
                  onChange={(event) => handleCheckboxChange(product, event.target.checked)}
                />
                <span>
                  <strong>{product.name}</strong>
                  <span className="product-meta">
                    {product.categoryName} - {product.unit}
                  </span>
                  {product.purchased && product.paidPrice ? (
                    <span className="text-success product-meta">Pago: {formatCurrency(product.paidPrice)}</span>
                  ) : null}
                </span>
              </label>
            </article>
          );
        })
      )}

      {activeProduct ? (
        <div className="modal-backdrop" role="presentation">
          <div aria-labelledby="purchase-title" aria-modal="true" className="modal-card stack-md" role="dialog">
            <h3 className="subheading" id="purchase-title">
              Confirmar compra
            </h3>
            <p className="text-muted">{activeProduct.name}</p>

            <form className="stack-sm" onSubmit={handleConfirmPurchase}>
              <label className="label" htmlFor="paidPriceInput">
                Voce pagou quanto?
              </label>
              <input
                autoFocus
                className="input"
                id="paidPriceInput"
                inputMode="decimal"
                name="paidPrice"
                onChange={(event) => setPriceInput(event.target.value)}
                placeholder="Ex.: 12,90"
                required
                value={priceInput}
              />

              <label className="checkline" htmlFor="saveReferenceInput">
                <input
                  checked={saveReference}
                  id="saveReferenceInput"
                  onChange={(event) => setSaveReference(event.target.checked)}
                  type="checkbox"
                />
                <span>Salvar este valor como referencia para proximos calculos</span>
              </label>

              <div className="row-actions">
                <button className="button button-secondary" onClick={closeModal} type="button">
                  Cancelar
                </button>
                <button className="button" disabled={isPending} type="submit">
                  {isPending ? "Confirmando..." : "Confirmar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
