import type {Project} from "@/types"

const ProjectCard = ({project}: {project: Project}) => {
  const {summary, keyTakeaways, employer, logo, meta, links, press} = project

  return (
    <div className="group box-border flex h-full w-full flex-row gap-3 p-0 py-[26px] transition-all duration-300 md:max-h-full md:py-[26px] lg:gap-0">
      <div className="md:h-[100px] md:min-w-[140px]">
        <div className="mb-2.5 flex w-full flex-col items-start gap-5 md:flex-col md:gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo.path}
            alt={`${employer.name} logo`}
            className="h-10 max-h-10 w-auto max-w-[140px] rounded-[3px] object-contain lg:h-20 lg:max-h-20 xl:w-full"
          />
        </div>
      </div>

      <div className="flex w-full flex-row items-start lg:gap-10">
        <div className="order-0 w-full md:min-w-[60%] 2xl:min-w-[30%]">
          <div className="mb-2 flex flex-col lg:mb-5">
            <p className="text-lg font-black lg:text-6xl lg:leading-20">
              <a href={employer.url}>{employer.name}</a>
            </p>
            <small className="block text-xs opacity-80">
              {meta.date} {"//"} {meta.jobType}
            </small>
          </div>

          <h4 className="mb-5 text-sm leading-tight font-bold transition-all md:text-2xl lg:text-lg">
            {summary}
          </h4>

          <div className="rich-text flex flex-col gap-3 opacity-100 transition-all group-hover:opacity-100 md:opacity-[1]">
            <p
              className="text-[16px] text-[var(--color-med-grey)]"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
              dangerouslySetInnerHTML={{__html: keyTakeaways}}
            />
          </div>

          {press.length > 0 && (
            <div className="mt-2.5 flex hidden flex-col gap-2.5 lg:flex">
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

          <div className="mt-5 flex flex-row gap-2.5 lg:flex-col">
            {links.map((link) => (
              <div
                key={link.label}
                className="flex flex-row items-center gap-2.5"
              >
                <a
                  href={link.url}
                  className="group/link flex flex-row items-center text-xs font-bold underline underline-offset-5 transition-all hover:text-highlight lg:text-lg"
                >
                  {link.urlLabel}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectCard
