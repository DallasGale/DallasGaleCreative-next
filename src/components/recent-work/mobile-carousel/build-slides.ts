import type {HeroImage, HeroImageSet, Project} from "@/types"
import type {SlideType} from "./types"

const BuildSlides = (project: Project) => {
  const slides: SlideType[] = [{type: "card", data: project}]
  const heroImageSets: HeroImageSet[] | undefined = project.heroImageSets
  const heroImages: HeroImage[] | undefined = project.heroImages
  console.log({heroImageSets, heroImages})

  if (heroImageSets && heroImageSets.length > 0) {
    heroImageSets.forEach((set) => {
      set.images.forEach((image) => {
        slides.push({
          type: "image",
          data: {id: set.id, image, name: set.name},
        })
      })
    })
  } else if (heroImages && heroImages.length > 0) {
    heroImages.forEach((image) => {
      slides.push({type: "image", data: {id: image.id, image}})
    })
  }

  return slides
}
export default BuildSlides
