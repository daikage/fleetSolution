# FKG.Fleet - Fleet Management System

## Project Overview

FKG.Fleet is a comprehensive fleet management solution built with Laravel 13 + React (Inertia.js) for the web dashboard and React Native (Expo) for the driver mobile app. It provides real-time GPS tracking, vehicle management, driver management, trip management, maintenance/fuel logging with approval workflows, and compliance document tracking.

---

## 1. Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| PHP | ^8.3 | Server-side language |
| Laravel | ^13.8 | Web framework |
| Laravel Reverb | ^1.0 | WebSocket broadcasting |
| Laravel Sanctum | ^4.0 | API authentication |
| Inertia.js | ^2.0 | Server-driven SPA |
| PostgreSQL | - | Database |

### Frontend (Web Dashboard)
| Technology | Version | Purpose |
|------------|---------|---------|
| React | ^18.2 | UI library |
| Inertia.js React | ^2.0 | Server-driven rendering |
| Tailwind CSS | ^3.2 | Styling |
| Framer Motion | ^12.41 | Animations |
| Lucide React | ^1.21 | Icons |
| Google Maps (@vis.gl/react-google-maps) | ^1.9 | Map visualization |
| Maplibre GL | ^5.24 | Map tiles |
| Laravel Echo | ^2.3 | WebSocket client |
| jsPDF + jspdf-autotable | - | PDF export |
| xlsx | - | Excel/CSV export |
| Vite | ^8.0 | Build tool |

### Mobile App (Driver)
| Technology | Purpose |
|------------|---------|
| React Native (Expo) | Cross-platform mobile app |
| Expo Location | GPS tracking |
| Expo TaskManager | Background location |
| React Native Maps | Map display |
| Axios | API communication |
| AsyncStorage | Token/settings persistence |

---

## 2. Application Architecture

```
┌─────────────────────┐      ┌──────────────────────┐
│   Web Dashboard     │      │   Driver Mobile App  │
│   (React/Inertia)   │      │   (React Native)     │
└─────────┬───────────┘      └──────────┬───────────┘
          │                              │
          ▼                              ▼
┌─────────────────────────────────────────────────┐
│              Laravel Backend (API)               │
│  - Web Routes (Inertia SSR)                     │
│  - API Routes (JSON - Sanctum)                  │
│  - WebSocket (Reverb)                           │
└─────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────┐
│              PostgreSQL Database                 │
└─────────────────────────────────────────────────┘
```

---

## 3. Directory Structure

