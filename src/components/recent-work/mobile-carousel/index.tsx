"use client"

import projectsData from "@/data/recent-projects.json"
import type {Project} from "@/types"
import {type ProjectSlideData} from "./types"
import ProjectSlides from "./project-slides"

const projects = projectsData as Project[]

const MobileCarousel = () => {
  return (
    <section id="recent-work" className="flex w-full flex-col py-8">
      {projects.map((project, index) => (
        <ProjectSlides
          key={project.id}
          project={project as ProjectSlideData}
          isFirst={index === 0}
        />
      ))}
    </section>
  )
}

export default MobileCarousel
