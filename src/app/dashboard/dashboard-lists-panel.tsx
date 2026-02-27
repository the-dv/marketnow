"use client";

import { FormEvent, KeyboardEvent, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
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

  function handleCardClick(list: ShoppingListRow) {
    if (list.status !== "active") {
      return;
    }

    router.push(`/lists/${list.id}`);
  }

  function handleCardKeyDown(event: KeyboardEvent<HTMLElement>, list: ShoppingListRow) {
    if (list.status !== "active") {
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    router.push(`/lists/${list.id}`);
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
          <Button className="btn-create-list" disabled={pendingCreate} size="lg" type="submit">
            {pendingCreate ? "Criando..." : "Criar lista"}
          </Button>
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
            <article
              className={`list-card ${isArchived ? "list-card-archived" : "list-card-clickable"}`}
              key={list.id}
              onClick={isArchived ? undefined : () => handleCardClick(list)}
              onKeyDown={isArchived ? undefined : (event) => handleCardKeyDown(event, list)}
              role={isArchived ? undefined : "link"}
              tabIndex={isArchived ? -1 : 0}
            >
              <div className={`list-card-main ${isArchived ? "list-card-main-disabled" : ""} stack-sm`}>
                <h3>{list.name}</h3>
                <p className="text-muted">
                  Status: <strong>{isArchived ? "Arquivada" : "Ativa"}</strong>
                </p>
              </div>

              <div className="row-actions" onClick={(event) => event.stopPropagation()}>
                <Button
                  className="btn-list-action"
                  disabled={isBusy}
                  onClick={() => handleToggleStatus(list.id, nextStatus)}
                  type="button"
                  variant="dark"
                >
                  {isBusy ? "Salvando..." : list.status === "active" ? "Arquivar" : "Reativar"}
                </Button>
                <IconButton
                  aria-label={`Excluir lista ${list.name}`}
                  disabled={isBusy}
                  icon={<Trash2 size={16} />}
                  onClick={() => handleDeleteList(list.id)}
                  tooltip="Excluir lista"
                  variant="danger"
                />
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}
