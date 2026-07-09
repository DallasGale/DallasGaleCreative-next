export type Employer = {
  id: number;
  name: string;
  url: string;
};

export type EmployersData = {
  agencies: Employer[];
  organisations: Employer[];
  startups: Employer[];
};

export type ProjectLink = {
  label: string;
  url: string;
  archived?: boolean;
};

export type PressLink = {
  label: string;
  url: string;
};

export type Project = {
  id: number;
  employer: {
    name: string;
    url: string;
  };
  meta: {
    date: string;
    jobType: string;
  };
  logo: {
    path: string;
    alt: string;
  };
  thumbnail: {
    path: string;
    alt: string;
  };
  summary: string;
  paragraphs: { text: string }[];
  links: ProjectLink[];
  press: PressLink[];
};

export type DaySegment = "morning" | "afternoon" | "evening";
