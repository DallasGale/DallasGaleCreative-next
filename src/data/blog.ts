// import {cacheLife, cacheTag} from "next/cache"
import {getCms} from "@src/lib/cms"
import type {Post} from "../../payload-types"

/** Published posts, newest first. Drafts never reach the public site. */
export async function getPublishedPosts(): Promise<Post[]> {
  // "use cache"
  // cacheTag("posts")
  // cacheLife("minutes")

  const cms = await getCms()
  const {docs} = await cms.find({
    collection: "posts",
    // where: {status: {equals: "published"}}, 
    // sort: "-publishedAt",
    limit: 100,
    depth: 1,
  })
  return docs
}

export async function getPublishedPost(slug: string): Promise<Post | undefined> {
  // "use cache"
  // cacheTag("posts")
  // cacheLife("minutes")

  const cms = await getCms()
  const {docs} = await cms.find({
    collection: "posts",
    // where: {and: [{slug: {equals: slug}}, {status: {equals: "published"}}]},
    limit: 1,
    depth: 1,
  })
  return docs[0]
}
