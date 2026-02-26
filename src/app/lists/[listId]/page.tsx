import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FormSubmitButton } from "@/components/form-submit-button";
import { mapUfToMacroRegion } from "@/services/location-service";
import { estimateListTotal } from "@/services/pricing-service";
import {
  createUserProductAction,
  deleteListItemAction,
  markListItemPurchasedAction,
  updateListItemAction,
} from "./actions";
import { CreateProductForm } from "./create-product-form";

type ListRow = {
  id: string;
  name: string;
  status: "active" | "archived";
};

type CategoryRow = {
  id: string;
  name: string;
};

const SUGGESTION_LABEL: Record<string, string> = {
  user_last_price: "baseado no seu ultimo preco",
  user_avg_price: "baseado na sua media historica",
  seed_state: "fallback seed por UF",
  seed_macro_region: "fallback seed por macro-regiao",
  seed_national: "fallback seed nacional",
  unavailable: "sem sugestao disponivel",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default async function ListDetailsPage({
  params,
}: {
  params: Promise<{ listId: string }>;
}) {
  const { listId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: listData } = await supabase
    .from("shopping_lists")
    .select("id,name,status")
    .eq("id", listId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!listData) {
    notFound();
  }

  const list = listData as ListRow;

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_uf")
    .eq("id", user.id)
    .maybeSingle();

  const regionContext = {
    country: "BR" as const,
    uf: profile?.preferred_uf?.toUpperCase(),
    macroRegion: mapUfToMacroRegion(profile?.preferred_uf ?? undefined),
  };

  const estimate = await estimateListTotal(listId, regionContext);

  const { data: categories } = await supabase
    .from("categories")
    .select("id,name")
    .order("name", { ascending: true });

  const typedCategories = (categories ?? []) as CategoryRow[];

  return (
    <main className="container stack-lg">
      <section className="card stack-sm">
        <div className="row-between">
          <h1 className="heading">{list.name}</h1>
          <Link className="button button-secondary" href="/dashboard">
            Voltar
          </Link>
        </div>
        <div className="row-status">
          <span className="text-muted">Status:</span>
          <span className="status-badge">{list.status === "active" ? "Ativa" : "Arquivada"}</span>
        </div>
      </section>

      <section className="card stack-sm">
        <div className="row-between">
          <h2 className="subheading">Total estimado</h2>
          <strong>{formatCurrency(estimate.estimatedTotal)}</strong>
        </div>
        <p className="text-muted">
          Prioridade da sugestao: ultimo preco do usuario -&gt; media do usuario -&gt; seed
          regional/nacional.
        </p>
      </section>

      <section className="card stack-sm">
        <h2 className="subheading">Cadastrar produto</h2>
        <CreateProductForm
          action={createUserProductAction}
          categories={typedCategories}
          listId={listId}
        />
      </section>

      <section className="card stack-sm">
        <div className="row-between">
          <h2 className="subheading">Itens da lista</h2>
          <span className="text-muted">{estimate.items.length} item(ns)</span>
        </div>

        {estimate.items.length === 0 ? <p className="text-muted">Nenhum item adicionado.</p> : null}

        {estimate.items.map((item) => (
          <article className="item-card" key={item.itemId}>
            <div className="row-between">
              <div className="stack-sm">
                <strong>{item.productName}</strong>
                {item.isPriceAvailable ? (
                  <>
                    <span className="text-muted">
                      Sugestao: {formatCurrency(item.unitPrice)} (
                      {SUGGESTION_LABEL[item.suggestedPriceOrigin]})
                    </span>
                    <span className="text-muted">
                      Subtotal estimado: {formatCurrency(item.itemTotal)} ({item.quantity} {item.unit})
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-warning">
                      Sugestao indisponivel para este item ({SUGGESTION_LABEL[item.suggestedPriceOrigin]}).
                    </span>
                    <span className="text-muted">
                      Informe o preco real ao marcar como comprado para criar referencia futura.
                    </span>
                  </>
                )}
                {item.paidPrice ? (
                  <span className="text-success">Preco real pago: {formatCurrency(item.paidPrice)}</span>
                ) : null}
              </div>
            </div>

            <form action={updateListItemAction} className="row-grid">
              <input type="hidden" name="listId" value={listId} />
              <input type="hidden" name="itemId" value={item.itemId} />
              <input type="hidden" name="productId" value={item.productId} />

              <div className="stack-sm">
                <span className="text-muted">Ajustar quantidade/unidade</span>
              </div>
              <input
                className="input"
                type="number"
                name="quantity"
                min="0.001"
                step="0.001"
                defaultValue={String(item.quantity)}
                required
              />
              <select className="input" name="unit" defaultValue={item.unit} required>
                <option value="un">un</option>
                <option value="kg">kg</option>
                <option value="L">L</option>
              </select>
              <div className="row-actions">
                <FormSubmitButton idleText="Salvar" pendingText="Salvando..." />
              </div>
            </form>

            <details className="purchase-drawer">
              <summary className="summary-line">
                <label className="checkline">
                  <input type="checkbox" checked={Boolean(item.purchasedAt)} readOnly />
                  <span>{item.purchasedAt ? "Comprado (editar valor)" : "Marcar como comprado"}</span>
                </label>
              </summary>
              <form action={markListItemPurchasedAction} className="stack-sm purchase-content">
                <input type="hidden" name="listId" value={listId} />
                <input type="hidden" name="itemId" value={item.itemId} />

                <label className="label" htmlFor={`paidPrice-${item.itemId}`}>
                  Voce pagou quanto?
                </label>
                <input
                  className="input"
                  id={`paidPrice-${item.itemId}`}
                  name="paidPrice"
                  type="number"
                  min="0.01"
                  step="0.01"
                  defaultValue={item.paidPrice ? String(item.paidPrice) : ""}
                  required
                />

                <label className="checkline">
                  <input type="checkbox" name="saveReference" />
                  Salvar este valor para usar como referencia futura
                </label>

                <FormSubmitButton idleText="Confirmar compra" pendingText="Confirmando..." />
              </form>
            </details>

            <form action={deleteListItemAction} className="row-actions">
              <input type="hidden" name="listId" value={listId} />
              <input type="hidden" name="itemId" value={item.itemId} />
              <FormSubmitButton
                className="button button-danger"
                idleText="Remover"
                pendingText="Removendo..."
              />
            </form>
          </article>
        ))}
      </section>
    </main>
  );
}
