import type {Metadata} from "next"
import Image from "next/image"
import Link from "next/link"
import {getPublishedPosts} from "@src/data/blog"
import {formatDate} from "@src/lib/format-date"
import Layout from "./layout"
// import {focalStyle} from "@/lib/focal-point"

export const metadata: Metadata = {title: "Thoughts"}

export default async function Thoughts() {
  const posts = await getPublishedPosts()

  return (
    <main className="relative z-1 mx-auto flex w-full max-w-[800px] flex-col">
      {" "}
      <h1 className="mb-6 pt-30 text-5xl font-bold">Thoughts.</h1>
      {posts.length === 0 ? (
        <p className="text-foreground/70">No posts yet. Check back soon.</p>
      ) : (
        <ul className="block">
          {posts.map((post) => {
            // const cover =
            //   typeof post.coverImage === "object" ? post.coverImage : null
            return (
              <li key={post.id}>
                <Link href={`/thoughts/${post.slug}`} className="group block">
                  {/* {cover?.url && (
                    <div className="relative aspect-[1/1] overflow-hidden rounded-lg">
                      <Image
                        src={cover.url}
                        alt={cover.alt}
                        fill
                        sizes="(min-width: 640px) 50vw, 100vw"
                        className="object-cover transition group-hover:scale-105"
                        style={focalStyle(cover)}
                      />
                    </div>
                  )} */}
                  <h2 className="mt-4 text-2xl font-semibold group-hover:underline">
                    {post.title}
                  </h2>
                  {post.publishedAt && (
                    <p className="text-foreground/60 mt-1 text-sm">
                      {formatDate(post.publishedAt)}
                    </p>
                  )}
                  {/* {post.excerpt && (
                    <p className="text-foreground/70 mt-2">{post.excerpt}</p>
                  )} */}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
