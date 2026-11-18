import type {CollectionConfig} from "payload"

export const Posts: CollectionConfig = {
  slug: "posts",
  admin: {
    useAsTitle: "title",
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
