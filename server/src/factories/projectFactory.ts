type RawSection = {
  id: string;
  nombre: string;
  orden: number;
  projectId: string;
  createdAt?: Date;
  updatedAt?: Date;
};

type RawShare = {
  id: string;
  sharedWithId: string;
  role: string;
  createdAt?: Date;
  updatedAt?: Date;
  sharedWith?: {
    id: string;
    nombre: string;
    email: string;
  };
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
  shares?: RawShare[] | null;
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

const resolveRole = (project: RawProject, currentUserId?: string) => {
  if (!currentUserId) return undefined;
  if (project.userId === currentUserId) return 'owner';
  const share = project.shares?.find((s) => s.sharedWithId === currentUserId);
  return share?.role;
};

const mapShares = (project: RawProject, currentUserId?: string) => {
  const role = resolveRole(project, currentUserId);
  if (role !== 'owner' && role !== 'manager') return undefined;
  return project.shares?.map((share) => ({
    id: share.id,
    sharedWithId: share.sharedWithId,
    role: share.role,
    createdAt: share.createdAt?.toISOString?.() ?? share.createdAt,
    updatedAt: share.updatedAt?.toISOString?.() ?? share.updatedAt,
    sharedWith: share.sharedWith
      ? {
          id: share.sharedWith.id,
          nombre: share.sharedWith.nombre,
          email: share.sharedWith.email,
        }
      : undefined,
  }));
};

export function toClientProject(project: RawProject | null | undefined, currentUserId?: string) {
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
    currentUserRole: resolveRole(project, currentUserId),
    shares: mapShares(project, currentUserId),
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


