import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";
import { DashboardListsPanel } from "./dashboard-lists-panel";

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

      <DashboardListsPanel hasLoadError={Boolean(error)} lists={typedLists} />
    </main>
  );
}