```
fleetSolution/
├── app/
│   ├── Events/                    # WebSocket events
│   │   ├── MessageSent.php
│   │   └── VehicleLocationUpdated.php
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Api/
│   │   │   │   ├── ChatController.php
│   │   │   │   ├── DriverTrackingController.php
│   │   │   │   ├── PushNotificationController.php
│   │   │   │   ├── SettingsController.php
│   │   │   │   └── TelematicsController.php
│   │   │   ├── Auth/              # Laravel Breeze auth
│   │   │   ├── DashboardController.php   # Main CRUD controller
│   │   │   ├── NotificationController.php
│   │   │   └── ProfileController.php
│   │   ├── Middleware/
│   │   │   ├── HandleInertiaRequests.php
│   │   │   └── RoleMiddleware.php
│   │   └── Requests/
│   ├── Jobs/
│   │   └── ProcessVehicleLocation.php
│   ├── Mail/
│   │   ├── FuelRequestDecision.php
│   │   └── MaintenanceRequestDecision.php
│   ├── Models/
│   │   ├── Conversation.php
│   │   ├── Document.php
│   │   ├── Driver.php
│   │   ├── FuelLog.php
│   │   ├── Geofence.php
│   │   ├── Inspection.php
│   │   ├── Location.php
│   │   ├── Maintenance.php
│   │   ├── MaintenanceSchedule.php
│   │   ├── Message.php
│   │   ├── Setting.php
│   │   ├── Trip.php
│   │   ├── User.php
│   │   └── Vehicle.php
│   ├── Notifications/
│   │   ├── ForceStartTracking.php
│   │   ├── RequestActioned.php
│   │   ├── RequestSubmitted.php
│   │   └── ReviewRequestForwarded.php
│   └── Providers/
├── bootstrap/
├── config/
├── database/
│   ├── factories/
│   ├── migrations/                 # All table definitions
│   └── seeders/
├── driver-app/                     # React Native mobile app
│   ├── src/
│   │   ├── api/
│   │   │   ├── config.js
│   │   │   └── echo.js            # Laravel Echo (Reverb WebSocket client)
│   │   ├── screens/
│   │   │   ├── ChatListScreen.js   # Chat conversation list
│   │   │   ├── ChatScreen.js       # 1-on-1 chat w/ image support
│   │   │   ├── LoginScreen.js
│   │   │   └── TrackingScreen.js
│   │   └── tasks/
│   │       └── LocationTask.js
│   ├── App.js
│   ├── app.json
│   ├── eas.json                   # EAS build config
│   └── google-services.json       # FCM config
├── resources/
│   └── js/
│       ├── Components/
│       │   ├── BulkImportModal.jsx
│       │   ├── ExportButtons.jsx
│       │   ├── FleetMap.jsx
│       │   └── VehicleSidebar.jsx
│       ├── Layouts/
│       │   ├── AuthenticatedLayout.jsx
│       │   ├── DashboardLayout.jsx
│       │   └── GuestLayout.jsx
│       ├── Pages/
│       │   ├── Auth/               # Login, Register, etc.
│       │   ├── Dashboard/
│       │   │   ├── Chat.jsx        # Real-time chat w/ WebSocket + polling
│       │   │   ├── Compliance.jsx
│       │   │   ├── Drivers.jsx
│       │   │   ├── FinancialReports.jsx
│       │   │   ├── Fuel.jsx
│       │   │   ├── Index.jsx       # Main dashboard with live map
│       │   │   ├── Maintenance.jsx
│       │   │   ├── Notifications.jsx
│       │   │   ├── Reports.jsx
│       │   │   ├── Trips.jsx
│       │   │   ├── Users.jsx
│       │   │   └── Vehicles.jsx
│       │   ├── Profile/
│       │   │   └── Partials/
│       │   │       └── SystemSettingsForm.jsx
│       │   └── Dashboard.jsx
│       │   └── Welcome.jsx
│       └── utils/
│           └── exportUtils.js
├── routes/
│   ├── api.php                     # API routes (Sanctum)
│   ├── web.php                     # Web routes (Inertia)
│   ├── auth.php                    # Auth routes
│   └── channels.php                # Broadcasting channels
└── config/                         # Laravel config files
```

---

## 4. Database Schema

### Users Table
| Column | Type | Purpose |
|--------|------|---------|
| id | bigint | Primary key |
| name | string | Full name |
| email | string | Login email |
| password | string | Hashed password |
| role | string | `driver`, `manager`, `admin`, `superadmin`, `super_admin` |
| timestamps | - | created_at, updated_at |

### Drivers Table
| Column | Type | Purpose |
|--------|------|---------|
| id | bigint | Primary key |
| user_id | FK→users | Link to user account |
| license_no | string | Driver's license number |
| license_exp | date | License expiry |
| passport_photo | string/null | Photo URL |
| push_token | string/null | Expo push notification token |
| push_token_updated_at | timestamp/null | Last push token update |
| last_tracking_report | timestamp/null | Last GPS status report |
| tracking_status | string | `active` or `inactive` |

### Vehicles Table
| Column | Type | Purpose |
|--------|------|---------|
| id | bigint | Primary key |
| vehicle_id | string (unique) | Auto-generated reference (e.g., `veh001`) |
| name | string/null | Display name (make + model) |
| make | string/null | Vehicle make (e.g., Toyota) |
| model | string/null | Vehicle model |
| year | integer/null | Year of manufacture |
| vin / chassis_number | string/null | Chassis/VIN number |
| license_plate | string (unique) | Plate number |
| vehicle_license | string/null | Vehicle license doc info |
| road_worthiness | string/null | Road-worthiness certificate ref |
| insurance | string/null | Insurance policy ref |
| stage_carriage | string/null | Stage carriage permit ref |
| mot | string/null | MOT certificate ref |
| hackney | string/null | Hackney permit ref |
| lg_papers | string/null | LG local govt papers ref |
| battery | string/null | Battery details |
| odometer | integer/null | Mileage/odometer reading |
| vendor | string/null | Vendor/assignee |
| base_location | string/null | Home/depot location |
| color | string/null | Vehicle color |
| assigned_user | string/null | Currently assigned user |
| status | string | `active`, `in_shop`, `inactive` |
| latitude | decimal(7)/null | Registered location lat |
| longitude | decimal(7)/null | Registered location lng |

