/**
 * AI Telemetry Service
 * 
 * Módulo de telemetría simple para tracking de métricas del motor de IA.
 * Mantiene contadores en memoria y proporciona logs estructurados.
 */

/**
 * Métricas en memoria
 */
interface AIMetrics {
  totalRequests: number;
  successfulParses: number;
  unparsableResponses: number;
  clarificationsRequested: number;
  suggestionsProvided: number;
  autoExecutions: number;
  fallbackToGemini: number;
  groqRequests: number;
  geminiRequests: number;
  averageConfidence: number;
  confidenceSum: number;
  confidenceCount: number;
}

/**
 * Estado global de métricas
 */
const metrics: AIMetrics = {
  totalRequests: 0,
  successfulParses: 0,
  unparsableResponses: 0,
  clarificationsRequested: 0,
  suggestionsProvided: 0,
  autoExecutions: 0,
  fallbackToGemini: 0,
  groqRequests: 0,
  geminiRequests: 0,
  averageConfidence: 0,
  confidenceSum: 0,
  confidenceCount: 0,
};

/**
 * Tipos de eventos para logging
 */
export type AIEventType =
  | 'request_received'
  | 'parsing_success'
  | 'parsing_failure'
  | 'clarification_requested'
  | 'suggestion_provided'
  | 'auto_execution'
  | 'fallback_used'
  | 'provider_called'
  | 'confidence_recorded';

/**
 * Interfaz para evento de telemetría
 */
export interface AITelemetryEvent {
  type: AIEventType;
  timestamp: Date;
  provider?: string;
  confidence?: number;
  parsingQuality?: string;
  details?: Record<string, any>;
}

/**
 * Registra un request de IA
 */
export const recordRequest = (provider: string) => {
  metrics.totalRequests++;
  
  if (provider === 'groq') {
    metrics.groqRequests++;
  } else if (provider === 'gemini') {
    metrics.geminiRequests++;
  }
  
  logEvent({
    type: 'request_received',
    timestamp: new Date(),
    provider,
  });
};

/**
 * Registra un parsing exitoso
 */
export const recordSuccessfulParsing = (actionsCount: number, parsingQuality?: string) => {
  metrics.successfulParses++;
  
  logEvent({
    type: 'parsing_success',
    timestamp: new Date(),
    parsingQuality,
    details: { actionsCount },
  });
};

/**
 * Registra un parsing fallido
 */
export const recordParsingFailure = (reason: string, rawText?: string) => {
  metrics.unparsableResponses++;
  
  logEvent({
    type: 'parsing_failure',
    timestamp: new Date(),
    details: { 
      reason,
      textPreview: rawText ? rawText.substring(0, 100) : undefined
    },
  });
  
  // Log de warning para debugging
  console.warn('[AI Telemetry] Parsing failure:', reason);
};

/**
 * Registra una solicitud de clarificación
 */
export const recordClarificationRequest = (reason: string, confidence?: number) => {
  metrics.clarificationsRequested++;
  
  logEvent({
    type: 'clarification_requested',
    timestamp: new Date(),
    confidence,
    details: { reason },
  });
  
  console.info('[AI Telemetry] Clarification requested:', reason);
};

/**
 * Registra una sugerencia de acciones para confirmación
 */
export const recordSuggestion = (actionsCount: number, confidence?: number) => {
  metrics.suggestionsProvided++;
  
  logEvent({
    type: 'suggestion_provided',
    timestamp: new Date(),
    confidence,
    details: { actionsCount },
  });
};

/**
 * Registra una ejecución automática
 */
export const recordAutoExecution = (actionsCount: number, confidence?: number) => {
  metrics.autoExecutions++;
  
  logEvent({
    type: 'auto_execution',
    timestamp: new Date(),
    confidence,
    details: { actionsCount },
  });
};

/**
 * Registra uso de fallback a otro proveedor
 */
