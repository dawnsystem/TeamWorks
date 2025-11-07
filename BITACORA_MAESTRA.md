# BITÁCORA MAESTRA - TeamWorks

## Información General
**Proyecto**: TeamWorks - Gestión de Tareas con IA  
**Repositorio**: dawnsystem/TeamWorks  
**Manifiesto**: Director de IA v4.1  
**Convenciones**:
- Comunicación: Español
- Nombres técnicos: Inglés
- Commits: Conventional Commits
- Desarrollo: TDD por defecto

---

## Directiva del Director
**Revisión y mejora integral de la implementación de la IA de Groq en TeamWorks**

### Contexto
TeamWorks es una aplicación de gestión de tareas con un asistente de IA integrado que permite crear, modificar y gestionar tareas usando lenguaje natural. Actualmente utiliza Groq (Llama 3.1) y Gemini como proveedores de IA, pero la implementación presenta desafíos en:
- Interpretación ambigua de intenciones del usuario
- Respuestas erróneas o impredecibles
- Parsing frágil de respuestas JSON
- Falta de clarificación cuando la intención no es clara
- Ausencia de telemetría y métricas

### Objetivo Principal
Mejorar la robustez, precisión y experiencia de usuario del motor de IA mediante:
1. Construcción de prompts más efectivos y estructurados
2. Parsing tolerante y robusto de respuestas
3. Sistema de análisis de intención (Intent Shield)
4. Telemetría y observabilidad
5. Tests completos y documentación actualizada

### Plan de Acción Aprobado
1. **Construcción de Prompts**: Implementar `buildSystemPrompt()` con rol claro, formato de salida obligatorio (JSON con actions), reglas de comportamiento y ejemplos
2. **Parsing Robusto**: Mejorar `parseActionsFromText()` para soportar múltiples formatos, extracción heurística y manejo gracioso de errores
3. **Intent Shield**: Crear módulo que analice confidence y decida si ejecutar, sugerir o pedir clarificación
4. **Telemetría**: Implementar módulo de métricas para tracking de requests, parsing failures, clarifications y fallbacks
5. **Tests**: Unit tests para parsing e intentShield, integration tests para API /api/ai/process
6. **Documentación**: Actualizar READMEs con nuevos comportamientos y variables de entorno

---

## Sesiones de Trabajo

### TSK-001: Mejora integral motor de IA Groq
**Fecha**: 2025-11-07  
**Agente**: GitHub Copilot Coding Agent  
**Estado**: 🚧 En Progreso

#### Objetivos de la Sesión
- [ ] Crear estructura base: BITACORA_MAESTRA.md
- [ ] Implementar buildSystemPrompt() con prompt estructurado para Groq
- [ ] Mejorar parseActionsFromText() con manejo robusto de múltiples formatos JSON
- [ ] Crear módulo intentShield.ts con análisis de confidence y decisión de ejecución
- [ ] Crear módulo aiTelemetry.ts para métricas simples en memoria
- [ ] Añadir tests unitarios completos (parseActionsFromText, intentShield)
- [ ] Añadir test de integración para endpoint /api/ai/process
- [ ] Actualizar documentación (README.md, server/README.md)
- [ ] Configurar variables de entorno para umbrales de confidence

#### Cambios Técnicos Planificados
**Archivos a Crear**:
- `BITACORA_MAESTRA.md` (este archivo)
- `server/src/services/intentShield.ts` - Análisis de intención y decisión de ejecución
- `server/src/services/aiTelemetry.ts` - Métricas y telemetría simple
- `server/src/__tests__/parseActions.test.ts` - Tests robustos para parsing
- `server/src/__tests__/intentShield.test.ts` - Tests para decisiones de intención
- `server/src/__tests__/aiIntegration.test.ts` - Test de integración API

**Archivos a Modificar**:
- `server/src/services/aiService.ts`:
  - Añadir función `buildSystemPrompt(provider, context, options)`
  - Modificar `generateWithProvider()` para usar system prompts
  - Mejorar `parseActionsFromText()` con parsing robusto
  - Integrar intentShield en flujo de procesamiento
  - Integrar telemetría
- `server/src/services/ai/actionParser.ts`:
  - Reforzar parsing con extracción de JSON de texto mixto
  - Añadir campo `parsingConfidence`
- `README.md` y `server/README.md`:
  - Documentar nuevas capacidades
  - Explicar variables de entorno de umbrales
