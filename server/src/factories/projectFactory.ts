type RawSection = {
  id: string;
  nombre: string;
  orden: number;
  projectId: string;
  createdAt?: Date;
  updatedAt?: Date;
};

type RawProject = {
  id: string;
  nombre: string;
  color: string | null;
  orden: number;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
  sections?: RawSection[] | null;
  _count?: {
    tasks?: number;
    sections?: number;
    [key: string]: number | undefined;
  } | null;
};

const mapSections = (sections?: RawSection[] | null) => {
  if (!sections) return [];
  return sections
    .map((section) => ({
      id: section.id,
      nombre: section.nombre,
      orden: section.orden,
      projectId: section.projectId,
      createdAt: section.createdAt?.toISOString?.() ?? section.createdAt,
      updatedAt: section.updatedAt?.toISOString?.() ?? section.updatedAt,
    }))
    .sort((a, b) => a.orden - b.orden);
};

const mapCounts = (count?: RawProject['_count']) => {
  if (!count) return undefined;
  return {
    tasks: count.tasks ?? 0,
    sections: count.sections ?? 0,
  };
};

export function toClientProject(project: RawProject | null | undefined) {
  if (!project) return project;

  return {
    id: project.id,
    nombre: project.nombre,
    color: project.color ?? undefined,
    orden: project.orden,
    userId: project.userId,
    createdAt: project.createdAt?.toISOString?.() ?? project.createdAt,
    updatedAt: project.updatedAt?.toISOString?.() ?? project.updatedAt,
    sections: mapSections(project.sections),
    _count: mapCounts(project._count),
  };
}

export function toClientSection(section: RawSection | null | undefined) {
  if (!section) return section;

  return {
    id: section.id,
    nombre: section.nombre,
    orden: section.orden,
    projectId: section.projectId,
    createdAt: section.createdAt?.toISOString?.() ?? section.createdAt,
    updatedAt: section.updatedAt?.toISOString?.() ?? section.updatedAt,
  };
}

export const projectFactory = {
  toClientProject,
  toClientSection,
};


