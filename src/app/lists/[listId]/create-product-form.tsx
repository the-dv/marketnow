"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FormSubmitButton } from "@/components/form-submit-button";
import type { ProductFormState } from "./actions";

type CategoryRow = {
  id: string;
  name: string;
};

type CreateProductFormProps = {
  listId: string;
  categories: CategoryRow[];
  action: (state: ProductFormState, formData: FormData) => Promise<ProductFormState>;
};

export function CreateProductForm({
  listId,
  categories,
  action,
}: CreateProductFormProps) {
  const initialState: ProductFormState = { status: "idle", message: "" };
  const [state, formAction] = useActionState(action, initialState);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      nameInputRef.current?.focus();
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <form action={formAction} className="row-grid-user-product" ref={formRef}>
      <input type="hidden" name="listId" value={listId} />
      <input
        ref={nameInputRef}
        autoFocus
        className="input"
        name="productName"
        placeholder="Nome do produto"
        required
        onKeyDown={(event) => {
          if (event.key !== "Enter" || event.shiftKey) {
            return;
          }

          event.preventDefault();
          event.currentTarget.form?.requestSubmit();
        }}
      />
      <select className="input" name="categoryId" defaultValue="">
        <option value="">Sem categoria</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <select className="input" name="unit" defaultValue="un">
        <option value="un">un</option>
        <option value="kg">kg</option>
        <option value="L">L</option>
      </select>
      <FormSubmitButton idleText="Salvar produto" pendingText="Salvando..." />

      {state.status === "success" ? <p className="text-success form-feedback">{state.message}</p> : null}
      {state.status === "error" ? <p className="text-error form-feedback">{state.message}</p> : null}
    </form>
  );
}