### Trips Table
| Column | Type | Purpose |
|--------|------|---------|
| id | bigint | Primary key |
| vehicle_id | FK→vehicles | Assigned vehicle |
| driver_id | FK→drivers | Assigned driver |
| start_time | timestamp | Trip start |
| end_time | timestamp/null | Trip end |
| start_odometer | decimal/null | Odometer at start |
| end_odometer | decimal/null | Odometer at end |
| start_location | string/null | Starting location name |
| end_location | string/null | Ending location name |
| distance_km | decimal/null | Distance traveled |
| duration_minutes | integer/null | Duration in minutes |
| notes | text/null | Trip notes |
| status | string | `active` or `completed` |

### Locations Table (GPS Pings)
| Column | Type | Purpose |
|--------|------|---------|
| id | bigint | Primary key |
| vehicle_id | FK→vehicles | Vehicle being tracked |
| latitude | decimal | GPS latitude |
| longitude | decimal | GPS longitude |
| speed | integer | Speed in km/h |
| heading | integer/null | Direction in degrees |
| recorded_at | timestamp | Time of GPS reading |

### Maintenances Table
| Column | Type | Purpose |
|--------|------|---------|
| id | bigint | Primary key |
| vehicle_id | FK→vehicles | Vehicle being serviced |
| type | string | `Regular Servicing` or `Repair` |
| service_type | string | Type of service |
| diagnosis | text/null | Diagnosis description |
| work_to_be_done | text/null | Work description |
| vehicle_location | string/null | Where vehicle is located |
| handled_by | string/null | Mechanic name |
| supervised_by | string/null | Supervisor name |
| company | string/null | Service company |
| vehicle_user | string/null | Current vehicle user |
| cost | decimal | Service cost in NGN |
| date | date | Service date |
| status | string | `Pending`, `Accepted`, `Rejected` |
| reviewer_comment | text/null | Approval/rejection comment |
| assigned_to | FK→users|null | Who reviews this request |
| created_by | FK→users | Who submitted the request |

### Fuel Logs Table
| Column | Type | Purpose |
|--------|------|---------|
| id | bigint | Primary key |
| vehicle_id | FK→vehicles | Vehicle fueled |
| driver_id | FK→drivers|null | Driver who fueled |
| liters | decimal | Liters of fuel |
| cost | decimal | Total cost in NGN |
| odometer_at_fill | decimal | Odometer reading |
| date | date | Fueling date |
| status | string | `Pending`, `Accepted`, `Rejected` |
| reviewer_comment | text/null | Approval/rejection comment |
| assigned_to | FK→users|null | Who reviews this request |
| created_by | FK→users | Who submitted the request |

### Documents Table (Compliance)
| Column | Type | Purpose |
|--------|------|---------|
| id | bigint | Primary key |
| documentable_type | morph | `Vehicle` or `Driver` |
| documentable_id | morph | Related entity ID |
| document_type | string | e.g., Insurance, License |
| expiry_date | date/null | Expiry date for alerts |
| url | string/null | Document file URL |

### Other Tables
- **Inspections**: Vehicle inspection records
- **Maintenance Schedules**: Scheduled maintenance tasks
- **Geofences**: Geographic boundary definitions
- **Notifications**: Database notification system

### Chat Tables
**Conversations** — id, `is_group` (bool), `name` (nullable), timestamps
**conversation_user** — pivot table: conversation_id, user_id, timestamps
**Messages** — id, conversation_id, `sender_id` (FK users), `content` (text), `image_path` (nullable, stores to `public/chat-images`), `read_at` (nullable), timestamps. Appends computed `image_url` attribute.

### Settings Table
| Column | Type | Purpose |
|--------|------|---------|
| id | bigint | Primary key |
| key | string (unique) | Setting key (`tracker_type`, `map_provider`) |
| value | text/null | Setting value |
| timestamps | - | created_at, updated_at |

Settings the app manages:
- `tracker_type`: `mobile_app`, `traccar`, `osmand`, `custom_iot`
- `map_provider`: `map_libre`, `google_maps`

---

## 5. API Endpoints

