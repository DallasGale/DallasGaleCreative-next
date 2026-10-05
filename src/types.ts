export type Employer = {
  id: number
  name: string
  url: string
  logo: string
  status: "past" | "current"
  location: string
}

// export type EmployersData = {
//   agencies: Employer[]
//   organisations: Employer[]
//   startups: Employer[]
// }

export type ProjectLink = {
  label: string
  url: string
  urlLabel: string
  archived?: boolean
}

export type PressLink = {
  label: string
  url: string
}

export type Project = {
  id: number
  employer: {
    name: string
    url: string
    urlLabel: string
  }
  meta: {
    date: string
    jobType: string
  }
  logo: {
    path: string
    alt: string
  }
  heroImages?: HeroImages[]
  heroImageSets?: HeroImageSet[]
  summary: string
  keyTakeaways: string
  paragraphs: {text: string}[]
  links: ProjectLink[]
  press: PressLink[]
}

export type HeroImages = {
  path: string
  alt: string
}

export type HeroImageSet = {
  name: string
  images: HeroImages[]
}

export type DaySegment = "morning" | "afternoon" | "evening"
