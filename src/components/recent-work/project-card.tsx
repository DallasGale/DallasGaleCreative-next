/** biome-ignore-all lint/security/noDangerouslySetInnerHtml: <explanation> */
import Image from "next/image"
import type {Project} from "@/types"
import {ChevronForward} from "../icons"

const ProjectCard = ({project}: {project: Project}) => {
  const {summary, employer, logo, meta, thumbnails, paragraphs, links, press} =
    project

  return (
    <div className="group box-border flex h-full max-h-[400px] w-full flex-col gap-0 overflow-scroll p-0 py-[26px] transition-all duration-300 hover:grayscale-0 md:max-h-full md:flex-row md:overflow-visible md:py-[26px] md:grayscale">
      <div className="md:h-[100px] md:min-w-[140px]">
        <div className="mb-2.5 flex items-start gap-5 md:flex-col md:gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo.path}
            alt={`${employer.name} logo`}
            className="h-20 max-h-20 w-auto max-w-[140px] rounded-[3px] object-contain xl:w-full"
          />
          <div className="mb-5 block flex flex-col md:hidden">
            <h3 className="text-xl leading-tight font-medium capitalize opacity-100 transition-all duration-300">
              <a href={employer.url}>{employer.name}</a>
            </h3>
            <small className="block text-xs opacity-80">
              {meta.date} {"//"} {meta.jobType}
            </small>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-start gap-10 xl:flex-row">
        <div className="order-1 md:order-0 md:min-w-[60%] 2xl:min-w-[30%]">
          <div className="mb-5 flex hidden flex-col md:block">
            <h3 className="text-xl leading-tight font-medium capitalize opacity-100 transition-all duration-300">
              <a href={employer.url}>{employer.name}</a>
            </h3>
            <small className="block text-xs opacity-80">
              {meta.date} {"//"} {meta.jobType}
            </small>
          </div>

          <h4 className="mb-5 text-lg leading-tight font-bold transition-all md:text-2xl">
            {summary}
          </h4>

          <div className="rich-text flex flex-col gap-3 opacity-100 transition-all group-hover:opacity-100 md:opacity-[0.3]">
            {paragraphs.map((p, i) => (
              <p
                key={i}
                className="text-[14px] text-[var(--color-med-grey)]"
                dangerouslySetInnerHTML={{__html: p.text}}
              />
            ))}
          </div>

          {press.length > 0 && (
            <div className="mt-2.5 flex flex-col gap-2.5">
              {press.map((link) => (
                <div
                  key={link.label}
                  className="flex flex-row items-center gap-2.5 text-xs"
                >
                  <span className="flex items-center opacity-40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icons/article.svg" height={16} alt="" />
                  </span>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs hover:underline"
                  >
                    {link.label}
                  </a>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 flex flex-col gap-2.5">
            {links.map((link) => (
              <div
                key={link.label}
                className="flex flex-row items-center gap-2.5 text-xs"
              >
                <a
                  href={link.url}
                  className="group/link flex flex-row items-center text-lg font-bold transition-all hover:text-highlight"
                >
                  {/* {link.label} */}
                  Visit site{" "}
                  <div className="relative flex translate-x-0 transition-all group-hover/link:translate-x-1">
                    <ChevronForward />
                  </div>
                </a>
                {link.archived && (
                  <span className="flex items-center gap-1 text-[10px] opacity-40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icons/archive.svg" height={16} alt="" />
                    archived
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="order-0 mb-5 flex min-w-full flex-col items-center gap-10 md:order-1 md:mt-10 md:min-w-[40%] 2xl:min-w-[70%]">
          {thumbnails.map((thumbnail, i) => {
            return (
              <Image
                key={i}
                width={300}
                height={300}
                sizes="(max-width: 768px) 90vw, 45vw"
                src={thumbnail.path}
                alt={`${employer.name} — ${summary}`}
                className="pointer-events-none h-auto w-full"
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ProjectCard