### Authentication
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/mobile/login` | None | Driver login (rate limited: 10/min) |
| GET | `/api/user` | Sanctum | Get current user |

### Driver Tracking
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/driver/active-trip` | Sanctum | Check active trip assignment |
| GET | `/api/driver/should-track` | Sanctum | Check if tracking should be active |
| POST | `/api/driver/report-status` | Sanctum | Report tracking status |
| POST | `/api/driver/auto-ping` | Sanctum | Auto-submit location ping |

### Telematics
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/telematics/location` | Sanctum | Submit GPS location |
| GET | `/api/telematics/osmand` | None | OsmAnd tracker (requires `secret` param) |
| GET | `/api/fleet/vehicles/locations` | Sanctum | Get all vehicle locations |

### Push Notifications
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/push/force-start` | Sanctum | Force-start tracking (manager+) |
| POST | `/api/push/register-token` | Sanctum | Register Expo push token |

### Chat System
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/chat/users` | Sanctum | List users available to chat with (role-filtered) |
| GET | `/api/chat/conversations` | Sanctum | List current user's conversations (with latest message) |
| POST | `/api/chat/users/{otherUser}` | Sanctum | Get or create a 1-on-1 conversation |
| GET | `/api/chat/conversations/{conversation}/messages` | Sanctum | Get all messages (participant only) |
| POST | `/api/chat/conversations/{conversation}/messages` | Sanctum | Send text and/or image (10MB max) |

### Settings
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/settings` | — | Get all key/value settings |
| POST | `/api/settings` | role-guarded | Update tracker_type & map_provider |

### Web Routes (Inertia)
All web routes are under `auth` and `verified` middleware:
- `/dashboard` — Live map with vehicle locations
- `/dashboard/vehicles` — CRUD for vehicles
- `/dashboard/drivers` — CRUD for drivers
- `/dashboard/trips` — Trip management (start/end)
- `/dashboard/maintenance` — Maintenance logs with approval
- `/dashboard/fuel` — Fuel logs with approval
- `/dashboard/compliance` — Document compliance tracking
- `/dashboard/reports` — Cost reports and summaries
- `/dashboard/financial-reports` — Financial/cost reporting
- `/dashboard/chat` — Real-time team messaging (text + images)
- `/dashboard/users` — User role management (admin+)
- `/dashboard/notifications` — Notification center
- `/profile` — User profile settings
- `/settings` — System settings (tracker type, map provider; role: superadmin/admin/manager)

---

## 6. Approval Workflow

### Maintenance & Fuel Requests

```
                ┌──────────────────────┐
                │  Request Submitted   │
                │  (any role)          │
                └──────────┬───────────┘
                           │
                    ┌──────▼──────┐
                    │  Cost check │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   ≤ ₦20,000          > ₦20,000          > ₦20,000
   (bypass)          (admin route)      (superadmin route)
        │                  │                  │
        ▼                  ▼                  ▼
  ┌──────────┐     ┌──────────────┐     ┌──────────────┐
  │  Admin   │     │   Admin      │     │  Superadmin  │
  │ √/✗      │     │  adds comment│     │  √/✗         │
  │ directly │     │  → forwards  │     │  directly    │
  └──────────┘     └──────┬───────┘     └──────────────┘
        │                  │
        ▼                  ▼
  ┌──────────┐     ┌──────────────┐
  │ Creator  │     │ Superadmin   │
  │ & Driver │     │ reviews,     │
  │ notified │     │ √/✗ decides  │
  └──────────┘     └──────────────┘
                          │
                          ▼
                    ┌──────────────┐
                    │ Creator,     │
                    │ Driver,      │
                    │ Admin all    │
                    │ notified     │
                    └──────────────┘
```

---

## 7. Live Map & Real-Time Tracking

### Architecture
1. **Driver App** sends GPS coordinates every 5 seconds via `POST /api/telematics/location`
2. **Backend** processes via `ProcessVehicleLocation` job, stores in `locations` table
3. **Web Dashboard** receives updates via two methods:
   - **WebSocket** (Laravel Reverb) — real-time push
   - **Polling fallback** — `GET /dashboard/fleet/locations` every 10 seconds
4. **FleetMap component** renders vehicle markers with:
   - Active driver name overlay
   - Moving animation for location updates
   - Trip status indicator