- `.env.example`:
  - Añadir variables para umbrales de confidence

#### Decisiones de Diseño
1. **Umbrales de Confidence**:
   - `>= 0.85`: Ejecución automática
   - `0.6 - 0.85`: Sugerir para confirmación
   - `< 0.6`: Pedir clarificación

2. **Formato de System Prompt**:
   - Rol: "Asistente de TeamWorks para interpretación de comandos NL"
   - Output: JSON con array `actions` obligatorio
   - Incluir ejemplos de entrada/salida
   - Reglas: pedir clarificación si ambiguo

3. **Parsing Tolerante**:
   - Intentar extraer JSON de bloques ```json```
   - Buscar JSON inline en texto mixto
   - Localizar primer '{' o '[' y extraer
   - Fallback heurístico verbal si JSON no recuperable
   - Retornar `parsingConfidence` con resultado

4. **Telemetría Mínima**:
   - Contadores en memoria (no persistencia)
   - Logs estructurados (info/warn/error)
   - Métricas: totalRequests, unparsableResponses, clarificationsRequested, fallbackToGemini

#### Progreso
- ✅ Exploración de repositorio y análisis de código existente
- ✅ Creación de BITACORA_MAESTRA.md con estructura inicial
- 🚧 Implementación de mejoras...

#### Notas y Observaciones
- El repositorio ya tiene una estructura de tests sólida con Jest
- Existen módulos separados en `server/src/services/ai/` para diferentes aspectos
- La integración con Groq y Gemini ya soporta fallback automático
- El parsing actual es básico y solo maneja casos simples
- No existe actualmente análisis de confidence para decidir ejecución

#### Referencias
- Issue/Ticket: Feature request - Mejorar robustez motor IA
- Branch: `feature/ai-groq-improvements` (a crear desde dev)
- PR: Por crear contra `dev`
- Documentos relacionados: ROADMAP.md, DOCUMENTATION.md

---

## Plantilla para Nuevas Sesiones

### TSK-XXX: [Título de la sesión]
**Fecha**: YYYY-MM-DD  
**Agente**: [Nombre del agente]  
**Estado**: 🚧 En Progreso | ✅ Completado | ❌ Bloqueado | ⏸️ Pausado

#### Objetivos de la Sesión
- [ ] Objetivo 1
- [ ] Objetivo 2

#### Cambios Técnicos Planificados
**Archivos a Crear**: ...  
**Archivos a Modificar**: ...

#### Decisiones de Diseño
1. ...

#### Progreso
- Estado actual...

#### Notas y Observaciones
- Observaciones importantes...

#### Referencias
- Links y documentos relacionados...

---

## Glosario Técnico

| Término | Descripción |
|---------|-------------|
| **Intent Shield** | Módulo que analiza la intención del usuario y confidence score para decidir si ejecutar automáticamente, solicitar confirmación o pedir clarificación |
| **Parsing Confidence** | Métrica (0-1) que indica qué tan seguro está el parser de haber extraído correctamente las acciones del texto de la IA |
| **System Prompt** | Instrucciones iniciales enviadas al modelo de IA que definen su rol, formato de salida y reglas de comportamiento |
| **Fallback** | Mecanismo que intenta usar un proveedor alternativo (Gemini) cuando Groq falla |
| **Action** | Objeto JSON que representa una operación a realizar (create, update, delete, query, etc.) |
| **Confidence Score** | Número 0-1 que el modelo IA asigna para indicar su certeza sobre la interpretación de un comando |

---

## Convenciones del Proyecto

### Commits
Seguir Conventional Commits:
- `feat(scope):` - Nueva funcionalidad
- `fix(scope):` - Corrección de bug
- `docs:` - Cambios en documentación
- `test(scope):` - Añadir o modificar tests
- `refactor(scope):` - Refactorización sin cambio funcional
- `chore:` - Tareas de mantenimiento

### Código
- **Idioma comentarios públicos**: Español
- **Nombres funciones/variables**: Inglés
- **JSDoc/TSDoc**: Español
- **Tests**: Nombres en inglés, descripciones pueden ser español

### Testing
- **Enfoque**: TDD por defecto
- **Estructura**: Arrange-Act-Assert
- **Coverage**: Mínimo 80% para código crítico
- **Herramientas**: Jest + Supertest

---

*Última actualización: 2025-11-07 11:41 UTC*
