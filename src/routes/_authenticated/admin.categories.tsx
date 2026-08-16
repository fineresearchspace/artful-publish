import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchCategories } from "@/lib/admin-articles";
import { slugify } from "@/lib/articles";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: AdminCategories,
});

function AdminCategories() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["categories"] });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("categories").insert({
        name: name.trim(),
        slug: slugify(name),
        description: description.trim(),
        sort_order: categories.length + 1,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      setName("");
      setDescription("");
      toast.success("Category added");
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async (input: { id: string; description: string }) => {
      const { error } = await supabase
        .from("categories")
        .update({ description: input.description } as never)
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saved");
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Category removed");
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <h1 className="pixel-font text-lg text-ink">Categories</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) add.mutate();
        }}
        className="pixel-frame mt-6 space-y-3 p-5"
      >
        <p className="pixel-font text-[10px] text-primary">New category</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-full border-2 border-ink bg-paper px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description"
          className="w-full border-2 border-ink bg-paper px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          className="pixel-frame-sm pixel-lift pixel-font bg-primary px-4 py-2 text-[11px] text-primary-foreground"
        >
          Add category
        </button>
      </form>

      <ul className="mt-8 divide-y-2 divide-ink border-2 border-ink bg-paper">
        {categories.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <span className="pixel-font w-40 text-[11px]">{c.name}</span>
            <input
              defaultValue={c.description}
              onBlur={(e) => {
                if (e.target.value !== c.description) {
                  update.mutate({ id: c.id, description: e.target.value });
                }
              }}
              className="min-w-0 flex-1 border-2 border-ink bg-background px-2 py-1 text-sm outline-none focus:border-primary"
            />
            <button
              aria-label={`Delete ${c.name}`}
              onClick={() => {
                if (confirm(`Remove category "${c.name}"?`)) remove.mutate(c.id);
              }}
              className="pixel-frame-sm p-2 text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
