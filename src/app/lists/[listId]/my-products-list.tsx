"use client";

import { FormEvent, KeyboardEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DeleteIconButton } from "@/components/delete-icon-button";
import { useToast } from "@/components/toast-provider";
import {
  clearProductPurchaseAction,
  recordProductPurchaseAction,
  softDeleteUserProductAction,
  type PurchaseActionState,
  updateUserProductDetailsAction,
} from "./actions";

type MyProductEntry = {
  id: string;
  name: string;
  categoryId: string | null;
  categoryName: string;
  quantity: number;
  unit: "un" | "kg" | "L";
  purchased: boolean;
  paidPrice: number | null;
  referencePrice: number | null;
};

type CategoryOption = {
  id: string;
  name: string;
};

type MyProductsListProps = {
  listId: string;
  products: MyProductEntry[];
  categories: CategoryOption[];
};

const UNIT_OPTIONS: Array<"un" | "kg" | "L"> = ["un", "kg", "L"];

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

export function MyProductsList({ listId, products, categories }: MyProductsListProps) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [activeProduct, setActiveProduct] = useState<MyProductEntry | null>(null);
  const [priceInput, setPriceInput] = useState("");
  const [saveReference, setSaveReference] = useState(true);
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const productsCountLabel = useMemo(() => `${products.length} cadastrado(s)`, [products.length]);

  function closeModal() {
    setActiveProduct(null);
    setPriceInput("");
    setSaveReference(true);
  }

  function openPriceModal(product: MyProductEntry, keepReference = true) {
    setActiveProduct(product);
    setPriceInput(product.paidPrice ? String(product.paidPrice.toFixed(2)).replace(".", ",") : "");
    setSaveReference(keepReference);
  }

  async function handleUncheck(productId: string) {
    setPendingProductId(productId);

    const formData = buildFormData(listId, productId);
    const result = (await clearProductPurchaseAction(formData)) as PurchaseActionState;

    pushToast({ kind: result.status, message: result.message });
    setPendingProductId(null);

    if (result.status === "success") {
      router.refresh();
    }
  }

  function handleCheckboxChange(product: MyProductEntry, checked: boolean) {
    if (checked) {
      const referencePrice = product.referencePrice;
      if (referencePrice !== null) {
        startTransition(async () => {
          setPendingProductId(product.id);
          const formData = buildFormData(listId, product.id);
          formData.append("paidPrice", referencePrice.toFixed(2));

          const result = (await recordProductPurchaseAction(formData)) as PurchaseActionState;
          pushToast({ kind: result.status, message: result.message });
          setPendingProductId(null);

          if (result.status === "success") {
            router.refresh();
          }
        });
        return;
      }

      openPriceModal(product);
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
      pushToast({ kind: result.status, message: result.message });

      if (result.status === "success") {
        closeModal();
        router.refresh();
      }
    });
  }

  function handleRowSubmit(event: FormEvent<HTMLFormElement>, productId: string) {
    event.preventDefault();

    startTransition(async () => {
      setPendingProductId(productId);
      const formData = new FormData(event.currentTarget);
      const result = (await updateUserProductDetailsAction(formData)) as PurchaseActionState;
      pushToast({ kind: result.status, message: result.message });
      setPendingProductId(null);

      if (result.status === "success") {
        router.refresh();
      }
    });
  }

  function handleFieldEnter(event: KeyboardEvent<HTMLInputElement | HTMLSelectElement>) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  function handleDeleteProduct(product: MyProductEntry) {
    const shouldDelete = window.confirm(`Excluir o produto \"${product.name}\"?`);

    if (!shouldDelete) {
      return;
    }

    startTransition(async () => {
      setPendingProductId(product.id);
      const formData = buildFormData(listId, product.id);
      const result = (await softDeleteUserProductAction(formData)) as PurchaseActionState;

      pushToast({ kind: result.status, message: result.message });
      setPendingProductId(null);

      if (result.status === "success") {
        if (activeProduct?.id === product.id) {
          closeModal();
        }
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

      {products.length === 0 ? (
        <p className="text-muted">Nenhum produto cadastrado ainda.</p>
      ) : (
        <div className="products-grid-wrapper">
          <div className="products-grid-head">
            <span aria-hidden="true" className="checkbox-header-spacer" />
            <span>Nome</span>
            <span>Categoria</span>
            <span>Qtd</span>
            <span>Unid.</span>
            <span aria-hidden="true" />
          </div>

          {products.map((product) => {
            const isBusy = isPending && pendingProductId === product.id;

            return (
              <form
                className="products-grid-row"
                key={product.id}
                onSubmit={(event) => handleRowSubmit(event, product.id)}
              >
                <input type="hidden" name="listId" value={listId} />
                <input type="hidden" name="productId" value={product.id} />

                <div className="checkbox-cell" data-label="">
                  <input
                    aria-label="Comprado"
                    type="checkbox"
                    checked={product.purchased}
                    disabled={isBusy}
                    onChange={(event) => handleCheckboxChange(product, event.target.checked)}
                  />
                </div>

                <div className="product-name-cell" data-label="Nome">
                  <div className="product-name-inline">
                    <input
                      className="input"
                      name="name"
                      defaultValue={product.name}
                      disabled={isBusy}
                      maxLength={120}
                      onBlur={(event) => event.currentTarget.form?.requestSubmit()}
                      onKeyDown={handleFieldEnter}
                      required
                    />
                    {product.purchased && product.paidPrice ? (
                      <button
                        className="value-chip"
                        onClick={() => openPriceModal(product, true)}
                        title="Editar valor pago"
                        type="button"
                      >
                        Valor: {formatCurrency(product.paidPrice)}
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="category-cell" data-label="Categoria">
                  <select
                    className="input"
                    name="categoryId"
                    defaultValue={product.categoryId ?? "__NONE__"}
                    onBlur={(event) => event.currentTarget.form?.requestSubmit()}
                    onChange={(event) => event.currentTarget.form?.requestSubmit()}
                    onKeyDown={handleFieldEnter}
                    disabled={isBusy}
                    title={product.categoryName}
                  >
                    <option value="__NONE__">Sem categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="quantity-cell" data-label="Quantidade">
                  <input
                    className="input quantity-input"
                    type="number"
                    min="0.001"
                    step="0.001"
                    name="quantity"
                    defaultValue={String(product.quantity)}
                    onBlur={(event) => event.currentTarget.form?.requestSubmit()}
                    onKeyDown={handleFieldEnter}
                    disabled={isBusy}
                  />
                </div>

                <div className="unit-cell" data-label="Unidade">
                  <select
                    className="input unit-input"
                    name="unit"
                    defaultValue={product.unit}
                    onBlur={(event) => event.currentTarget.form?.requestSubmit()}
                    onChange={(event) => event.currentTarget.form?.requestSubmit()}
                    onKeyDown={handleFieldEnter}
                    disabled={isBusy}
                  >
                    {UNIT_OPTIONS.map((unitOption) => (
                      <option key={unitOption} value={unitOption}>
                        {unitOption}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="actions-cell" data-label="Acoes">
                  <DeleteIconButton
                    disabled={isBusy}
                    label={`Excluir ${product.name}`}
                    onClick={() => handleDeleteProduct(product)}
                    title="Excluir produto"
                  />
                </div>
              </form>
            );
          })}
        </div>
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
