import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const subscribeSchema = z.object({
  email: z.string().trim().email().max(254),
  company: z.string().max(0).optional(),
});

export const subscribeToNewsletter = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => subscribeSchema.parse(input))
  .handler(async ({ data }) => {
    if (data.company) return { ok: true };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();
    const { error } = await supabaseAdmin.from("subscribers").upsert(
      {
        email,
        status: "active",
        source: "website",
      },
      { onConflict: "email" },
    );

    if (error) {
      console.error("Newsletter signup failed", error.message);
      throw new Error("We could not save your subscription. Please try again.");
    }

    return { ok: true };
  });
