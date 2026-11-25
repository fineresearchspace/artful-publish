import { type FormEvent, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscribeToNewsletter } from "@/lib/subscribers.functions";

export function NewsletterSignup() {
  const subscribe = useServerFn(subscribeToNewsletter);
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    try {
      await subscribe({ data: { email, company } });
      setEmail("");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm">
      <label htmlFor="newsletter-email" className="pixel-font text-[10px] text-muted-foreground">
        Newsletter
      </label>
      <div className="mt-2 flex gap-2">
        <Input
          id="newsletter-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          aria-describedby="newsletter-status"
          className="min-w-0 bg-background"
        />
        <Button type="submit" size="icon" disabled={status === "sending"} aria-label="Subscribe">
          <ArrowRight className="size-4" />
        </Button>
      </div>
      <input
        type="text"
        name="company"
        value={company}
        onChange={(event) => setCompany(event.target.value)}
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      <p id="newsletter-status" aria-live="polite" className="mt-2 text-xs text-muted-foreground">
        {status === "success"
          ? "You’re on the list."
          : status === "error"
            ? "Something went wrong. Please try again."
            : "Market context, delivered to your inbox."}
      </p>
    </form>
  );
}
