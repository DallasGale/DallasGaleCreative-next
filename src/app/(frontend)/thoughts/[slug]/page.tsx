import type {Metadata} from "next"
import Link from "next/link"
import {notFound} from "next/navigation"
import {RichText} from "@payloadcms/richtext-lexical/react"
import {getPublishedPost, getPublishedPosts} from "@src/data/blog"

// import {formatDate} from "@src/lib/format-date"
// import {richTextConverters} from "@src/components/rich-text/converters"
// import {focalStyle} from "@src/lib/focal-point"

export async function generateStaticParams() {
  const posts = await getPublishedPosts()
  return posts.map((post) => ({slug: post.slug}))
}

export async function generateMetadata({
  params,
}: PageProps<"/thoughts/[slug]">): Promise<Metadata> {
  const post = await getPublishedPost((await params).slug)
  return {title: post?.title ?? "Thoughts"}
}

export default async function BlogPostPage({
  params,
}: PageProps<"/thoughts/[slug]">) {
  const post = await getPublishedPost((await params).slug)
  if (!post) notFound()

  // const cover = typeof post.coverImage === "object" ? post.coverImage : null

  console.log({post})
  return (
    <article className="mx-auto w-full max-w-4xl">
      {/* <h1 className="sticky top-30 left-0 ml-8 text-6xl font-black">
          Thoughts.
        </h1> */}
      <section className="m-auto flex w-full max-w-[700px] flex-col items-start justify-start py-40 pb-90 text-left">
        <div className="flex w-full flex-col gap-10 rounded-2xl border-1 border-[rgba(255,255,255,0.25)] p-10">
          <h1 className="text-4xl font-bold">{post.title}</h1>

          {post.content && (
            <div className="rich-text text-wrap">
              <RichText data={post.content} />
            </div>
          )}
        </div>
      </section>
    </article>
  )
}
