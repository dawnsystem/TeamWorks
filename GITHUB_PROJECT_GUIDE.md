# 📊 Guía del GitHub Project TeamWorks

Este documento explica cómo usar el GitHub Project para gestionar el desarrollo de TeamWorks.

## 🎯 ¿Qué es el GitHub Project?

El [GitHub Project TeamWorks](https://github.com/orgs/dawnsystem/projects) es un tablero Kanban que ayuda a organizar, priorizar y hacer seguimiento de todas las tareas, bugs y features del proyecto.

## 🚀 Acceso Rápido

- **Ver el Proyecto**: [https://github.com/orgs/dawnsystem/projects](https://github.com/orgs/dawnsystem/projects)
- **Ver Issues**: [https://github.com/dawnsystem/TeamWorks/issues](https://github.com/dawnsystem/TeamWorks/issues)
- **Ver Pull Requests**: [https://github.com/dawnsystem/TeamWorks/pulls](https://github.com/dawnsystem/TeamWorks/pulls)

## 📋 Estructura del Proyecto

El proyecto está organizado en las siguientes columnas:

### 1. 📥 Backlog
- **Propósito**: Todas las tareas nuevas y sin priorizar
- **Contiene**: Ideas, features propuestos, bugs reportados sin asignar
- **Estado**: Sin asignar, pendiente de priorización

### 2. 📝 To Do
- **Propósito**: Tareas priorizadas listas para trabajar
- **Contiene**: Issues priorizados por el equipo
- **Estado**: Listo para comenzar, con prioridad asignada

### 3. 🔄 In Progress
- **Propósito**: Trabajo activo en curso
- **Contiene**: Issues y PRs en desarrollo activo
- **Estado**: Alguien está trabajando en ello

### 4. 👀 In Review
- **Propósito**: Código completado esperando revisión
- **Contiene**: Pull Requests pendientes de revisión
- **Estado**: Esperando feedback o aprobación

### 5. ✅ Done
- **Propósito**: Trabajo completado
- **Contiene**: Issues cerrados y PRs fusionados
- **Estado**: Completado y desplegado

## 🛠️ Cómo Contribuir

### Para Crear un Nuevo Issue

1. **Elige una plantilla**:
   - [🐛 Reporte de Bug](https://github.com/dawnsystem/TeamWorks/issues/new?template=bug_report.md)
   - [✨ Solicitud de Feature](https://github.com/dawnsystem/TeamWorks/issues/new?template=feature_request.md)
   - [📖 Mejora de Documentación](https://github.com/dawnsystem/TeamWorks/issues/new?template=documentation.md)

2. **Completa la información**:
   - Título descriptivo
   - Descripción detallada
   - Pasos para reproducir (bugs)
   - Criterios de aceptación (features)

3. **Etiquetas automáticas**:
   - Las plantillas asignan etiquetas automáticamente
   - El issue se agregará al proyecto automáticamente

4. **Espera priorización**:
   - El equipo revisará y priorizará tu issue
   - Se asignará a un milestone si corresponde

### Para Trabajar en un Issue

1. **Encuentra una tarea**:
   - Revisa la columna "To Do" en el proyecto
   - Busca issues con la etiqueta `good first issue` si eres nuevo

2. **Asígnate el issue**:
   - Comenta en el issue que vas a trabajar en él
   - Usa el botón "Assign yourself"

3. **Mueve a In Progress**:
   - Arrastra el issue a la columna "In Progress"
   - O usa la interfaz de GitHub Projects

4. **Crea una rama**:
   ```bash
   git checkout -b feature/issue-number-description
   # o
   git checkout -b fix/issue-number-description
   ```

5. **Desarrolla la solución**:
   - Sigue las guías de estilo del proyecto
   - Escribe tests para tu código
   - Actualiza la documentación si es necesario

6. **Crea un Pull Request**:
   - Usa la plantilla de PR automática
   - Referencia el issue: `Fixes #123`
   - El PR se agregará automáticamente al proyecto

### Para Revisar Pull Requests

1. **Encuentra PRs pendientes**:
   - Revisa la columna "In Review"
   - Usa los filtros de GitHub

2. **Revisa el código**:
   - Verifica que cumpla los estándares
   - Prueba localmente si es necesario
   - Deja comentarios constructivos

3. **Aprueba o solicita cambios**:
   - Usa "Approve" si todo está bien
   - Usa "Request changes" si hay problemas
   - Usa "Comment" para preguntas

4. **Merge**:
   - Una vez aprobado, el autor o un maintainer hace el merge
   - El issue y PR se mueven automáticamente a "Done"

## 🏷️ Sistema de Etiquetas

### Tipo de Issue
- `bug` - Error o comportamiento incorrecto
- `enhancement` - Nueva característica o mejora
- `documentation` - Mejoras en documentación
- `security` - Vulnerabilidad de seguridad
- `performance` - Mejora de rendimiento

### Prioridad
- `priority: critical` - Debe resolverse inmediatamente
- `priority: high` - Alta prioridad
- `priority: medium` - Prioridad media
- `priority: low` - Baja prioridad

### Estado
- `good first issue` - Bueno para principiantes
- `help wanted` - Se necesita ayuda
- `blocked` - Bloqueado por otro issue/PR
- `wontfix` - No se resolverá
- `duplicate` - Duplicado de otro issue

### Área
- `backend` - Relacionado con el servidor
- `frontend` - Relacionado con el cliente
- `database` - Relacionado con la base de datos
- `ai` - Relacionado con el asistente de IA
- `ci/cd` - Relacionado con CI/CD

## 🔄 Flujo de Trabajo Automático

El proyecto usa GitHub Actions para automatizar tareas:

1. **Agregar automáticamente**: Issues y PRs nuevos se agregan al proyecto
2. **Sincronización de estado**: El estado se actualiza según eventos de GitHub
3. **CI/CD**: Los tests se ejecutan automáticamente en cada PR

## 📊 Vistas del Proyecto

El proyecto tiene múltiples vistas para diferentes necesidades:

### Vista de Tablero (Board)
- Vista Kanban clásica
- Ideal para ver el flujo de trabajo
- Fácil de arrastrar y soltar

### Vista de Lista (List)
- Todas las tareas en una lista
- Ideal para búsqueda y filtrado
- Ordenable por múltiples criterios

### Vista de Roadmap
- Timeline de features futuras
- Muestra milestones y releases
- Ideal para planificación a largo plazo

## 💡 Mejores Prácticas

### Para Issues
1. ✅ Usa títulos descriptivos y concisos
2. ✅ Proporciona contexto completo
3. ✅ Incluye pasos para reproducir (bugs)
4. ✅ Agrega capturas de pantalla cuando sea útil
5. ✅ Usa las plantillas proporcionadas

### Para Pull Requests
1. ✅ Referencia el issue relacionado
2. ✅ Usa la plantilla de PR
3. ✅ Escribe descripciones claras
4. ✅ Mantén los PRs pequeños y enfocados
5. ✅ Asegúrate de que pasen todos los tests
6. ✅ Actualiza la documentación

### Para Revisiones
1. ✅ Sé constructivo y respetuoso
2. ✅ Explica el "por qué" de tus sugerencias
3. ✅ Aprueba cuando esté listo
4. ✅ Usa el formato de comentarios de código

## 🔗 Enlaces Útiles

- [Documentación de GitHub Projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects)
- [Guía de Contribución](CONTRIBUTING.md)
- [Código de Conducta](CODE_OF_CONDUCT.md)
- [README Principal](README.md)

## 📞 Soporte

Si tienes preguntas sobre el proyecto o cómo contribuir:

1. Revisa la [documentación](DOCUMENTATION.md)
2. Busca en [issues existentes](https://github.com/dawnsystem/TeamWorks/issues)
3. Crea un [nuevo issue](https://github.com/dawnsystem/TeamWorks/issues/new/choose)
4. Contacta al equipo en las discusiones del proyecto

---

**¡Gracias por contribuir a TeamWorks! 🚀**
