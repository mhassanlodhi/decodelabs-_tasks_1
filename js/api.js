/**
 * CollabHub API Client
 *
 * Centralizes every network call to the backend (Project 2) so that
 * tasks.js never touches `fetch` directly. This gives us one place to:
 *   - set the base URL
 *   - attach consistent headers
 *   - translate the server's { error: { message, status } } shape into
 *     a plain JS Error that calling code can catch normally
 *
 * Base URL is derived from the page's own hostname rather than a
 * hardcoded 'localhost'. This matters because 'localhost' always means
 * "this device" -- if this page is loaded on a phone via your PC's LAN
 * IP (e.g. http://192.168.1.23:3001), a hardcoded 'localhost' would
 * point the phone at itself, not your PC. Deriving it from
 * window.location.hostname means it self-adjusts: localhost when
 * opened locally, the LAN IP when opened from another device on the
 * same network -- as long as the API is reachable on port 3000 at
 * whatever host the page itself was loaded from.
 */
(function () {
    'use strict';

    const API_BASE_URL = 'http://' + window.location.hostname + ':3000/api';

    /**
     * Low-level request helper. Every call goes through here so error
     * handling and JSON parsing only need to be written once.
     */
    async function request(path, options) {
        options = options || {};

        let response;
        try {
            response = await fetch(API_BASE_URL + path, {
                headers: Object.assign({ 'Content-Type': 'application/json' }, options.headers || {}),
                ...options,
            });
        } catch (networkError) {
            // fetch() itself throws on network failure (server down, no
            // connection, CORS block) — this is distinct from the server
            // responding with an error status, and needs its own message
            // since there's no response body to read.
            throw new Error(
                'Could not reach the CollabHub API at ' + window.location.hostname +
                ':3000. Is the server running?'
            );
        }

        // 204 No Content has no body to parse (used by DELETE).
        if (response.status === 204) {
            return null;
        }

        const text = await response.text();
        let body = null;
        if (text) {
            try {
                body = JSON.parse(text);
            } catch (parseError) {
                // Server sent something that isn't valid JSON — shouldn't happen
                // given our backend, but fail loudly rather than silently.
                throw new Error('Received an unreadable response from the server.');
            }
        }

        if (!response.ok) {
            const message =
                (body && body.error && body.error.message) ||
                `Request failed with status ${response.status}`;
            throw new Error(message);
        }

        return body;
    }

    /**
     * Public API surface for the tasks resource. tasks.js calls these
     * methods and never needs to know about URLs, headers, or fetch.
     */
    window.TasksAPI = {
        list: function (filters) {
            filters = filters || {};
            const params = new URLSearchParams();
            if (filters.status) params.set('status', filters.status);
            if (filters.projectId) params.set('projectId', filters.projectId);
            const query = params.toString();
            return request('/tasks' + (query ? '?' + query : ''), { method: 'GET' });
        },

        create: function (task) {
            return request('/tasks', {
                method: 'POST',
                body: JSON.stringify(task),
            });
        },

        updateStatus: function (id, status) {
            return request('/tasks/' + encodeURIComponent(id), {
                method: 'PUT',
                body: JSON.stringify({ status: status }),
            });
        },

        remove: function (id) {
            return request('/tasks/' + encodeURIComponent(id), { method: 'DELETE' });
        },
    };
})();