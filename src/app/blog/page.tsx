import Link from "next/link";
import Image from "next/image";
import { blogPosts, getAllCategories } from "@/content/blog/posts";
import {
  Printer,
  Scale,
  LayoutGrid,
  DollarSign,
  Cpu,
  Sparkles,
  Palette,
  Rocket,
  Film,
  Thermometer,
  Monitor,
  Wrench,
  Puzzle,
  Contrast,
  TrendingUp,
  Shield,
  Zap,
  Target,
  Users,
  Package,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Printer,
  Scale,
  LayoutGrid,
  DollarSign,
  Cpu,
  Sparkles,
  Palette,
  Rocket,
  Film,
  Thermometer,
  Monitor,
  Wrench,
  Puzzle,
  Contrast,
  TrendingUp,
  Shield,
  Zap,
  Target,
  Users,
  Package,
};

export const metadata = {
  title: "Blog — Exora.ink DTF Printing Intelligence",
  description:
    "The latest insights on DTF printing technology, gang sheet optimization, pricing strategies, equipment reviews, and industry trends.",
};

export default function BlogPage() {
  const categories = getAllCategories();
  const featured = blogPosts[0];
  const rest = blogPosts.slice(1);

  const FeaturedIcon = iconMap[featured.icon] ?? Printer;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            DTF Printing Blog
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            Expert guides on DTF printing technology, gang sheet optimization,
            pricing strategies, equipment reviews, and industry trends.
          </p>
          {/* Category pills */}
          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <span
                key={cat}
                className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Featured Post */}
        <Link
          href={`/blog/${featured.slug}`}
          className="group mb-12 block overflow-hidden rounded-2xl border border-border shadow-sm transition-shadow hover:shadow-md"
        >
          <div
            className={`relative flex items-center justify-center bg-gradient-to-br ${featured.gradient} px-10 py-16`}
          >
            {featured.image ? (
              <Image
                src={featured.image}
                alt={featured.title}
                fill
                className="object-cover"
                sizes="(max-width: 1200px) 100vw, 1200px"
              />
            ) : (
              <FeaturedIcon className="h-20 w-20 text-white/30" />
            )}
            <span className="absolute right-4 top-4 z-10 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              Featured
            </span>
          </div>
          <div className="bg-card p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary">
                {featured.category}
              </span>
              <time>{new Date(featured.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</time>
              <span>{featured.readTime} min read</span>
            </div>
            <h2 className="mt-3 text-2xl font-bold text-foreground group-hover:text-primary transition-colors sm:text-3xl">
              {featured.title}
            </h2>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              {featured.excerpt}
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {featured.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </Link>

        {/* Post Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => {
            const PostIcon = iconMap[post.icon] ?? Printer;
            return (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
              >
                <div
                  className={`relative flex items-center justify-center bg-gradient-to-br ${post.gradient} py-10`}
                >
                  {post.image ? (
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <PostIcon className="h-12 w-12 text-white/30" />
                  )}
                </div>
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                      {post.category}
                    </span>
                    <time>
                      {new Date(post.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </time>
                    <span>{post.readTime} min</span>
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                    {post.excerpt}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
