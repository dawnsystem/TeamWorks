/**
 * AI Plan Generator
 * Generates structured plans from high-level goals
 */

import { resolveProvider, generateWithProvider, getProviderOrder } from './providers';
import { stripCodeFences } from './actionParser';
import {
  buildPlannerQuestionsPrompt,
  buildPlannerPlanPrompt,
} from './prompts';

export interface AIPlanTask {
  title: string;
  description?: string;
  priority: number;
  dueInDays?: number;
  dependencies?: string[];
}

export interface AIPlanPhase {
  title: string;
  description?: string;
  duration?: string;
  tasks: AIPlanTask[];
}

export interface AIPlan {
  goal: string;
  summary?: string;
  assumptions?: string[];
  timeline?: string[];
  phases: AIPlanPhase[];
}

interface InternalPlannerResponse {
  status: 'questions' | 'plan';
  questions?: string[];
  plan?: AIPlan;
  notes?: string[];
}

export interface GenerateAIPlanOptions {
  context?: any;
  answers?: string[];
  providerOverride?: string;
}

/**
 * Parse plan from AI-generated text
 */
const parsePlanFromText = (text: string): InternalPlannerResponse => {
  try {
    const cleaned = stripCodeFences(text);
    const parsed = JSON.parse(cleaned);

    if (parsed.status === 'questions') {
      return {
        status: 'questions',
        questions: Array.isArray(parsed.questions) ? parsed.questions : [],
      };
    }

    if (parsed.status === 'plan' && parsed.plan) {
      return {
        status: 'plan',
        plan: parsed.plan,
        notes: parsed.notes || [],
      };
    }

    throw new Error('Invalid plan response format');
  } catch (error) {
    console.error('Error parsing plan:', error);
    return {
      status: 'plan',
      plan: {
        goal: 'Error parsing plan',
        summary: 'No se pudo generar un plan válido',
        phases: [],
      },
      notes: ['Hubo un error al generar el plan'],
    };
  }
};

/**
 * Build appropriate prompt based on mode
 */
const buildPlannerPrompt = (
  goal: string,
  mode: 'auto' | 'interactive',
  answers: string[] = [],
  contextString: string,
): string => {
  if (mode === 'interactive' && answers.length === 0) {
    return buildPlannerQuestionsPrompt(goal, contextString);
  }

  return buildPlannerPlanPrompt(goal, contextString, answers);
};

/**
 * Generate AI with fallback support
 */
const generateWithFallback = async (
  prompt: string,
  preferred: any,
  providerOverride?: string,
): Promise<{ text: string; providerUsed: any }> => {
  const providers = getProviderOrder(preferred, providerOverride);
  let lastError: Error | null = null;

  for (const provider of providers) {
    try {
      const text = await generateWithProvider(prompt, provider);
      return { text, providerUsed: provider };
    } catch (error) {
      console.error(`Provider ${provider} failed:`, error);
      lastError = error as Error;
    }
  }

  throw lastError || new Error('All providers failed');
};

/**
 * Generate an AI plan from a goal
 * @param goal High-level goal to plan
 * @param mode 'auto' for immediate plan, 'interactive' for questions first
 * @param options Additional options (context, answers, provider override)
 * @returns Generated plan or questions
 */
export const generateAIPlan = async (
  goal: string,
  mode: 'auto' | 'interactive',
  options: GenerateAIPlanOptions = {},
) => {
  const preferred = resolveProvider(options.providerOverride);
  const contextString = options.context
    ? JSON.stringify(options.context, null, 2)
    : 'Sin contexto adicional';

  const prompt = buildPlannerPrompt(goal, mode, options.answers, contextString);

  const { text, providerUsed } = await generateWithFallback(
    prompt,
    preferred,
    options.providerOverride,
  );
  const parsed = parsePlanFromText(text);

  return {
    ...parsed,
    providerUsed,
  };
};
