import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { getNewsletterPostBySlug } from "@/lib/newsletter";

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function NewsletterPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getNewsletterPostBySlug(slug) : undefined;

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-2">Issue not found</h1>
        <p className="text-muted-foreground mb-6">
          This newsletter issue doesn't exist or may have moved.
        </p>
        <Link to="/newsletter" className="underline">
          Back to Newsletter
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-2xl mx-auto px-4 py-12">
      <Link
        to="/newsletter"
        className="text-sm text-muted-foreground hover:underline mb-8 inline-block"
      >
        ← Back to Newsletter
      </Link>

      <header className="mb-8">
        <span className="text-sm text-muted-foreground">
          {formatDate(post.date)}
        </span>
        <h1 className="text-3xl font-bold mt-1">{post.title}</h1>
        {post.subtitle && (
          <p className="text-lg text-muted-foreground mt-2">{post.subtitle}</p>
        )}
      </header>

      {/* prose classes assume @tailwindcss/typography is installed;
          swap for your own article styling if not */}
      <div className="prose prose-neutral max-w-none">
        <ReactMarkdown>{post.body}</ReactMarkdown>
      </div>
    </article>
  );
}
