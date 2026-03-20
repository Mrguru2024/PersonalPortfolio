# Admin settings and AI agent

## Admin settings

- **Location**: `/admin/settings` (linked from admin nav as "Settings").
- **Storage**: `admin_settings` table (per-user, one row per admin). Defaults used when no row exists.
- **API**: `GET /api/admin/settings`, `PATCH /api/admin/settings` (current user only; requires admin).

### Options

| Setting | Default | Effect |
|--------|---------|--------|
| Email notifications | on | When we send admin-related emails (e.g. chat, role change), respect this. |
| In-app notifications | on | In-app/admin UI notifications (e.g. chat bell). |
| Push notifications enabled | on | Reminder push and other push only sent to subscriptions for users with this on. |
| Reminders enabled | on | When off, `GET /api/admin/reminders` returns `[]`; reminder engine and push for new reminders still run server-side but UI shows none. |
| Reminder frequency | realtime | Informational for now; can drive polling or digest later. |
| Notify on role change | on | When role/permissions are updated (e.g. `PATCH /api/admin/users/[id]/permissions`), backend can send in-app/email if this is on. |
| Allow agent to perform actions | off | When on, the admin AI agent may return and execute actions (navigate, generate reminders). |

### Where settings are used

- **Reminders**: `GET /api/admin/reminders` returns `[]` if `remindersEnabled === false`. `POST /api/admin/reminders` (generate) only sends push to admins with `pushNotificationsEnabled !== false`.
- **Push**: Any code that sends push to admins (e.g. reminder generation) should filter by `admin_settings.pushNotificationsEnabled`.
- **Role changes**: `notifyOnRoleChange` is stored for use when implementing role/permission-change notifications (e.g. in `PATCH /api/admin/users/[id]/permissions` or role update flows).
- **Backend and AI**: User `role` and `permissions` are already used by auth helpers and AI (playbook tips, reminder role filtering). No change required; admin settings only add notification and reminder visibility controls.

## Admin AI agent

- **UI**: Floating button (bottom-right) on every admin page, opening a chat panel. Rendered in `app/admin/layout.tsx` via `AdminAgentWidget`; only visible when user is approved admin.
- **API**: `POST /api/admin/agent` — body `{ message, currentPath? }`. Returns `{ reply, action? }`. Actions are only returned when the current user has `admin_settings.aiAgentCanPerformActions === true`.

### Allowed actions

- **Navigation**: open reminders, CRM, dashboard, settings, blog, invoices, chat (each has a fixed URL).
- **Generate reminders**: calls `POST /api/admin/reminders` and invalidates reminder query.

Intent is parsed by command + keyword matching in `server/services/adminAgentService.ts`.

### Advanced command support

- Natural language actions (e.g. `open content studio`, `go to growth os intelligence`, `open crm pipeline`).
- Slash commands (e.g. `/help`, `/open crm pipeline`, `/run reminders`, `/where am i`, `/new`).
- Question handling for:
  - capabilities/commands (`what can you do?`, `list commands`)
  - page context (`where am i?`)
  - new feature discovery (`what's new?`, `new features`)
  - action-mode status (`are actions enabled?`)
- Interactive suggestion chips are returned by the API and rendered in the widget as one-click follow-up commands.

### Permissions

- Agent is available to any approved admin.
- Executing actions (navigate, generate reminders) is gated by **Allow agent to perform actions** in Admin settings. If disabled, the agent still replies and suggests enabling the setting to perform actions.
