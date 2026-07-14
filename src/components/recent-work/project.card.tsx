import {Project} from "@/types"
import Image from "next/image"

const ProjectCard = ({project}: {project: Project}) => {
  const {summary, employer, logo, meta, thumbnails, paragraphs, links, press} =
    project

  return (
    <div className="box-border p-0 py-[26px] md:py-[26px] group md:grayscale hover:grayscale-0 transition-all duration-300 flex flex-col md:flex-row gap-0 w-full  max-h-[400px] md:max-h-full overflow-scroll md:overflow-visible h-full">
      <div className="md:h-[100px] md:min-w-[140px]">
        <div className="mb-2.5 flex items-start gap-5 md:gap-2.5 md:flex-col">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo.path}
            alt={`${employer.name} logo`}
            className="h-20 max-h-20 w-auto xl:w-full max-w-[140px] object-contain rounded-[3px]"
          />
          <div className="block md:hidden mb-5 flex flex-col">
            <h3 className="text-xl capitalize font-medium leading-tight opacity-100  transition-all  duration-300">
              <a href={employer.url}>{employer.name}</a>
            </h3>
            <small className="block text-xs opacity-80">
              {meta.date} {"//"} {meta.jobType}
            </small>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-10 items-start">
        <div className="order-1 md:order-0  md:min-w-[60%] 2xl:min-w-[30%]">
          <div className="hidden md:block mb-5 flex flex-col">
            <h3 className="text-xl capitalize font-medium leading-tight opacity-100  transition-all  duration-300">
              <a href={employer.url}>{employer.name}</a>
            </h3>
            <small className="block text-xs opacity-80">
              {meta.date} {"//"} {meta.jobType}
            </small>
          </div>

          <h4 className="mb-5 text-lg  md:text-2xl font-bold leading-tight  transition-all">
            {summary}
          </h4>

          <div className="rich-text flex flex-col gap-3 opacity-100 md:opacity-[0.3] group-hover:opacity-100 transition-all ">
            {paragraphs.map((p, i) => (
              <p
                key={i}
                className="text-[14px]  text-[var(--color-med-grey)]"
                dangerouslySetInnerHTML={{__html: p.text}}
              />
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-2.5">
            {links.map((link) => (
              <div
                key={link.label}
                className="flex flex-row items-center gap-2.5 text-xs"
              >
                <a href={link.url} className="link">
                  {link.label}
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
        </div>
        <div className="order-0 md:order-1 min-w-full md:min-w-[40%] 2xl:min-w-[70%] mb-5 flex items-center md:mt-10 flex flex-col gap-10 ">
          {thumbnails.map((thumbnail, i) => {
            return (
              <Image
                key={i}
                width={300}
                height={300}
                sizes="(max-width: 768px) 90vw, 45vw"
                src={thumbnail.path}
                alt={`${employer.name} — ${summary}`}
                className="h-auto w-full pointer-events-none"
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ProjectCard