### Driver App Auto-Enforcement
1. On login, app checks for active trip → auto-starts GPS tracking
2. Checks `GET /api/driver/should-track` every 30 seconds
3. If server reports no recent pings but trip is active → auto-restarts tracking
4. Reports status via `POST /api/driver/report-status`
5. On app foreground detection → re-checks and enforces tracking

---

## 8. User Roles & Permissions

| Role | Capabilities |
|------|-------------|
| **Driver** | Can view maintenance/fuel for assigned vehicle (mobile app) |
| **Manager** | Can log maintenance/fuel requests; CANNOT approve/reject; can force-start tracking |
| **Admin** | Full CRUD on vehicles/drivers; can approve/reject ≤₦20,000 requests; can forward >₦20,000 to superadmin |
| **Superadmin** | Full CRUD; approves/rejects >₦20,000 requests; manages user roles |
| **Super Admin** | Same as superadmin |

---

## 9. Push Notifications

Uses **Expo Push Notifications** to communicate with the app users. Push tokens live on the **users** table (`push_token`, `push_token_updated_at`) so both drivers and managers receive them:

1. **Register Token**: App calls `POST /api/push/register-token` with the Expo push token on login
2. **Force Start**: Admin clicks "FORCE START" on Vehicles page → sends notification to driver
3. **Request Submitted**: Notification sent to assigned reviewer when maintenance/fuel logged
4. **Request Actioned**: Notification sent to creator when request approved/rejected
5. **Chat Messages**: Offline recipients get a push (`channelId: 'chat-messages'`, `type: 'chat_message'`) when a new chat message arrives

---

## 10. Chat & Messaging

The system includes a built-in 1-on-1 team chat between drivers and managers, available on **both** the web dashboard and the driver mobile app.

### Backend Flow
1. **Conversation lookup/creation** — `POST /api/chat/users/{otherUser}` finds an existing 1-on-1 conversation or creates one (pivot `conversation_user`).
2. **Send** — `POST /api/chat/conversations/{id}/messages` accepts text and/or image (max 10MB, validated `image|mimes:jpeg,jpg,png,gif,webp`). Images store to `storage/app/public/chat-images`.
3. **Broadcast** — sends `MessageSent` event (`ShouldBroadcastNow`) on private channel `conversation.{id}` with broadcast name `message.sent`.
4. **Push fallback** — for offline/background recipients, sends an Expo push notification (`channelId: 'chat-messages'`, type `chat_message`) to the recipient's `push_token` on the **users** table.
5. **Reliability** — the frontend combines WebSocket (`window.Echo.private('conversation.{id}')`) with a 5-second HTTP polling fallback.

### Channel Authorization
```
Broadcast::channel('conversation.{id}', fn ($user, $id) =>
    $user->conversations()->where('conversations.id', $id)->exists());
```

### Who Can Chat With Whom
| Current User | Can Chat With |
|--------------|---------------|
| Driver | Other drivers + managers |
| Manager | Drivers + other managers |
| Admin/Superadmin | All users |

### Clients
- **Web**: `resources/js/Pages/Dashboard/Chat.jsx` — user list, conversation pane, image attach + lightbox.
- **Mobile**: `driver-app/src/screens/ChatListScreen.js` + `ChatScreen.js`, using `laravel-echo` over **Reverb** (`driver-app/src/api/echo.js`), reusing the Sanctum bearer token for broadcast auth.

---

## 11. Exports

### Supported Formats
- **PDF** — Using jsPDF + jspdf-autotable
- **CSV** — Using xlsx library
- **Excel (XLSX)** — Using xlsx library

### Exportable Data
- Vehicles registry
- Maintenance logs
- Fuel logs
- Driver list
- Trips history
- Compliance documents

---

## 12. Configuration

### Key Environment Variables
| Variable | Purpose |
|----------|---------|
| `APP_ENV` | Environment (local/production) |
| `APP_DEBUG` | Debug mode (should be `false` in production) |
| `APP_KEY` | Laravel application key |
| `DB_*` | PostgreSQL connection settings |
| `REVERB_*` | WebSocket server configuration |
| `MAIL_*` | Email configuration |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key for address search |

### CORS
- No explicit CORS config file — uses Laravel's default middleware
- API accepts requests from any origin (for mobile app access)

---

## 13. Security Measures Implemented

