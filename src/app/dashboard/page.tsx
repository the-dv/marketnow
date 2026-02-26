import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FormSubmitButton } from "@/components/form-submit-button";
import { SignOutButton } from "./sign-out-button";
import {
  createShoppingListAction,
  deleteShoppingListAction,
  toggleShoppingListStatusAction,
} from "./actions";

type ShoppingListRow = {
  id: string;
  name: string;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
};

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: shoppingLists, error } = await supabase
    .from("shopping_lists")
    .select("id,name,status,created_at,updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const typedLists = (shoppingLists ?? []) as ShoppingListRow[];

  return (
    <main className="container stack-lg">
      <section className="card stack-sm">
        <div className="row-between">
          <h1 className="heading">Dashboard</h1>
          <SignOutButton />
        </div>
        <p>
          Sessao ativa para <strong>{user.email}</strong>.
        </p>
      </section>

      <section className="card stack-sm">
        <h2 className="subheading">Nova lista</h2>
        <form action={createShoppingListAction} className="row-form">
          <input
            className="input"
            type="text"
            name="name"
            placeholder="Ex.: Compra da semana"
            minLength={2}
            maxLength={120}
            required
          />
          <FormSubmitButton idleText="Criar lista" pendingText="Criando..." />
        </form>
      </section>

      <section className="card stack-sm">
        <div className="row-between">
          <h2 className="subheading">Minhas listas</h2>
          <span className="text-muted">{typedLists.length} lista(s)</span>
        </div>

        {error ? (
          <p className="text-error">
            Nao foi possivel carregar listas. Aplique o schema SQL no Supabase e tente novamente.
          </p>
        ) : null}

        {!error && typedLists.length === 0 ? (
          <p className="text-muted">Nenhuma lista criada ainda.</p>
        ) : null}

        {typedLists.map((list) => {
          const nextStatus = list.status === "active" ? "archived" : "active";

          return (
            <article className="list-card" key={list.id}>
              <div className="stack-sm">
                <h3>{list.name}</h3>
                <p className="text-muted">
                  Status: <strong>{list.status === "active" ? "Ativa" : "Arquivada"}</strong>
                </p>
              </div>

              <div className="row-actions">
                <Link className="button" href={`/lists/${list.id}`}>
                  Abrir
                </Link>
                <form action={toggleShoppingListStatusAction}>
                  <input type="hidden" name="listId" value={list.id} />
                  <input type="hidden" name="status" value={nextStatus} />
                  <FormSubmitButton
                    className="button button-secondary"
                    idleText={list.status === "active" ? "Arquivar" : "Reativar"}
                    pendingText="Salvando..."
                  />
                </form>
                <form action={deleteShoppingListAction}>
                  <input type="hidden" name="listId" value={list.id} />
                  <FormSubmitButton
                    className="button button-danger"
                    idleText="Excluir"
                    pendingText="Excluindo..."
                  />
                </form>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
