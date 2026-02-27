"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DeleteIconButton } from "@/components/delete-icon-button";
import { useToast } from "@/components/toast-provider";
import type { DashboardActionResult } from "./actions";
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

type DashboardListsPanelProps = {
  lists: ShoppingListRow[];
  hasLoadError: boolean;
};

function buildListFormData(listId: string, status?: "active" | "archived") {
  const formData = new FormData();
  formData.append("listId", listId);
  if (status) {
    formData.append("status", status);
  }
  return formData;
}

export function DashboardListsPanel({ lists, hasLoadError }: DashboardListsPanelProps) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [newListName, setNewListName] = useState("");
  const [pendingCreate, setPendingCreate] = useState(false);
  const [pendingListId, setPendingListId] = useState<string | null>(null);

  const listCountLabel = useMemo(() => `${lists.length} lista(s)`, [lists.length]);

  async function runAndToast(action: Promise<DashboardActionResult>) {
    const result = await action;
    pushToast({ kind: result.status, message: result.message });

    if (result.status === "success") {
      router.refresh();
    }
  }

  async function handleCreateList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = newListName.trim();
    if (!trimmedName) {
      pushToast({ kind: "error", message: "Informe um nome de lista valido." });
      return;
    }

    setPendingCreate(true);
    const formData = new FormData();
    formData.append("name", trimmedName);
    await runAndToast(createShoppingListAction(formData));
    setPendingCreate(false);
    setNewListName("");
  }

  async function handleToggleStatus(listId: string, nextStatus: "active" | "archived") {
    const confirmationMessage =
      nextStatus === "archived"
        ? "Arquivar esta lista? Voce podera reativar depois."
        : "Reativar esta lista?";
    const confirmed = window.confirm(confirmationMessage);
    if (!confirmed) {
      return;
    }

    setPendingListId(listId);
    await runAndToast(toggleShoppingListStatusAction(buildListFormData(listId, nextStatus)));
    setPendingListId(null);
  }

  async function handleDeleteList(listId: string) {
    const confirmed = window.confirm(
      "Excluir esta lista permanentemente? Esta acao nao pode ser desfeita.",
    );
    if (!confirmed) {
      return;
    }

    setPendingListId(listId);
    await runAndToast(deleteShoppingListAction(buildListFormData(listId)));
    setPendingListId(null);
  }

  return (
    <>
      <section className="card stack-sm">
        <h2 className="subheading">Nova lista</h2>
        <form className="row-form" onSubmit={handleCreateList}>
          <input
            className="input"
            maxLength={120}
            minLength={2}
            name="name"
            onChange={(event) => setNewListName(event.target.value)}
            placeholder="Ex.: Compra da semana"
            required
            type="text"
            value={newListName}
          />
          <button className="button button-nowrap" disabled={pendingCreate} type="submit">
            {pendingCreate ? "Criando..." : "Criar lista"}
          </button>
        </form>
      </section>

      <section className="card stack-sm">
        <div className="row-between">
          <h2 className="subheading">Minhas listas</h2>
          <span className="text-muted">{listCountLabel}</span>
        </div>

        {hasLoadError ? (
          <p className="text-error">
            Nao foi possivel carregar listas. Aplique o schema SQL no Supabase e tente novamente.
          </p>
        ) : null}

        {!hasLoadError && lists.length === 0 ? (
          <p className="text-muted">Nenhuma lista criada ainda.</p>
        ) : null}

        {lists.map((list) => {
          const nextStatus = list.status === "active" ? "archived" : "active";
          const isArchived = list.status === "archived";
          const isBusy = pendingListId === list.id;

          return (
            <article className={`list-card ${isArchived ? "list-card-archived" : ""}`} key={list.id}>
              {isArchived ? (
                <div className="list-card-main list-card-main-disabled stack-sm">
                  <h3>{list.name}</h3>
                  <p className="text-muted">
                    Status: <strong>Arquivada</strong>
                  </p>
                </div>
              ) : (
                <Link className="list-card-main list-card-main-clickable stack-sm" href={`/lists/${list.id}`}>
                  <h3>{list.name}</h3>
                  <p className="text-muted">
                    Status: <strong>Ativa</strong>
                  </p>
                </Link>
              )}

              <div className="row-actions">
                <button
                  className="button button-secondary button-nowrap"
                  disabled={isBusy}
                  onClick={() => handleToggleStatus(list.id, nextStatus)}
                  type="button"
                >
                  {isBusy ? "Salvando..." : list.status === "active" ? "Arquivar" : "Reativar"}
                </button>
                <DeleteIconButton
                  disabled={isBusy}
                  label={`Excluir lista ${list.name}`}
                  onClick={() => handleDeleteList(list.id)}
                  title="Excluir lista"
                />
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}
