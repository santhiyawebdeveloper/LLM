# HR Evaluation Guide — Shopify LMS

Step-by-step instructions for an HR evaluator or technical reviewer to independently install, authenticate, and test this application **without access to the developer's personal Shopify account**.

---

## 1. Project

**Shopify LMS Application**

A Shopify embedded Learning Management System for managing courses, students, and enrollments inside Shopify Admin. Built with React, Polaris, Node.js, Express, MongoDB Atlas, and Shopify Admin GraphQL API.

---

## 2. Live Application

| Item | URL |
|------|-----|
| **Production app** | https://shopify-lms-three.vercel.app |
| **Health check** | https://shopify-lms-three.vercel.app/health |
| **API health** | https://shopify-lms-three.vercel.app/api/health |
| **Readiness check** | https://shopify-lms-three.vercel.app/api/ready |

Expected `/health` response:

```json
{ "status": "ok" }
```

Expected `/api/health` response:

```json
{ "success": true, "message": "Server is running" }
```

---

## 3. GitHub Repository

https://github.com/santhiyawebdeveloper/LLM.git

---

## 4. Shopify Installation

### Distribution method

This app is **not published to the Shopify App Store**. Evaluators install it on their **own Shopify development store** using the supported OAuth install URL. No access to the developer's personal Shopify account is required.

### Prerequisites

