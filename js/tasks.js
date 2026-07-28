/**
 * Task Board UI
 *
 * Owns all DOM interaction for the #task-board section. Talks to the
 * backend exclusively through window.TasksAPI (api.js) — never calls
 * fetch directly, so this file only has to reason about rendering and
 * events, not network concerns.
 */
(function () {
    'use strict';

    const taskList = document.getElementById('task-list');
    const taskForm = document.getElementById('task-form');
    const taskFormStatus = document.getElementById('task-form-status');
    const taskFormSubmit = document.getElementById('task-form-submit');
    const statusFilter = document.getElementById('task-filter-status');

    // Guard: if this markup isn't on the page (e.g. a future page that
    // reuses this JS bundle without the task board), don't wire up
    // listeners against null elements.
    if (!taskList || !taskForm) return;

    const STATUS_LABELS = {
        todo: 'To do',
        'in-progress': 'In progress',
        done: 'Done',
    };

    /**
     * Escapes user-supplied text before it's inserted via innerHTML.
     * Task titles/descriptions come from user input (via the form, or
     * potentially other clients hitting the same API) — never trust it
     * when building HTML strings, same "never trust the client" principle
     * the backend applies to its own input.
     */
    function escapeHtml(value) {
        const div = document.createElement('div');
        div.textContent = value == null ? '' : String(value);
        return div.innerHTML;
    }

    function renderTaskCard(task) {
        return (
            '<article class="task-card" data-task-id="' + escapeHtml(task.id) + '">' +
            '<div class="task-card__header">' +
            '<h4 class="task-card__title">' + escapeHtml(task.title) + '</h4>' +
            '<span class="task-card__priority task-card__priority--' + escapeHtml(task.priority) + '">' +
            escapeHtml(task.priority) +
            '</span>' +
            '</div>' +
            (task.description
                ? '<p class="task-card__description">' + escapeHtml(task.description) + '</p>'
                : '') +
            '<div class="task-card__footer">' +
            '<label class="task-card__status-label" for="status-' + escapeHtml(task.id) + '">Status</label>' +
            '<select class="task-card__status-select" id="status-' + escapeHtml(task.id) + '" data-task-id="' + escapeHtml(task.id) + '">' +
            Object.keys(STATUS_LABELS).map(function (value) {
                return '<option value="' + value + '"' + (task.status === value ? ' selected' : '') + '>' +
                    STATUS_LABELS[value] + '</option>';
            }).join('') +
            '</select>' +
            '<button type="button" class="task-card__delete" data-task-id="' + escapeHtml(task.id) + '" ' +
            'aria-label="Delete task: ' + escapeHtml(task.title) + '">Delete</button>' +
            '</div>' +
            '</article>'
        );
    }

    function setListLoading() {
        taskList.setAttribute('aria-busy', 'true');
        taskList.innerHTML = '<p class="task-list__status">Loading tasks…</p>';
    }

    function setListError(message) {
        taskList.setAttribute('aria-busy', 'false');
        taskList.innerHTML =
            '<p class="task-list__status task-list__status--error">' + escapeHtml(message) + '</p>';
    }

    function renderTaskList(tasks) {
        taskList.setAttribute('aria-busy', 'false');

        if (tasks.length === 0) {
            taskList.innerHTML = '<p class="task-list__status">No tasks yet — add one above to get started.</p>';
            return;
        }

        taskList.innerHTML = tasks.map(renderTaskCard).join('');
    }

    /**
     * Fetches tasks from the API (respecting the current filter) and
     * renders them. This is the single source of truth for "what's on
     * screen" — every mutation (create/update/delete) re-runs this
     * rather than trying to patch the DOM incrementally, which keeps the
     * UI guaranteed-consistent with the server at the cost of an extra
     * request per action. A reasonable tradeoff at this scale.
     */
    function loadTasks() {
        setListLoading();
        const filters = statusFilter.value ? { status: statusFilter.value } : {};

        window.TasksAPI.list(filters)
            .then(function (result) {
                renderTaskList(result.data);
            })
            .catch(function (err) {
                setListError(err.message);
            });
    }

    function setFormStatus(message, isError) {
        taskFormStatus.textContent = message;
        taskFormStatus.classList.toggle('task-form__status--error', Boolean(isError));
        taskFormStatus.classList.toggle('task-form__status--success', !isError && Boolean(message));
    }

    taskForm.addEventListener('submit', function (event) {
        event.preventDefault();
        setFormStatus('');

        const formData = new FormData(taskForm);
        const task = {
            title: (formData.get('title') || '').trim(),
            projectId: (formData.get('projectId') || '').trim(),
            description: (formData.get('description') || '').trim(),
            priority: formData.get('priority'),
        };

        // Lightweight client-side check purely for fast feedback — this is
        // NOT a substitute for the server's validation. The server still
        // re-validates everything on its end (never trust the client), and
        // the catch block below surfaces the server's own error message if
        // this check somehow passes something the server rejects.
        if (!task.title || !task.projectId) {
            setFormStatus('Title and Project ID are required.', true);
            return;
        }

        taskFormSubmit.disabled = true;
        taskFormSubmit.textContent = 'Adding…';

        window.TasksAPI.create(task)
            .then(function () {
                setFormStatus('Task added.', false);
                taskForm.reset();
                loadTasks();
            })
            .catch(function (err) {
                setFormStatus(err.message, true);
            })
            .finally(function () {
                taskFormSubmit.disabled = false;
                taskFormSubmit.textContent = 'Add Task';
            });
    });

    // Event delegation for status changes and deletes — the list is
    // re-rendered wholesale on every load, so listeners are attached once
    // to the container rather than re-bound to every card.
    taskList.addEventListener('change', function (event) {
        const select = event.target.closest('.task-card__status-select');
        if (!select) return;

        const taskId = select.dataset.taskId;
        const newStatus = select.value;

        window.TasksAPI.updateStatus(taskId, newStatus).catch(function (err) {
            setListError(err.message);
            loadTasks(); // resync with server truth after a failed update
        });
    });

    taskList.addEventListener('click', function (event) {
        const button = event.target.closest('.task-card__delete');
        if (!button) return;

        const taskId = button.dataset.taskId;
        const card = button.closest('.task-card');
        const title = card ? card.querySelector('.task-card__title').textContent : 'this task';

        if (!window.confirm('Delete "' + title + '"? This cannot be undone.')) return;

        window.TasksAPI.remove(taskId)
            .then(loadTasks)
            .catch(function (err) {
                setListError(err.message);
            });
    });

    statusFilter.addEventListener('change', loadTasks);

    // Initial load on page ready.
    loadTasks();
})();
