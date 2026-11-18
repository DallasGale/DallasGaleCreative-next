import sharp from "sharp"
import {lexicalEditor} from "@payloadcms/richtext-lexical"
import {postgresAdapter} from "@payloadcms/db-postgres"

import {buildConfig} from "payload"
import {Posts} from "@src/collections/posts"

export default buildConfig({
  // If you'd like to use Rich Text, pass your editor here
  editor: lexicalEditor(),

  admin: {
    livePreview: {
      url: ({data, collectionConfig, locale}) =>
        `${data.tenant.url}${
          collectionConfig?.slug === "posts"
            ? `/thoughts/${data.slug}`
            : `${data.slug !== "home" ? `/${data.slug}` : ""}`
        }${locale ? `?locale=${locale?.code}` : ""}`, // Localization query param
      collections: ["pages"],
    },
  },
  // Define and configure your collections in this array
  collections: [Posts],

  // Your Payload secret - should be a complex and secure string, unguessable
  secret: process.env.PAYLOAD_SECRET || "",
  // Whichever Database Adapter you're using should go here
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
  }),
  // If you want to resize images, crop, set focal point, etc.
  // make sure to install it and pass it to the config.
  // This is optional - if you don't need to do these things,
  // you don't need it!
  sharp,
})
