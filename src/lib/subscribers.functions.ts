import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const subscribeSchema = z.object({
  email: z.string().trim().email().max(254),
  company: z.string().max(200).optional(),
});

export const subscribeToNewsletter = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => subscribeSchema.parse(input))
  .handler(async ({ data }) => {
    if (data.company) return { ok: true };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();
    const { data: existing, error: lookupError } = await supabaseAdmin
      .from("subscribers")
      .select("id,status")
      .eq("email", email)
      .maybeSingle();

    if (lookupError) {
      console.error("Newsletter signup lookup failed", lookupError.message);
      throw new Error("We could not save your subscription. Please try again.");
    }

    const { error } = existing
      ? await supabaseAdmin
          .from("subscribers")
          .update({ status: "active" })
          .eq("id", existing.id)
      : await supabaseAdmin.from("subscribers").insert({
          email,
          status: "active",
          source: "website",
        });

    if (error) {
      console.error("Newsletter signup failed", error.message);
      throw new Error("We could not save your subscription. Please try again.");
    }

    return { ok: true };
  });
