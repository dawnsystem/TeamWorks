# Manual Testing Guide for Enhanced AI Capabilities

This guide provides test scenarios to validate the new AI capabilities.

## Prerequisites

1. Server and client running
2. User logged in
3. AI assistant accessible (Cmd/Ctrl+/)

## Test Scenarios

### 1. Recursive Subtask Creation

**Test 1.1: Simple nested subtasks**
```
Command: "crear tarea proyecto web con subtareas: diseñar mockups, desarrollar backend"
Expected: Creates task "proyecto web" with 2 subtasks
```

**Test 1.2: Multi-level nested subtasks**
```
Command: "crear tarea lanzar producto con subtareas: planificación (con subtarea: definir objetivos), desarrollo, marketing"
Expected: Creates task with subtasks, where "planificación" has a nested subtask "definir objetivos"
```

**Test 1.3: Nested subtasks with properties**
```
Command: "crear tarea proyecto grande prioridad alta con subtareas: tarea 1 prioridad media para mañana con etiqueta urgente, tarea 2 para la próxima semana"
Expected: Creates main task (P1) with subtasks that have different priorities, dates, and labels
```

### 2. Enhanced Bulk Deletion

**Test 2.1: Delete by date range - last week**
```
Setup: Create and complete several tasks in different projects
Command: "eliminar todas las tareas completadas de la semana pasada"
Expected: Only completed tasks from the last 7 days are deleted
```

**Test 2.2: Delete by project and status**
```
Setup: Create completed tasks in "Test Project"
Command: "eliminar todas las tareas completadas del proyecto Test Project"
Expected: Only completed tasks in the specified project are deleted
```

**Test 2.3: Delete older than X days**
```
Command: "eliminar todas las tareas completadas de hace más de 30 días"
Expected: Only tasks completed more than 30 days ago are deleted
```

**Test 2.4: Delete by label and status**
```
Setup: Create tasks with label "temporal"
Command: "eliminar todas las tareas con etiqueta temporal que están completadas"
Expected: Only completed tasks with the "temporal" label are deleted
```

### 3. Bulk Move Operations

**Test 3.1: Move by priority**
```
Setup: Create several P1 (high priority) tasks in different projects
Command: "mover todas las tareas de alta prioridad al proyecto Urgente"
Expected: All P1 tasks are moved to "Urgente" project (creates if doesn't exist)
```

**Test 3.2: Move by label**
```
Setup: Create tasks with label "review"
Command: "mover todas las tareas con etiqueta review al proyecto QA"
Expected: All tasks with "review" label are moved to "QA" project
```

**Test 3.3: Move to section**
```
Setup: Create tasks in different sections
Command: "mover todas las tareas de sección Backlog al proyecto Development sección In Progress"
Expected: All tasks from "Backlog" section are moved to "In Progress" section in "Development" project
```

**Test 3.4: Move completed tasks**
```
Setup: Complete several tasks
Command: "mover todas las tareas completadas al proyecto Archivo"
Expected: All completed tasks are moved to "Archivo" project
```

### 4. Task Reorganization

**Test 4.1: Move to end**
```
Setup: Create tasks "A", "B", "C" in order
Command: "poner la tarea A al final de la lista"
Expected: Order becomes "B", "C", "A"
```

**Test 4.2: Move to start**
```
Setup: Create tasks "A", "B", "C" in order
Command: "mover la tarea C al principio"
Expected: Order becomes "C", "A", "B"
```

**Test 4.3: Move before another task**
```
Setup: Create tasks "A", "B", "C" in order
Command: "mover la tarea C arriba de B"
Expected: Order becomes "A", "C", "B"
```

**Test 4.4: Move after another task**
```
Setup: Create tasks "A", "B", "C" in order
Command: "mover la tarea A después de C"
Expected: Order becomes "B", "C", "A"
```

**Test 4.5: Batch reorder**
```
Setup: Create tasks "A", "B", "C", "D" in order
Command: "reorganizar tareas: primero D, luego A, después C, al final B"
Expected: Order becomes "D", "A", "C", "B"
```

## Complex Integration Tests

### Scenario A: Project Setup
```
1. "crear proyecto WebApp con color azul"
2. "añadir sección Backlog en proyecto WebApp"
3. "añadir sección In Progress en proyecto WebApp"
4. "crear tarea diseñar arquitectura en proyecto WebApp sección Backlog con subtareas: 
    - definir componentes (con subtarea: investigar patrones), 
    - crear diagramas,
    - documentar decisiones"
5. Verify: Project created with sections and nested task structure
```

### Scenario B: Workflow Organization
```
1. Create 10 tasks with mixed priorities in Inbox
2. "mover todas las tareas de alta prioridad al proyecto Hoy"
3. "mover todas las tareas de baja prioridad al proyecto Someday"
4. "reorganizar tareas del proyecto Hoy: primero [task1], luego [task2], después [task3]"
5. Verify: Tasks organized correctly by priority and order
```

### Scenario C: Cleanup
```
1. Complete several tasks over multiple projects
2. "eliminar todas las tareas completadas de hace más de 7 días"
3. "mover todas las tareas completadas restantes al proyecto Archivo"
4. Verify: Old completed tasks deleted, recent ones moved to Archive
```

## Edge Cases to Test

### Edge 1: Empty Results
```
Command: "eliminar todas las tareas completadas del proyecto NoExiste"
Expected: No error, reports 0 tasks deleted
```

### Edge 2: Deeply Nested Subtasks
```
Command: "crear tarea A con subtareas: B (con subtarea: C (con subtarea: D (con subtarea: E)))"
Expected: Creates 5-level deep hierarchy successfully
```

### Edge 3: Conflicting Filters
```
Command: "mover todas las tareas de prioridad alta que no tienen prioridad al proyecto Test"
Expected: Handles gracefully, no tasks match
```

### Edge 4: Large Batch Operations
```
Setup: Create 50 tasks
Command: "cambiar todas las tareas a prioridad alta"
Expected: All 50 tasks updated successfully
```

## Validation Checklist

After each test:
- [ ] Action executed without errors
- [ ] Expected results match actual results
- [ ] UI updates correctly reflect changes
- [ ] No unexpected side effects (e.g., tasks in wrong projects)
- [ ] Undo/audit trail preserved (if applicable)
- [ ] Performance acceptable (operations complete within 5 seconds)

## Common Issues and Solutions

**Issue**: "No tasks found"
- **Solution**: Check project/section names are spelled correctly
- **Solution**: Verify filters are not too restrictive

**Issue**: "Permission denied"
- **Solution**: Ensure you have write access to target project
- **Solution**: Check if project is shared with correct permissions

**Issue**: "Tasks not reordering"
- **Solution**: Refresh the page
- **Solution**: Check if tasks are in same section/project

**Issue**: "Subtasks not created"
- **Solution**: Check syntax - use parentheses for nested subtasks
- **Solution**: Verify project exists or can be created

## Performance Testing

Test with increasing load:
1. 10 tasks - should be instant
2. 100 tasks - should complete within 2-3 seconds
3. 500 tasks - should complete within 10 seconds

If performance degrades significantly, report as bug.

## Reporting Issues

When reporting issues, include:
1. Exact command used
2. Expected behavior
3. Actual behavior
4. Screenshots if applicable
5. Browser console errors (F12)
6. Server logs if available

---

**Testing completed by:** _____________
**Date:** _____________
**Version:** 1.3.0
**All tests passed:** ☐ Yes ☐ No (details below)

**Notes:**
