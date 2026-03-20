import type { NextApiRequest } from 'next';

const BACKEND_URL = process.env.API_PROXY_URL || 'https://api.salon-bw.pl';

type CalendarNamedView = {
    id: number;
    name: string;
    employeeIds: number[];
};

type Employee = {
    id: number;
    name: string;
};

type CalendarViewPayload = {
    name: string;
    employeeIds: number[];
};

function escapeHtml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getAuthHeaders(req: NextApiRequest): Record<string, string> {
    const accessToken = req.cookies.accessToken;
    return accessToken
        ? {
              Authorization: `Bearer ${accessToken}`,
          }
        : {};
}

async function fetchBackend<T>(
    req: NextApiRequest,
    path: string,
    init?: RequestInit,
): Promise<T> {
    const headers = new Headers(init?.headers);
    headers.set('Accept', 'application/json');
    for (const [key, value] of Object.entries(getAuthHeaders(req))) {
        headers.set(key, value);
    }
    if (init?.body) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${BACKEND_URL}${path}`, {
        ...init,
        headers,
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Backend request failed: ${response.status}`);
    }

    if (response.status === 204) {
        return null as T;
    }

    return (await response.json()) as T;
}

export async function getCalendarViews(req: NextApiRequest) {
    return fetchBackend<CalendarNamedView[]>(req, '/settings/calendar-views');
}

export async function getEmployees(req: NextApiRequest) {
    return fetchBackend<Employee[]>(req, '/employees');
}

