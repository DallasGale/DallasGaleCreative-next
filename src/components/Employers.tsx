import employersData from "@/data/employers.json";
import type { Employer, EmployersData } from "@/types";

const data = (employersData as EmployersData[])[0];

function EmployerList({ heading, items }: { heading: string; items: Employer[] }) {
  return (
    <div>
      <h3
        className="mb-0 text-left text-[80px] font-black leading-[0.8]"
        style={{ opacity: 0.025 }}
      >
        {heading}.
      </h3>
      <ul className="flex w-full list-none flex-wrap justify-start gap-2.5 pl-0">
        {items.map(({ id, name, url }) => (
          <li key={id} className="employer-li">
            {url ? (
              <a href={url} target="_blank" rel="noreferrer">
                {name}
              </a>
            ) : (
              name
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Employers() {
  return (
    <div className="flex flex-col gap-10">
      <EmployerList heading="agencies" items={data.agencies} />
      <EmployerList heading="organisations" items={data.organisations} />
      <EmployerList heading="start-ups" items={data.startups} />
    </div>
  );
}
