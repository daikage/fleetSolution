# Laravel Cloud Setup for GPS Tracking

This project uses **queued jobs** for real-time GPS tracking. Without a queue worker running, location updates won't appear on the live map.

## 🔴 Problem You're Experiencing

- Driver app shows "Tracking Active" ✅
- Dashboard map shows **old location** instead of current GPS position ❌
- This happens because the **queue worker isn't processing location jobs**

## ✅ Solution: Deploy Queue Workers on Laravel Cloud

### Step 1: Verify `cloud.yml` is in Your Repository Root

The `cloud.yml` file should be at the root of your project (same level as `composer.json`).

### Step 2: Configure in Laravel Cloud Dashboard

1. Go to **[Laravel Cloud Dashboard](https://cloud.laravel.com)**
2. Select your project
3. Go to **Settings** → **Workers**
4. Click **"Add Worker"**
5. Configure:
   - **Name:** `queue-worker`
   - **Command:** `php artisan queue:work --sleep=3 --tries=3 --max-time=3600`
   - **Min Instances:** `1`
   - **Max Instances:** `2`
6. Click **Save**

### Step 3: Set Environment Variables

In Laravel Cloud → Settings → Environment, ensure these exist:

```env
QUEUE_CONNECTION=database
BROADCAST_CONNECTION=reverb
```

### Step 4: Run Migrations (First Time Only)

```bash
php artisan migrate
```

This creates the `jobs` table needed for the queue.

### Step 5: Deploy

Commit and push the `cloud.yml` to trigger a new deployment:

```bash
git add cloud.yml
git commit -m "Add Laravel Cloud queue worker config"
git push origin main
```

Laravel Cloud will automatically detect the `cloud.yml` and deploy the workers.

## 🧪 How to Test It's Working

1. Open your deployed app URL
2. Go to **Dashboard** → look at bottom-left corner
3. You should see:
   - 🟢 **"Live"** = WebSocket working
   - 🟡 **"Polling"** = Fallback mode (still works)
4. Ask a driver to start tracking
5. Wait 5-10 seconds
6. The map should update to show the driver's actual GPS location

## 🐛 Troubleshooting

### Still showing old location?

1. **Check Laravel Cloud logs:**
   - Dashboard → Deployments → View Logs
   - Look for errors from `queue-worker`

2. **Verify workers are running:**
   - Laravel Cloud → Settings → Workers
   - Should show `1` running instance

3. **Check database jobs table:**
   ```bash
   php artisan tinker
   >>> \App\Models\Job::count(); // Should be 0 if workers are processing
   ```

### Jobs piling up?

Increase the number of workers:
```yaml
# cloud.yml
workers:
  queue-worker:
    autoscaling:
      min: 2
      max: 4
```

## 📊 What the Queue Workers Do

| Worker | Jobs Processed | Frequency |
|--------|---------------|-----------|
| `queue-worker` | GPS location updates, notifications | Every 3 seconds |
| `tracking-worker` | High-priority tracking jobs | Every 1 second |

## 💡 Alternative: Supervisord (If Needed)

If Laravel Cloud's worker feature doesn't work for your setup, you can use a traditional supervisord config:

**`/etc/supervisor/conf.d/queue-worker.conf`**
```
[program:laravel-queue-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/html/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
numprocs=2
redirect_stderr=true
```

Then run:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start laravel-queue-worker:*
```

## 📞 Need Help?

- Laravel Cloud Docs: https://laravel.com/docs/cloud
- Queue Docs: https://laravel.com/docs/queues