export async function createCalendarView(
    req: NextApiRequest,
    payload: CalendarViewPayload,
) {
    return fetchBackend<CalendarNamedView>(req, '/settings/calendar-views', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function updateCalendarView(
    req: NextApiRequest,
    id: number,
    payload: CalendarViewPayload,
) {
    return fetchBackend<CalendarNamedView>(
        req,
        `/settings/calendar-views/${id}`,
        {
            method: 'PUT',
            body: JSON.stringify(payload),
        },
    );
}

export async function deleteCalendarView(req: NextApiRequest, id: number) {
    return fetchBackend<{ success: boolean }>(
        req,
        `/settings/calendar-views/${id}`,
        {
            method: 'DELETE',
        },
    );
}

export function renderCalendarViewsDropdown(views: CalendarNamedView[]) {
    const customViews =
        views.length > 0
            ? views
                  .map((view) => {
                      const entities = escapeHtml(
                          JSON.stringify(
                              view.employeeIds.map((employeeId) => ({
                                  entity_id: employeeId,
                                  entity_type: 'employee',
                              })),
                          ),
                      );

                      return `<li>
<a data-calendar-view-entities="${entities}" href="#"><div class='icon_box'>
<i class='icon sprite-calendar_employees'></i>
</div>
<span class='v_middle'>${escapeHtml(view.name)}</span>
</a></li>`;
                  })
                  .join('')
            : `<li class='lbl'>BRAK ZDEFINIOWANYCH WIDOKÓW</li>`;

    return `<div class='calendar-views dropdown dropup'>
<button name="button" type="button" class="button button-sm" data-toggle="dropdown">widok
<b class='caret caret-up'></b>
</button><ul class='dropdown-menu dropdown-menu-right dropdown-style-2'>
<li class='lbl'>WIDOKI</li>
<li>
<a data-calendar-view-entities="employees" href="#"><div class='icon_box'>
<i class='icon sprite-calendar_employees'></i>
</div>
<span class='v_middle'>Pracownicy</span>
</a></li>
${customViews}
<li class='with-standard-link'>
<div class='icon_box'></div>
<a data-calendar-views-index-link="" class="bottom-link" title="Zarządzaj widokami" href="/salonblackandwhite/calendar/views">dodaj/edytuj/usuń</a>
</li>
</ul>
</div>`;
}

export function renderCalendarViewsIndex(
    views: CalendarNamedView[],
    employees: Employee[],
) {
    if (views.length === 0) {
        return `<div data-url='/api/runtime/calendar-views' data-views-index-container=''>
<div class='bigger'>Brak zdefiniowanych widoków</div>
</div>`;
    }

    const employeeMap = new Map(
        employees.map((employee) => [employee.id, employee.name]),
    );
    const items = views
        .map((view) => {
            const names = view.employeeIds
                .map((employeeId) => employeeMap.get(employeeId))
                .filter(Boolean)
                .join(', ');

            return `<div class='calendar-view-drafts__item'>
<div class='calendar-view-drafts__row'>
<div>
<div class='calendar-view-drafts__title'>${escapeHtml(view.name)}</div>
<div class='calendar-view-drafts__meta'>${escapeHtml(names)}</div>
</div>
<div class='calendar-view-drafts__actions'>
<a class='btn btn-link btn-xs' data-calendar-view-form-link title='Edytuj widok' href='/salonblackandwhite/calendar/views/${view.id}/edit'>edytuj</a>
<a class='btn btn-link btn-xs text-danger' data-destroy-calendar-view data-confirmation-message='Czy na pewno chcesz usunąć ten widok?' href='/api/runtime/calendar-views/${view.id}'>usuń</a>
</div>
</div>
</div>`;
        })
        .join('');

    return `<div data-url='/api/runtime/calendar-views' data-views-index-container=''>
<div class='calendar-view-drafts'>${items}</div>
</div>`;
}

export function renderCalendarViewForm(options: {
    employees: Employee[];
    value?: Partial<CalendarNamedView>;
    error?: string | null;
    action: string;
    method: 'POST' | 'PUT';
}) {
    const selectedIds = new Set(options.value?.employeeIds ?? []);
    const errorHtml = options.error
        ? `<div class="alert alert-danger" role="alert">${escapeHtml(options.error)}</div>`
        : '';

    const employeeList = options.employees
        .map((employee) => {
            const checked = selectedIds.has(employee.id) ? ' checked' : '';
            return `<li>
<label class="calendar-view-checkbox">
<input type="checkbox" name="employeeIds[]" value="${employee.id}"${checked} />
<span>${escapeHtml(employee.name)}</span>
</label>
</li>`;
        })
        .join('');

    return `<form action="${options.action}" method="${options.method}">
${errorHtml}
<ul class="calendar-view-form-list">
<li>
<label class="control-label" for="calendar_view_name">Nazwa</label>
<input id="calendar_view_name" class="form-control" name="name" value="${escapeHtml(options.value?.name ?? '')}" autofocus />
</li>
</ul>
<ul class="calendar-view-form-list">
<li>
<h5 class="calendar-view-form-list__heading">Pracownicy (${options.employees.length})</h5>
</li>
${employeeList}
</ul>
</form>`;
}

export function normalizeCalendarViewPayload(
    rawBody: unknown,
): CalendarViewPayload {
    const body =
        rawBody && typeof rawBody === 'object'
            ? (rawBody as Record<string, unknown>)
            : {};

    const rawName = body.name;
    const rawEmployeeIds = body['employeeIds[]'] ?? body.employeeIds;
    const employeeIds = Array.isArray(rawEmployeeIds)
        ? rawEmployeeIds
        : rawEmployeeIds === undefined
          ? []
          : [rawEmployeeIds];

    return {
        name: typeof rawName === 'string' ? rawName.trim() : '',
        employeeIds: employeeIds
            .map((value) => Number.parseInt(String(value), 10))
            .filter((value) => Number.isFinite(value)),
    };
}

export function validateCalendarViewPayload(payload: CalendarViewPayload) {
    if (!payload.name) {
        return 'Pole Nazwa jest wymagane.';
    }

    if (payload.employeeIds.length === 0) {
        return 'Wybierz co najmniej jednego pracownika.';
    }

    return null;
}
