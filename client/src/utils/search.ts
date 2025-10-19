import { fuzzyMatch } from './fuzzyMatch';
import type { Task, Project, Label } from '@/types';

export interface SearchResult {
  id: string;
  type: 'task' | 'project' | 'label' | 'action' | 'view';
  title: string;
  subtitle?: string;
  icon: string;
  data: any;
  score: number;
}

export interface SearchFilter {
  project?: string;
  label?: string;
  date?: 'today' | 'week' | string;
  priority?: 1 | 2 | 3 | 4;
  completed?: boolean;
}

/**
 * Parse search query and extract filters
 * Supports: p:project #label @date !priority
 */
export function parseSearchQuery(query: string): { text: string; filters: SearchFilter } {
  const filters: SearchFilter = {};
  let text = query;
  
  // Extract project filter (p:ProjectName)
  const projectMatch = query.match(/p:(\w+)/i);
  if (projectMatch) {
    filters.project = projectMatch[1];
    text = text.replace(projectMatch[0], '').trim();
  }
  
  // Extract label filter (#labelname)
  const labelMatch = query.match(/#(\w+)/i);
  if (labelMatch) {
    filters.label = labelMatch[1];
    text = text.replace(labelMatch[0], '').trim();
  }
  
  // Extract date filter (@today, @week)
  const dateMatch = query.match(/@(\w+)/i);
  if (dateMatch) {
    filters.date = dateMatch[1].toLowerCase();
    text = text.replace(dateMatch[0], '').trim();
  }
  
  // Extract priority filter (!alta, !1)
  const priorityMatch = query.match(/!(\w+|\d)/i);
  if (priorityMatch) {
    const prio = priorityMatch[1].toLowerCase();
    if (prio === 'alta' || prio === '1') filters.priority = 1;
    else if (prio === 'media' || prio === '2') filters.priority = 2;
    else if (prio === 'baja' || prio === '3') filters.priority = 3;
    else if (prio === 'ninguna' || prio === '4') filters.priority = 4;
    text = text.replace(priorityMatch[0], '').trim();
  }
  
  return { text, filters };
}

/**
 * Search tasks with fuzzy matching and filters
 */
export function searchTasks(
  tasks: Task[],
  query: string,
  projects?: Project[]
): SearchResult[] {
  const { text, filters } = parseSearchQuery(query);
  
  if (!text && Object.keys(filters).length === 0) {
    return [];
  }
  
  const results: SearchResult[] = [];
  
  for (const task of tasks) {
    // Apply filters first
    if (filters.project) {
      const project = projects?.find(p => p.id === task.projectId);
      if (!project || !fuzzyMatch(project.nombre, filters.project).matched) {
        continue;
      }
    }
    
    if (filters.label) {
      const hasLabel = task.labels?.some(tl => 
        fuzzyMatch(tl.label.nombre, filters.label!).matched
      );
      if (!hasLabel) continue;
    }
    
    if (filters.date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (filters.date === 'today' || filters.date === 'hoy') {
        if (!task.fechaVencimiento) continue;
        const taskDate = new Date(task.fechaVencimiento);
        taskDate.setHours(0, 0, 0, 0);
        if (taskDate.getTime() !== today.getTime()) continue;
      } else if (filters.date === 'week' || filters.date === 'semana') {
        if (!task.fechaVencimiento) continue;
        const weekFromNow = new Date(today);
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        const taskDate = new Date(task.fechaVencimiento);
        if (taskDate < today || taskDate > weekFromNow) continue;
      }
    }
    
    if (filters.priority !== undefined) {
      if (task.prioridad !== filters.priority) continue;
    }
    
    // Fuzzy match on title and description
    const titleMatch = fuzzyMatch(task.titulo, text);
    const descMatch = task.descripcion ? fuzzyMatch(task.descripcion, text) : { matched: false, score: 0, indices: [] };
    
    if (titleMatch.matched || descMatch.matched) {
      const project = projects?.find(p => p.id === task.projectId);
      
      results.push({
        id: task.id,
        type: 'task',
        title: task.titulo,
        subtitle: project?.nombre,
        icon: task.completada ? '✓' : '○',
        data: task,
        score: Math.max(titleMatch.score, descMatch.score)
      });
    }
  }
  
  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Search projects
 */
export function searchProjects(projects: Project[], query: string): SearchResult[] {
  const { text } = parseSearchQuery(query);
  
  if (!text) return [];
  
  const results: SearchResult[] = [];
  
  for (const project of projects) {
    const match = fuzzyMatch(project.nombre, text);
    
    if (match.matched) {
      results.push({
        id: project.id,
        type: 'project',
        title: project.nombre,
        subtitle: `${project._count?.tasks || 0} tareas`,
        icon: '📁',
        data: project,
        score: match.score
      });
    }
  }
  
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Search labels
 */
export function searchLabels(labels: Label[], query: string): SearchResult[] {
  const { text } = parseSearchQuery(query);
  
  if (!text) return [];
  
  const results: SearchResult[] = [];
  
  for (const label of labels) {
    const match = fuzzyMatch(label.nombre, text);
    
    if (match.matched) {
      results.push({
        id: label.id,
        type: 'label',
        title: label.nombre,
        subtitle: `${label._count?.tasks || 0} tareas`,
        icon: '🏷️',
        data: label,
        score: match.score
      });
    }
  }
  
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Available actions in the system
 */
export interface Action {
  id: string;
  title: string;
  description: string;
  icon: string;
  keywords: string[];
  handler: () => void;
}

/**
 * Search actions
 */
export function searchActions(actions: Action[], query: string): SearchResult[] {
  const { text } = parseSearchQuery(query);
  
  if (!text) return [];
  
  const results: SearchResult[] = [];
  
  for (const action of actions) {
    // Match on title, description, or keywords
    const titleMatch = fuzzyMatch(action.title, text);
    const descMatch = fuzzyMatch(action.description, text);
    const keywordMatches = action.keywords.map(k => fuzzyMatch(k, text));
    const bestKeywordMatch = keywordMatches.reduce((best, curr) => 
      curr.score > best.score ? curr : best, 
      { matched: false, score: 0, indices: [] }
    );
    
    if (titleMatch.matched || descMatch.matched || bestKeywordMatch.matched) {
      results.push({
        id: action.id,
        type: 'action',
        title: action.title,
        subtitle: action.description,
        icon: action.icon,
        data: action,
        score: Math.max(titleMatch.score, descMatch.score, bestKeywordMatch.score)
      });
    }
  }
  
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Combine all search results
 */
export function searchAll(
  tasks: Task[],
  projects: Project[],
  labels: Label[],
  actions: Action[],
  query: string
): SearchResult[] {
  if (!query.trim()) return [];
  
  const taskResults = searchTasks(tasks, query, projects);
  const projectResults = searchProjects(projects, query);
  const labelResults = searchLabels(labels, query);
  const actionResults = searchActions(actions, query);
  
  // Combine and limit results
  return [
    ...actionResults.slice(0, 5),
    ...taskResults.slice(0, 10),
    ...projectResults.slice(0, 5),
    ...labelResults.slice(0, 5),
  ];
}