1. Free [Shopify Partner account](https://partners.shopify.com)
2. A Shopify **development store** (Partner Dashboard → Stores → Add store → Create development store)
3. Modern browser (Chrome, Edge, or Firefox)

### Install steps

1. Create your **own** development store in Partner Dashboard → **Stores** → **Add store** → **Create development store**
2. Note the domain, e.g. `your-eval-store.myshopify.com`
3. **Log in to that store's admin** (`https://your-eval-store.myshopify.com/admin`) — not only the Partner Dashboard
4. Open this URL (replace `YOUR-STORE`):

   ```
   https://shopify-lms-three.vercel.app/install?shop=YOUR-STORE.myshopify.com
   ```

   Alternative (Shopify managed install):

   ```
   https://admin.shopify.com/oauth/install?client_id=2836a433d92ea24f9977e98df209bb47
   ```

5. Approve permissions (`read_products`) and click **Install app**
6. Open the embedded app: **Shopify Admin → Apps → LMS**

### If you see "Unauthorized Access"

This error comes from **Shopify**, not the LMS app code. Common causes:

| Cause | Fix |
|-------|-----|
| Wrong store type | Use a **Partner development store** you created. Do not use restricted/special stores. |
| Not logged into store admin | Log in to `https://YOUR-STORE.myshopify.com/admin` before installing |
| App is Custom distribution | Developer must set **Public distribution** in Partner Dashboard → Apps → LMS → App distribution |
| Missing install permission | Store owner must grant you permission to install apps |

**Developer one-time fix (required for HR evaluators):** Partner Dashboard → **Apps → LMS → App distribution → Public distribution**. Without Public distribution, only whitelisted stores can install the app.

### Direct URL behavior

Opening `https://shopify-lms-three.vercel.app` directly in a browser (without Shopify context) shows instructions only. **No private LMS data is exposed.** This is correct embedded-app behavior.

---

## 5. Authentication Test

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Complete OAuth install URL | Redirected into Shopify Admin with app installed |
| 2 | Open **Apps → LMS** | Embedded Polaris UI loads inside Shopify Admin |
| 3 | Navigate Dashboard, Courses, Students | No login form; Shopify session handles auth |
| 4 | Refresh the page | Session persists; no re-login required |
| 5 | Navigate between pages | Auth remains valid |

**Manual verification required:** Full OAuth and embedded session flow must be tested in browser inside Shopify Admin.

---

## 6. Course Test

1. Go to **Courses** → create a course with:
   - Title: `React Advanced LMS`
   - Description: `Advanced React course for evaluation`
   - Instructor: `Jane Instructor`
   - Category: `Technology`
   - Duration: `30`
   - Status: `Active`
2. Save and verify the course appears in the list
3. Open course details — verify all fields display
4. Edit the title to `React Advanced LMS (Updated)` and save
5. Verify the updated title in list and detail views
6. Delete any enrollments for this course first (if any)
7. Delete the course and confirm deletion

**Expected:** Full course CRUD works with success messages and confirmation dialog on delete.

---

## 7. Validation Test

Test course form validation:

| Input | Expected |
|-------|----------|
| Empty title | "Title is required" |
| Empty description | "Description is required" |
| Invalid duration (0 or negative) | Duration validation error |
| Invalid status | Rejected by server validation |

Test student validation:

| Input | Expected |
|-------|----------|
| Empty name | "Name is required" |
| Invalid email (`not-an-email`) | "Valid email is required" |

**Expected:** User-friendly validation messages next to fields (client) and consistent API errors (server).

---

## 8. Student Test

1. Go to **Students** → create student:
   - Name: `Test Student`
   - Email: `student@example.com`
2. Verify student appears in the list with name, email, enrollment count
3. Open student details — verify profile and enrollments section
4. Open **Student Dashboard** — verify enrolled courses, dates, and statuses

**Expected:** Student create, list, detail, and dashboard all work.

---

## 9. Enrollment Test

1. Go to **Enrollments** → create enrollment
2. Select the student and course created above
3. Save
4. Verify enrollment appears with status **In Progress** and today's date
5. Change status to **Completed**
6. Go to **Dashboard** — verify counts update (completed +1, in-progress decreases)

**Expected:** Enrollment persists with correct status and dashboard reflects changes.

---

## 10. Duplicate Enrollment Test

1. Enroll Student A into Course A (if not already enrolled)
2. Attempt the same enrollment again

**Expected:**
- Error message: **"Student is already enrolled in this course."**
- HTTP 409 response
- No duplicate record in the database (protected by unique index `{ storeId, studentId, courseId }`)

---

## 11. Dashboard Test

Go to **Dashboard** and verify:

| Element | Expected |
|---------|----------|
| Total Courses | Matches number of courses created |
| Total Students | Matches number of students created |
| Total Enrollments | Matches enrollments created |
| Completed | Matches completed enrollments |
| In Progress | Matches in-progress enrollments |
| Connected Shopify Store | Real store name, domain, email, shop ID from GraphQL |
| Recent Enrollments | Student, email, course, date, status |

---

## 12. Shopify Integration Test

### Store Information

1. Dashboard → **Connected Shopify Store** card, or
2. Sidebar → **Shopify → Store Information**

**Expected:** Real data from your development store (not mock):
- Shop ID, name, email, myshopifyDomain

### Products

1. Sidebar → **Shopify → Products**

**Expected:** Products from your dev store via Shopify Admin GraphQL API (may be empty if store has no products).

**Manual verification required:** GraphQL integration requires authenticated embedded session with valid Shopify access token.

---

## 13. Persistence Test

1. Create at least one course, student, and enrollment
2. Refresh the browser while inside Shopify Admin (Apps → LMS)
3. Navigate between all pages

**Expected:**
- Courses, students, enrollments, and statuses remain
- Authentication remains valid
- No data loss

---

## 14. Error Handling Test

| Scenario | Expected |
|----------|----------|
| Direct URL access (no Shopify context) | Instructions page; no LMS data exposed |
| API without auth (`/api/courses`) | HTTP 401 Unauthorized |
| Duplicate enrollment | HTTP 409 + friendly message |
| Invalid MongoDB ObjectId in URL | HTTP 400 Invalid ID |
| Missing required fields on create | HTTP 422 validation error |
| Delete course with enrollments | Error — must remove enrollments first |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 on API calls | Open from Shopify Admin (Apps → LMS), not direct Vercel URL |
| OAuth redirect error | Verify install URL store domain; check callback URL in Partner Dashboard |
| App not in Apps menu | Re-run install URL and complete OAuth |
| GraphQL store info fails | Reinstall app to refresh access token |
| `/dashboard` returns error | Ensure you open via Shopify Admin, not direct URL |
| Health check fails | Verify `/api/health` returns 200 |

---

## App Configuration Reference

| Setting | Value |
|---------|-------|
| App name | LMS |
| Client ID | `2836a433d92ea24f9977e98df209bb47` |
| App URL | `https://shopify-lms-three.vercel.app` |
| OAuth callback | `https://shopify-lms-three.vercel.app/api/auth/callback` |
| Webhook | `https://shopify-lms-three.vercel.app/api/webhooks` |
| Scopes | `read_products` |
| Embedded | Yes |
| Production config file | `shopify.app.lms.toml` |

---

## Manual Verification Checklist

The following require browser testing inside Shopify Admin:

- [ ] OAuth install on evaluator's own development store
- [ ] Embedded app loads in Shopify Admin iframe
- [ ] Session persists after refresh
- [ ] Course CRUD in production
- [ ] Student create and dashboard
- [ ] Enrollment and duplicate prevention
- [ ] Shopify GraphQL store info and products
- [ ] Multi-tenant isolation (optional: two dev stores)

For architecture and deployment details, see [README.md](./README.md).
