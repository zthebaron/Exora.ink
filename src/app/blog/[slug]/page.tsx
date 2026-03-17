import { notFound } from "next/navigation";
import Link from "next/link";
import { blogPosts, getPostBySlug } from "@/content/blog/posts";
import { ArrowLeft, Clock, Calendar, Tag } from "lucide-react";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };
  return {
    title: `${post.title} — Exora.ink Blog`,
    description: post.excerpt,
  };
}

function renderMarkdown(content: string) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  let tableRows: string[][] = [];
  let tableHeaders: string[] = [];
  let inTable = false;

  function flushTable() {
    if (tableHeaders.length === 0) return null;
    const table = (
      <div key={`table-${i}`} className="my-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-border">
              {tableHeaders.map((h, idx) => (
                <th
                  key={idx}
                  className="px-4 py-2 text-left font-semibold text-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, rIdx) => (
              <tr
                key={rIdx}
                className={rIdx % 2 === 0 ? "" : "bg-muted/30"}
              >
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className="border-b border-border/50 px-4 py-2 text-muted-foreground"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableHeaders = [];
    tableRows = [];
    inTable = false;
    return table;
  }

  while (i < lines.length) {
    const line = lines[i];

    // Table detection
    if (line.startsWith("|") && line.endsWith("|")) {
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());

      if (!inTable) {
        tableHeaders = cells;
        inTable = true;
        i++;
        // Skip separator row
        if (i < lines.length && lines[i].match(/^\|[\s\-:|]+\|$/)) {
          i++;
        }
        continue;
      } else {
        tableRows.push(cells);
        i++;
        continue;
      }
    } else if (inTable) {
      const tableEl = flushTable();
      if (tableEl) elements.push(tableEl);
    }

    // Headings
    if (line.startsWith("### ")) {
      elements.push(
        <h3
          key={i}
          className="mb-3 mt-8 text-lg font-semibold text-foreground"
        >
          {line.slice(4)}
        </h3>
      );
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={i}
          className="mb-4 mt-10 text-2xl font-bold text-foreground"
        >
          {line.slice(3)}
        </h2>
      );
      i++;
      continue;
    }

    // Ordered list
    if (line.match(/^\d+\.\s/)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        listItems.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="my-4 ml-6 list-decimal space-y-2">
          {listItems.map((item, idx) => (
            <li key={idx} className="text-muted-foreground leading-relaxed">
              <InlineMarkdown text={item} />
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Unordered list
    if (line.startsWith("- ")) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        listItems.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="my-4 ml-6 list-disc space-y-2">
          {listItems.map((item, idx) => (
            <li key={idx} className="text-muted-foreground leading-relaxed">
              <InlineMarkdown text={item} />
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph
    elements.push(
      <p key={i} className="my-4 text-muted-foreground leading-relaxed">
        <InlineMarkdown text={line} />
      </p>
    );
    i++;
  }

  // Flush any remaining table
  if (inTable) {
    const tableEl = flushTable();
    if (tableEl) elements.push(tableEl);
  }

  return elements;
}

function InlineMarkdown({ text }: { text: string }) {
  // Bold
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, idx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={idx} className="font-semibold text-foreground">
              {part.slice(2, -2)}
            </strong>
          );
        }
        // Italic
        const italicParts = part.split(/(\*[^*]+\*)/g);
        return italicParts.map((ip, iIdx) => {
          if (ip.startsWith("*") && ip.endsWith("*") && !ip.startsWith("**")) {
            return (
              <em key={`${idx}-${iIdx}`} className="italic">
                {ip.slice(1, -1)}
              </em>
            );
          }
          return <span key={`${idx}-${iIdx}`}>{ip}</span>;
        });
      })}
    </>
  );
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const currentIndex = blogPosts.findIndex((p) => p.slug === slug);
  const prevPost = currentIndex > 0 ? blogPosts[currentIndex - 1] : null;
  const nextPost =
    currentIndex < blogPosts.length - 1 ? blogPosts[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero gradient */}
      <div
        className={`bg-gradient-to-br ${post.gradient} px-6 py-16 sm:py-20`}
      >
        <div className="mx-auto max-w-3xl">
          <Link
            href="/blog"
            className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-sm text-white backdrop-blur-sm transition-colors hover:bg-white/30"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All Posts
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>
          <p className="mt-4 text-lg text-white/80 leading-relaxed">
            {post.excerpt}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-white/70">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {new Date(post.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {post.readTime} min read
            </span>
            <span className="flex items-center gap-1.5">
              <Tag className="h-4 w-4" />
              {post.category}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <article className="mx-auto max-w-3xl px-6 py-10">
        <div className="prose-custom">{renderMarkdown(post.content)}</div>

        {/* Tags */}
        <div className="mt-12 border-t border-border pt-6">
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Prev / Next */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {prevPost ? (
            <Link
              href={`/blog/${prevPost.slug}`}
              className="group rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
            >
              <span className="text-xs text-muted-foreground">
                &larr; Previous
              </span>
              <p className="mt-1 text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                {prevPost.title}
              </p>
            </Link>
          ) : (
            <div />
          )}
          {nextPost ? (
            <Link
              href={`/blog/${nextPost.slug}`}
              className="group rounded-xl border border-border bg-card p-5 text-right transition-shadow hover:shadow-md"
            >
              <span className="text-xs text-muted-foreground">
                Next &rarr;
              </span>
              <p className="mt-1 text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                {nextPost.title}
              </p>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </article>
    </div>
  );
}