export const recordFallback = (fromProvider: string, toProvider: string, reason: string) => {
  if (toProvider === 'gemini') {
    metrics.fallbackToGemini++;
  }
  
  logEvent({
    type: 'fallback_used',
    timestamp: new Date(),
    provider: toProvider,
    details: { fromProvider, reason },
  });
  
  console.warn('[AI Telemetry] Fallback used:', { fromProvider, toProvider, reason });
};

/**
 * Registra un confidence score
 * Usa promedio incremental (Welford's method) para mejor precisión numérica
 */
export const recordConfidence = (confidence: number) => {
  metrics.confidenceCount++;
  const delta = confidence - metrics.averageConfidence;
  metrics.averageConfidence += delta / metrics.confidenceCount;
  // Mantener sum para compatibilidad con reseteo
  metrics.confidenceSum = metrics.averageConfidence * metrics.confidenceCount;
  
  logEvent({
    type: 'confidence_recorded',
    timestamp: new Date(),
    confidence,
  });
};

/**
 * Obtiene las métricas actuales
 */
export const getMetrics = (): Readonly<AIMetrics> => {
  return { ...metrics };
};

/**
 * Resetea las métricas (útil para testing)
 */
export const resetMetrics = () => {
  metrics.totalRequests = 0;
  metrics.successfulParses = 0;
  metrics.unparsableResponses = 0;
  metrics.clarificationsRequested = 0;
  metrics.suggestionsProvided = 0;
  metrics.autoExecutions = 0;
  metrics.fallbackToGemini = 0;
  metrics.groqRequests = 0;
  metrics.geminiRequests = 0;
  metrics.averageConfidence = 0;
  metrics.confidenceSum = 0;
  metrics.confidenceCount = 0;
};

/**
 * Obtiene un resumen de métricas en formato legible
 */
export const getMetricsSummary = (): string => {
  const total = metrics.totalRequests;
  if (total === 0) {
    return 'No hay datos de telemetría disponibles.';
  }
  
  const successRate = ((metrics.successfulParses / total) * 100).toFixed(1);
  const clarificationRate = ((metrics.clarificationsRequested / total) * 100).toFixed(1);
  const autoExecRate = ((metrics.autoExecutions / total) * 100).toFixed(1);
  
  return `
=== AI Telemetry Summary ===
Total Requests: ${total}
Successful Parses: ${metrics.successfulParses} (${successRate}%)
Unparsable Responses: ${metrics.unparsableResponses}
Clarifications Requested: ${metrics.clarificationsRequested} (${clarificationRate}%)
Suggestions Provided: ${metrics.suggestionsProvided}
Auto Executions: ${metrics.autoExecutions} (${autoExecRate}%)
Fallback to Gemini: ${metrics.fallbackToGemini}

Provider Usage:
- Groq: ${metrics.groqRequests}
- Gemini: ${metrics.geminiRequests}

Average Confidence: ${metrics.averageConfidence.toFixed(2)}
===========================
  `.trim();
};

/**
 * Logger interno para eventos
 * En producción, esto podría integrarse con un sistema de logging externo
 */
const logEvent = (event: AITelemetryEvent) => {
  // Por ahora, solo guardamos en consola en modo de desarrollo
  if (process.env.NODE_ENV === 'development' || process.env.LOG_LEVEL === 'debug') {
    console.debug('[AI Telemetry Event]', JSON.stringify(event, null, 2));
  }
};

/**
 * Middleware para logging de errores de IA
 */
export const logAIError = (error: Error, context?: Record<string, any>) => {
  console.error('[AI Telemetry] Error:', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Logging estructurado de información
 */
export const logAIInfo = (message: string, details?: Record<string, any>) => {
  console.info('[AI Telemetry]', message, details ? JSON.stringify(details) : '');
};

/**
 * Logging estructurado de warnings
 */
export const logAIWarning = (message: string, details?: Record<string, any>) => {
  console.warn('[AI Telemetry]', message, details ? JSON.stringify(details) : '');
};
