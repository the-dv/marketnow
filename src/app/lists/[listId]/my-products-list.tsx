"use client";

import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { DeleteIconButton } from "@/components/delete-icon-button";
import { useToast } from "@/components/toast-provider";
import {
  bulkMarkProductsPurchasedAction,
  clearProductPurchaseAction,
  recordProductPurchaseAction,
  softDeleteUserProductAction,
  type PurchaseActionState,
  unpurchaseAllListItemsAction,
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

type BulkStep = "decision" | "prices" | "unpurchase" | null;

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

function extractDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatBrlFromDigits(digits: string) {
  if (!digits) {
    return "";
  }

  const value = Number(digits) / 100;
  return formatCurrency(value);
}

function formatBrlFromNumber(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "";
  }

  return formatCurrency(value);
}

function parseBrlToNumber(maskedValue: string) {
  const digits = extractDigits(maskedValue);
  if (!digits) {
    return null;
  }

  return Number((Number(digits) / 100).toFixed(2));
}

function normalizeQuantityInput(rawValue: string) {
  let sanitized = rawValue.replace(/[^0-9.,]/g, "").replace(/,/g, ".");
  const dotIndex = sanitized.indexOf(".");
  if (dotIndex !== -1) {
    const integerPart = sanitized.slice(0, dotIndex);
    const decimalPart = sanitized
      .slice(dotIndex + 1)
      .replace(/\./g, "")
      .slice(0, 3);
    sanitized = `${integerPart}.${decimalPart}`;
  }

  return sanitized;
}

function shouldBlockNumericChar(event: KeyboardEvent<HTMLInputElement>) {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return false;
  }

  return ["e", "E", "+", "-", "@"].includes(event.key);
}

