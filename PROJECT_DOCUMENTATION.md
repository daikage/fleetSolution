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
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Api/
│   │   │   │   ├── DriverTrackingController.php
│   │   │   │   ├── PushNotificationController.php
│   │   │   │   └── TelematicsController.php
│   │   │   ├── Auth/              # Laravel Breeze auth
│   │   │   ├── DashboardController.php   # Main CRUD controller
│   │   │   ├── NotificationController.php
│   │   │   └── ProfileController.php
│   │   ├── Middleware/
│   │   │   └── HandleInertiaRequests.php
│   │   └── Requests/
│   ├── Jobs/
│   │   └── ProcessVehicleLocation.php
│   ├── Mail/
│   │   ├── FuelRequestDecision.php
│   │   └── MaintenanceRequestDecision.php
│   ├── Models/
│   │   ├── Document.php
│   │   ├── Driver.php
│   │   ├── FuelLog.php
│   │   ├── Location.php
│   │   ├── Maintenance.php
│   │   ├── MaintenanceSchedule.php
│   │   ├── Trip.php
│   │   ├── User.php
│   │   └── Vehicle.php
│   ├── Notifications/
│   │   ├── ForceStartTracking.php
│   │   ├── RequestActioned.php
│   │   └── RequestSubmitted.php
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
│   │   │   └── config.js
│   │   ├── screens/
│   │   │   ├── LoginScreen.js
│   │   │   └── TrackingScreen.js
│   │   └── tasks/
│   │       └── LocationTask.js
│   ├── App.js
│   └── app.json
├── resources/
│   └── js/
│       ├── Components/
│       │   ├── ExportButtons.jsx
│       │   └── FleetMap.jsx
│       ├── Layouts/
│       │   └── DashboardLayout.jsx
│       ├── Pages/
│       │   ├── Auth/               # Login, Register, etc.
│       │   ├── Dashboard/
│       │   │   ├── Compliance.jsx
│       │   │   ├── Drivers.jsx
│       │   │   ├── Fuel.jsx
│       │   │   ├── Index.jsx       # Main dashboard with live map
│       │   │   ├── Maintenance.jsx
│       │   │   ├── Notifications.jsx
│       │   │   ├── Reports.jsx
│       │   │   ├── Trips.jsx
│       │   │   ├── Users.jsx
│       │   │   └── Vehicles.jsx
│       │   └── Profile/
│       │       └── Partials/
│       ├── Layouts/
│       │   └── DashboardLayout.jsx
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
| make | string | Vehicle make (e.g., Toyota) |
| model | string | Vehicle model |
| year | integer | Year of manufacture |
| vin | string (unique) | VIN number |
| license_plate | string (unique) | Plate number |
| odometer | decimal | Mileage/odometer reading |
| vendor | string/null | Vendor/assignee |
| status | string | `active`, `in_shop`, `inactive` |
| latitude | decimal/null | Registered location lat |
| longitude | decimal/null | Registered location lng |

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
- `/dashboard/users` — User role management (admin+)
- `/dashboard/notifications` — Notification center
- `/profile` — User profile settings

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

Uses **Expo Push Notifications** to communicate with the driver app:

1. **Register Token**: Driver app calls `POST /api/push/register-token` with Expo push token on login
2. **Force Start**: Admin clicks "FORCE START" on Vehicles page → sends notification to driver
3. **Request Submitted**: Notification sent to assigned reviewer when maintenance/fuel logged
4. **Request Actioned**: Notification sent to creator when request approved/rejected

---

## 10. Exports

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

## 11. Configuration

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

## 12. Security Measures Implemented

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

## 13. Development Setup

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

## 14. Deployment

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

## 15. Key Code References

### Backend Controllers
- `DashboardController.php` — Main CRUD (vehicles, drivers, trips, maintenance, fuel, compliance, reports, users)
- `TelematicsController.php` — GPS location ingestion (mobile app + OsmAnd)
- `DriverTrackingController.php` — Auto-tracking enforcement endpoints
- `PushNotificationController.php` — Expo push notifications
- `NotificationController.php` — In-app notification management

### Frontend Pages
- `Index.jsx` — Main dashboard with live Google Maps
- `Vehicles.jsx` — Vehicle registry + trip management (start/end/force-start)
- `Maintenance.jsx` — Service logs with approval workflow
- `Fuel.jsx` — Fuel logs with approval workflow
- `Trips.jsx` — Trip history with filters
- `Drivers.jsx` — Driver management with passport upload
- `Compliance.jsx` — Document expiry tracking

### Models
- `Vehicle.php` — Has many: trips, locations, maintenances, fuelLogs, documents
- `Trip.php` — Belongs to: vehicle, driver
- `Maintenance.php` — Belongs to: vehicle, creator, assigned reviewer
- `FuelLog.php` — Belongs to: vehicle, driver, creator, assigned reviewer
- `Driver.php` — Belongs to: user
- `Location.php` — Belongs to: vehicle
- `Document.php` — Morphable to: vehicle, driver

---

## 16. Future Considerations

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