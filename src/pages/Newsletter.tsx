import { Link } from "react-router-dom";
import { getAllNewsletterPosts } from "@/lib/newsletter";

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Newsletter() {
  const posts = getAllNewsletterPosts();

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <header className="mb-10">
        {/* TODO: swap for your actual site header/nav */}
        <h1 className="text-3xl font-bold mb-2">Newsletter</h1>
        <p className="text-muted-foreground">
          {posts.length} issues, from {formatDate(posts[posts.length - 1]?.date)} to{" "}
          {formatDate(posts[0]?.date)}.
        </p>
      </header>

      <ul className="flex flex-col divide-y divide-border">
        {posts.map((post) => (
          <li key={post.slug} className="py-6">
            <Link to={`/newsletter/${post.slug}`} className="group block">
              <span className="text-sm text-muted-foreground">
                {formatDate(post.date)}
              </span>
              <h2 className="text-xl font-semibold mt-1 group-hover:underline">
                {post.title}
              </h2>
              {post.subtitle && (
                <p className="text-muted-foreground mt-1">{post.subtitle}</p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
