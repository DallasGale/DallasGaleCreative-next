import type {Project, HeroImageSet, HeroImage} from "@/types"

export type ProjectSlideData = Project & HeroImageSet[]

export type HeroDataType = {
  id: string
  image: HeroImage | HeroImageSet
  setName?: string
}
export interface SlideType {
  type: "card" | "image"
  data:
    | {
        id: string
        name?: string
        image?: HeroImage
      }
    | Project
}
