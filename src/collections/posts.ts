import {revalidatePath} from "next/cache"
import type {CollectionConfig} from "payload"

/** Refresh the cached public pages for a post whenever it changes. */
function revalidatePost(slugs: (string | undefined)[]) {
  try {
    revalidatePath("/thoughts")
    for (const slug of new Set(slugs)) {
      if (slug) revalidatePath(`/thoughts/${slug}`)
    }
  } catch (err) {
    // Outside a Next.js request (e.g. the Payload CLI), there is no cache to clear.
    console.warn("Revalidation skipped:", err)
  }
}

export const Posts: CollectionConfig = {
  slug: "posts",
  admin: {
    useAsTitle: "title",
  },
  hooks: {
    afterChange: [
      ({doc, previousDoc}) => {
        // Include the previous slug so a renamed post's old URL is refreshed too.
        revalidatePost([doc.slug, previousDoc?.slug])
        return doc
      },
    ],
    afterDelete: [
      ({doc}) => {
        revalidatePost([doc.slug])
      },
    ],
  },
  fields: [
    {
      name: "title",
      type: "text",
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        position: "sidebar",
        description:
          "Used in the post's web address. Filled in from the title if left empty.",
      },
    },
    {
      name: "content",
      type: "richText",
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "draft",
      options: [
        {label: "Draft", value: "draft"},
        {label: "Published", value: "published"},
      ],
      admin: {position: "sidebar"},
    },
    {
      name: "publishedAt",
      type: "date",
      admin: {
        position: "sidebar",
        date: {pickerAppearance: "dayOnly"},
      },
    },
  ],
}
