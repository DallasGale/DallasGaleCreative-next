import projectsData from "@/data/recent-projects.json";
import type { Project } from "@/types";

const projects = projectsData as Project[];

/** Ensure asset paths from the JSON resolve from /public. */
function asset(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function ProjectCard({ project }: { project: Project }) {
  const { summary, employer, logo, meta, thumbnail, paragraphs, links, press } =
    project;

  return (
    <div className="recent-work-project box-border p-0 py-[26px] md:p-[26px]">
      <div className="mb-2.5 flex items-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset(logo.path)}
          alt={`${employer.name} logo`}
          className="h-20 max-h-20 w-auto max-w-[200px] object-contain"
        />
        <h3 className="text-2xl capitalize leading-tight">
          <a href={employer.url} target="_blank" rel="noreferrer">
            {employer.name}
          </a>
        </h3>
      </div>

      <div>
        <div className="mb-5 flex flex-col">
          <small className="block text-xs opacity-80">
            {meta.date} // {meta.jobType}
          </small>
        </div>

        <div className="mb-5 flex h-[150px] items-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset(thumbnail.path)}
            alt={`${employer.name} — ${summary}`}
            className="flex h-auto w-full items-center"
          />
        </div>

        <h4 className="mb-5 text-lg font-bold leading-tight">{summary}</h4>

        <div className="rich-text flex flex-col gap-3">
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className="text-base"
              style={{ color: "var(--color-med-grey)" }}
              dangerouslySetInnerHTML={{ __html: p.text }}
            />
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          {links.map((link) => (
            <div key={link.label} className="flex flex-row items-center gap-2.5 text-xs">
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="link"
              >
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
              <div key={link.label} className="flex flex-row items-center gap-2.5 text-xs">
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
    </div>
  );
}

export default function RecentWork() {
  return (
    <>
      <section
        id="recent-work-heading"
        className="section two-col-grid-layout mx-auto mb-5 w-full md:mb-[100px] md:grid md:max-w-[1300px] md:grid-cols-[1fr_2fr] md:gap-[60px] min-[1800px]:max-w-[1480px]"
      >
        <div>
          <h2 className="section-title underline">Recent Work.</h2>
        </div>
        <div />
      </section>

      <section
        id="recent-work"
        className="section mx-auto grid w-full grid-cols-1 md:max-w-[1300px] md:grid-cols-2 min-[1200px]:grid-cols-3 min-[1800px]:max-w-[1480px] min-[1800px]:grid-cols-4"
      >
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </section>
    </>
  );
}