export function MyProductsList({ listId, products, categories }: MyProductsListProps) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [activeProduct, setActiveProduct] = useState<MyProductEntry | null>(null);
  const [priceInput, setPriceInput] = useState("");
  const [saveReference, setSaveReference] = useState(true);
  const [bulkStep, setBulkStep] = useState<BulkStep>(null);
  const [bulkPriceInputs, setBulkPriceInputs] = useState<Record<string, string>>({});
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
  const bulkModalRef = useRef<HTMLDivElement>(null);

  const productsCountLabel = useMemo(() => `${products.length} cadastrado(s)`, [products.length]);
  const purchasedCount = useMemo(
    () => products.filter((product) => product.purchased).length,
    [products],
  );
  const allPurchased = products.length > 0 && purchasedCount === products.length;
  const somePurchased = purchasedCount > 0 && purchasedCount < products.length;

  useEffect(() => {
    if (!selectAllCheckboxRef.current) {
      return;
    }

    selectAllCheckboxRef.current.indeterminate = somePurchased;
  }, [somePurchased]);

  const closeBulkModal = useCallback(() => {
    setBulkStep(null);
    setBulkPriceInputs({});
  }, []);

  useEffect(() => {
    if (!bulkStep || !bulkModalRef.current) {
      return;
    }

    const dialog = bulkModalRef.current;
    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableElements = Array.from(
      dialog.querySelectorAll<HTMLElement>(focusableSelector),
    ).filter((element) => !element.hasAttribute("disabled"));

    focusableElements[0]?.focus();

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeBulkModal();
        return;
      }

      if (event.key !== "Tab" || focusableElements.length === 0) {
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [bulkStep, closeBulkModal]);

  function closeModal() {
    setActiveProduct(null);
    setPriceInput("");
    setSaveReference(true);
  }

  function openPriceModal(product: MyProductEntry, keepReference = true) {
    setActiveProduct(product);
    setPriceInput(formatBrlFromNumber(product.paidPrice));
    setSaveReference(keepReference);
  }

  function openBulkDecisionModal() {
    const initialInputs: Record<string, string> = {};
    for (const product of products) {
      const basePrice = product.paidPrice ?? product.referencePrice;
      initialInputs[product.id] = formatBrlFromNumber(basePrice);
    }

    setBulkPriceInputs(initialInputs);
    setBulkStep("decision");
  }

  function buildBulkItemsWithCurrentAndReferenceValues() {
    return products.map((product) => {
      const price = product.paidPrice ?? product.referencePrice;
      return {
        productId: product.id,
        paidPrice: price ?? undefined,
      };
    });
  }

  function buildBulkItemsFromModalValues() {
    return products.map((product) => {
      const paidPrice = parseBrlToNumber(bulkPriceInputs[product.id] ?? "");
      return {
        productId: product.id,
        paidPrice: paidPrice ?? undefined,
      };
    });
  }

  function runBulkPurchase(items: Array<{ productId: string; paidPrice?: number }>, persistReference: boolean) {
    startTransition(async () => {
      setPendingProductId("__bulk__");
      const formData = new FormData();
      formData.append("listId", listId);
      formData.append("items", JSON.stringify(items));
      if (persistReference) {
        formData.append("saveReference", "on");
      }

      const result = (await bulkMarkProductsPurchasedAction(formData)) as PurchaseActionState;
      pushToast({ kind: result.status, message: result.message });

      setPendingProductId(null);

      if (result.status === "success") {
        closeBulkModal();
        router.refresh();
      }
    });
  }

  function runBulkUnpurchase() {
    startTransition(async () => {
      setPendingProductId("__bulk__");
      const result = (await unpurchaseAllListItemsAction(listId)) as PurchaseActionState;
      pushToast({ kind: result.status, message: result.message });
      setPendingProductId(null);

      if (result.status === "success") {
        closeBulkModal();
        router.refresh();
      }
    });
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

  function handleSelectAllCheckboxChange(checked: boolean) {
    if (products.length === 0) {
      return;
    }

    if (!checked && allPurchased) {
      setBulkStep("unpurchase");
      return;
    }

    if (!checked) {
      return;
    }

    openBulkDecisionModal();
  }

  function handleConfirmPurchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeProduct) {
      return;
    }

    const parsedPaidPrice = parseBrlToNumber(priceInput);
    if (parsedPaidPrice === null) {
      pushToast({ kind: "error", message: "Informe um preco valido." });
      return;
    }

    startTransition(async () => {
      const formData = buildFormData(listId, activeProduct.id);
      formData.append("paidPrice", parsedPaidPrice.toFixed(2));
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

  function handleQuantityKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
      return;
    }

    if (shouldBlockNumericChar(event)) {
      event.preventDefault();
    }
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
            <span className="checkbox-header-cell">
              <label className="checkbox-hitarea" htmlFor="selectAllProductsCheckbox" title="Marcar todos os itens">
                <input
                  aria-checked={somePurchased ? "mixed" : allPurchased}
                  aria-label="Marcar todos os itens"
                  checked={allPurchased}
                  className="list-checkbox-input header-checkbox-input"
                  id="selectAllProductsCheckbox"
                  onChange={(event) => handleSelectAllCheckboxChange(event.target.checked)}
                  ref={selectAllCheckboxRef}
                  title="Marcar todos os itens"
                  type="checkbox"
                />
              </label>
            </span>
            <span>Nome</span>
            <span>Categoria</span>
            <span>Qtd</span>
            <span>Unid.</span>
            <span aria-hidden="true" />
          </div>

          {products.map((product) => {
            const isBusy = isPending && pendingProductId === product.id;
            const checkboxId = `purchased-${product.id}`;

            return (
              <form
                className="products-grid-row"
                key={product.id}
                onSubmit={(event) => handleRowSubmit(event, product.id)}
              >
                <input type="hidden" name="listId" value={listId} />
                <input type="hidden" name="productId" value={product.id} />

                <div className="checkbox-cell" data-label="">
                  <label className="checkbox-hitarea" htmlFor={checkboxId}>
                    <input
                      aria-label="Comprado"
                      checked={product.purchased}
                      className="list-checkbox-input"
                      disabled={isBusy}
                      id={checkboxId}
                      onChange={(event) => handleCheckboxChange(product, event.target.checked)}
                      type="checkbox"
                    />
                  </label>
                </div>

                <div className="product-name-cell" data-label="Nome">
                  <div className="product-name-inline">
                    <input
                      className="input"
                      disabled={isBusy}
                      maxLength={120}
                      name="name"
                      onBlur={(event) => event.currentTarget.form?.requestSubmit()}
                      onKeyDown={handleFieldEnter}
                      defaultValue={product.name}
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
                    disabled={isBusy}
                    defaultValue={product.categoryId ?? "__NONE__"}
                    name="categoryId"
                    onBlur={(event) => event.currentTarget.form?.requestSubmit()}
                    onChange={(event) => event.currentTarget.form?.requestSubmit()}
                    onKeyDown={handleFieldEnter}
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
                    defaultValue={String(product.quantity)}
                    disabled={isBusy}
                    inputMode="decimal"
                    min="0.001"
                    name="quantity"
                    onBlur={(event) => event.currentTarget.form?.requestSubmit()}
                    onInput={(event) => {
                      event.currentTarget.value = normalizeQuantityInput(event.currentTarget.value);
                    }}
                    onKeyDown={handleQuantityKeyDown}
                    step="0.001"
                    type="text"
                  />
                </div>

                <div className="unit-cell" data-label="Unidade">
                  <select
                    className="input unit-input"
                    defaultValue={product.unit}
                    disabled={isBusy}
                    name="unit"
                    onBlur={(event) => event.currentTarget.form?.requestSubmit()}
                    onChange={(event) => event.currentTarget.form?.requestSubmit()}
                    onKeyDown={handleFieldEnter}
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
        <div
          className="modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
          role="presentation"
        >
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
                inputMode="numeric"
                name="paidPrice"
                onChange={(event) => {
                  const digits = extractDigits(event.target.value);
                  setPriceInput(formatBrlFromDigits(digits));
                }}
                placeholder="R$ 0,00"
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

      {bulkStep ? (
        <div
          className="modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeBulkModal();
            }
          }}
          role="presentation"
        >
          <div
            aria-labelledby="bulk-purchase-title"
            aria-modal="true"
            className="modal-card stack-md modal-card-wide"
            ref={bulkModalRef}
            role="dialog"
          >
            <div className="row-between">
              <h3 className="subheading" id="bulk-purchase-title">
                {bulkStep === "decision"
                  ? "Marcar todos como comprados"
                  : bulkStep === "unpurchase"
                    ? "Desmarcar todos como comprados"
                    : "Informar precos"}
              </h3>
              <button className="modal-close-button" onClick={closeBulkModal} type="button">
                X
              </button>
            </div>

            {bulkStep === "decision" ? (
              <>
                <p className="text-muted">
                  Deseja informar e salvar os precos pagos para estes produtos agora?
                </p>
                <div className="row-actions">
                  <button className="button" onClick={() => setBulkStep("prices")} type="button">
                    Sim, salvar precos
                  </button>
                  <button
                    className="button button-secondary"
                    onClick={() => runBulkPurchase(buildBulkItemsWithCurrentAndReferenceValues(), false)}
                    type="button"
                  >
                    Nao, apenas marcar
                  </button>
                </div>
              </>
            ) : bulkStep === "unpurchase" ? (
              <>
                <p className="text-muted">
                  Desmarcar todos como comprados? Isso removera os valores pagos desta lista.
                </p>
                <div className="row-actions">
                  <button className="button" onClick={runBulkUnpurchase} type="button">
                    Desmarcar todos
                  </button>
                  <button className="button button-secondary" onClick={closeBulkModal} type="button">
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="bulk-price-list">
                  {products.map((product) => (
                    <div className="bulk-price-row" key={product.id}>
                      <span className="bulk-price-name">{product.name}</span>
                      <input
                        className="input bulk-price-input"
                        inputMode="numeric"
                        onChange={(event) => {
                          const digits = extractDigits(event.target.value);
                          setBulkPriceInputs((current) => ({
                            ...current,
                            [product.id]: formatBrlFromDigits(digits),
                          }));
                        }}
                        placeholder="R$ 0,00"
                        value={bulkPriceInputs[product.id] ?? ""}
                      />
                    </div>
                  ))}
                </div>

                <div className="row-actions">
                  <button
                    className="button"
                    onClick={() => runBulkPurchase(buildBulkItemsFromModalValues(), true)}
                    type="button"
                  >
                    Salvar valores
                  </button>
                  <button className="button button-secondary" onClick={closeBulkModal} type="button">
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