| Issue | Fix |
|-------|-----|
| OsmAnd endpoint unauthenticated | Added shared secret check (`secret` query param) |
| Push notification abuse | Role check: only manager+ can force-start |
| API rate limiting | `throttle:10,1` on login, `throttle:60,1` on API routes |
| User data exposure | Sanitized API responses with `->only()` |
| Brute force protection | Login rate-limited |
| Debug route exposed | Route removed |
| Latitude/longitude injection | Validation with `between` bounds |

---

## 14. Development Setup

### Prerequisites
- PHP 8.3+
- Composer
- Node.js 20+
- PostgreSQL
- Expo CLI (for mobile app)

### Backend Setup
```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
npm install
npm run build
```

### Run Development
```bash
php artisan serve
php artisan queue:listen
npm run dev
```

### Mobile App Setup
```bash
cd driver-app
npm install
npx expo start
```

---

## 15. Deployment

The project is configured for **Laravel Cloud** deployment:
- `cloud.yml` — Deployment configuration
- `LARAVEL_CLOUD_SETUP.md` — Setup instructions

### Production Checklist
- [ ] Set `APP_ENV=production` and `APP_DEBUG=false`
- [ ] Generate production `APP_KEY`
- [ ] Remove `.env` from version control
- [ ] Configure production database credentials
- [ ] Set up email service (not `log` driver)
- [ ] Configure Reverb for production WebSocket
- [ ] Set up queue worker for location processing
- [ ] Configure CORS for production domains

---

## 16. Key Code References

### Backend Controllers
- `DashboardController.php` — Main CRUD (vehicles, drivers, trips, maintenance, fuel, compliance, reports, financial-reports, users) + bulk imports
- `TelematicsController.php` — GPS location ingestion (mobile app + OsmAnd)
- `DriverTrackingController.php` — Auto-tracking enforcement endpoints
- `PushNotificationController.php` — Expo push notifications
- `ChatController.php` — 1-on-1 chat (users, conversations, messages, image upload)
- `SettingsController.php` — tracker_type & map_provider settings
- `NotificationController.php` — In-app notification management

### Frontend Pages
- `Index.jsx` — Main dashboard with live Google Maps
- `Vehicles.jsx` — Vehicle registry + trip management (start/end/force-start)
- `Maintenance.jsx` — Service logs with approval workflow (incl. "Under Review")
- `Fuel.jsx` — Fuel logs with approval workflow (incl. "Under Review")
- `Trips.jsx` — Trip history with filters
- `Drivers.jsx` — Driver management with passport upload
- `Compliance.jsx` — Document expiry tracking
- `Chat.jsx` — Real-time team chat (WebSocket + polling, image attachments)
- `FinancialReports.jsx` — Financial/cost reporting and summaries

### Models
- `Vehicle.php` — Has many: trips, locations, maintenances, fuelLogs, documents, inspections, maintenanceSchedules; auto-generates `vehicle_id` (veh###)
- `Trip.php` — Belongs to: vehicle, driver
- `Maintenance.php` — Belongs to: vehicle, creator, assigned reviewer
- `FuelLog.php` — Belongs to: vehicle, driver, creator, assigned reviewer
- `Driver.php` — Belongs to: user
- `Location.php` — Belongs to: vehicle
- `Document.php` — Morphable to: vehicle, driver
- `Conversation.php` — Belongs to many: users; has many: messages
- `Message.php` — Belongs to: conversation, sender; computes `image_url`
- `Setting.php` — Key/value store
- `User.php` — Has one driver, belongs to many conversations, has many messages; holds `push_token`

### Role Middleware
`RoleMiddleware` (`role:superadmin,admin,manager`) guards sensitive routes like the settings update (`/settings`).

---

## 17. Future Considerations

- **Automated Geofencing** — Alert when vehicle enters/leaves defined zones
- **Fuel Efficiency Reports** — Track liters/km ratio over time
- **Maintenance Schedule Automation** — Auto-flag when service is due
- **Multi-tenant Support** — Separate fleets for different organizations
- **Mobile Offline Mode** — Queue locations when offline, sync when online
- **Driver Performance Metrics** — Speeding alerts, idling time, route efficiency
- **Integration APIs** — OpenAPI/Swagger documentation for third-party integrators

---

*Document generated: July 29, 2026*
*Project: FKG.Fleet Fleet Management System*