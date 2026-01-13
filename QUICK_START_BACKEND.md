
# 🚀 Quick Start Guide for Backend Developers

## TL;DR

The frontend is **100% ready** and waiting for backend endpoints. Start with user registration endpoints to make the app functional.

---

## 🎯 Start Here: Implement These 4 Endpoints First

### 1. POST /api/users/parent
**Why:** Parents can't register without this
**Request:**
```json
{
  "email": "parent@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "state": "California",
  "town": "Los Angeles",
  "zipCode": "90001",
  "serviceCategories": ["birth", "postpartum"],
  "financingType": ["self", "carrot"],
  "acceptedTerms": true
}
```
**Response:**
```json
{
  "success": true,
  "userId": "parent_123456",
  "profile": { /* full profile object */ }
}
```

---

### 2. POST /api/users/doula
**Why:** Doulas can't register without this
**Request:**
```json
{
  "email": "doula@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "state": "California",
  "town": "Los Angeles",
  "zipCode": "90001",
  "paymentPreferences": ["self", "carrot"],
  "driveDistance": 25,
  "spokenLanguages": ["English", "Spanish"],
  "hourlyRateMin": 30,
  "hourlyRateMax": 50,
  "serviceCategories": ["birth", "postpartum"],
  "certifications": ["doula_certification"],
  "profilePictureUrl": "https://storage.example.com/profile.jpg",
  "acceptedTerms": true
}
```
**Response:**
```json
{
  "success": true,
  "userId": "doula_123456",
  "profile": { /* full profile object */ }
}
```

---

### 3. POST /api/upload/profile-picture
**Why:** Doulas need to upload profile pictures
**Request:** `multipart/form-data` with `image` field
**Response:**
```json
{
  "success": true,
  "url": "https://storage.example.com/profiles/doula_123456.jpg"
}
```

---

### 4. POST /api/upload/certification
**Why:** Doulas need to upload certification documents
**Request:** `multipart/form-data` with `document` field
**Response:**
```json
{
  "success": true,
  "url": "https://storage.example.com/certifications/cert_123456.pdf"
}
```

---

## 🧪 Test Your Endpoints

### Test Registration (After Implementing)
```bash
# Test parent registration
curl -X POST https://58wab47v29usdn5dvkdh2bb8tmk9hce6.app.specular.dev/api/users/parent \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "Parent",
    "state": "California",
    "town": "Los Angeles",
    "zipCode": "90001",
    "serviceCategories": ["birth"],
    "financingType": ["self"],
    "acceptedTerms": true
  }'

# Expected response:
# {"success":true,"userId":"parent_xxx","profile":{...}}
```

---

## 📊 Database Schema (Minimum Required)

### users table
```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  user_type VARCHAR(50) NOT NULL, -- 'parent' or 'doula'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### parent_profiles table
```sql
CREATE TABLE parent_profiles (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  state VARCHAR(100) NOT NULL,
  town VARCHAR(255) NOT NULL,
  zip_code VARCHAR(20) NOT NULL,
  service_categories JSON NOT NULL, -- ["birth", "postpartum"]
  financing_type JSON NOT NULL, -- ["self", "carrot", "medicaid"]
  service_period_start TIMESTAMP,
  service_period_end TIMESTAMP,
  preferred_languages JSON,
  desired_days JSON,
  desired_start_time TIMESTAMP,
  desired_end_time TIMESTAMP,
  accepted_terms BOOLEAN DEFAULT FALSE,
  subscription_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### doula_profiles table
```sql
CREATE TABLE doula_profiles (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  state VARCHAR(100) NOT NULL,
  town VARCHAR(255) NOT NULL,
  zip_code VARCHAR(20) NOT NULL,
  payment_preferences JSON NOT NULL,
  drive_distance INT NOT NULL,
  spoken_languages JSON NOT NULL,
  hourly_rate_min DECIMAL(10,2) NOT NULL,
  hourly_rate_max DECIMAL(10,2) NOT NULL,
  service_categories JSON NOT NULL,
  certifications JSON NOT NULL,
  profile_picture_url TEXT,
  certification_documents JSON,
  referees JSON,
  accepted_terms BOOLEAN DEFAULT FALSE,
  subscription_active BOOLEAN DEFAULT FALSE,
  rating DECIMAL(3,2) DEFAULT 0.00,
  review_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 🔑 Environment Variables Needed

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/doula_connect

# File Storage (AWS S3 example)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=doula-connect-uploads
AWS_REGION=us-east-1

# Email (already configured for OTP)
RESEND_API_KEY=your_resend_api_key

# Frontend URL (for CORS and redirects)
FRONTEND_URL=https://your-frontend-url.com
```

---

## ✅ Checklist: Make the App Functional

- [ ] Set up database with users, parent_profiles, doula_profiles tables
- [ ] Set up file storage (AWS S3, Google Cloud Storage, etc.)
- [ ] Implement POST /api/users/parent endpoint
- [ ] Implement POST /api/users/doula endpoint
- [ ] Implement POST /api/upload/profile-picture endpoint
- [ ] Implement POST /api/upload/certification endpoint
- [ ] Test all endpoints with curl
- [ ] Test registration flow in the app
- [ ] Verify data is saved to database
- [ ] Verify files are uploaded to storage

---

## 🎉 Success Criteria

**You'll know it's working when:**
1. User can complete OTP verification ✅ (already working)
2. User can fill out registration form
3. User can upload profile picture (doulas)
4. User can click "Continue to Payment"
5. **No error message appears** ✅
6. User is redirected to payment screen
7. Data is saved in database

---

## 📚 Full Documentation

For complete specifications, see:
- **`BACKEND_API_REQUIREMENTS.md`** - All endpoint specs
- **`INTEGRATION_STATUS.md`** - Current status
- **`utils/api.ts`** - Frontend API implementation

---

## 🆘 Need Help?

**Common Issues:**

1. **CORS errors**
   - Add frontend URL to CORS whitelist
   - Allow credentials in CORS config

2. **File upload fails**
   - Check multipart/form-data parsing
   - Verify S3 credentials and permissions
   - Check file size limits

3. **Database errors**
   - Verify table schemas match specifications
   - Check foreign key constraints
   - Ensure JSON columns are properly handled

4. **Frontend shows "Backend Not Ready"**
   - Endpoint is not implemented yet
   - Endpoint URL doesn't match (check path)
   - Endpoint returns wrong status code

---

## 🚀 Deploy Checklist

Before deploying:
- [ ] All 4 critical endpoints implemented
- [ ] Database migrations run
- [ ] File storage configured
- [ ] Environment variables set
- [ ] CORS configured for frontend URL
- [ ] Endpoints tested with curl
- [ ] Error responses return proper format: `{"success": false, "error": "message"}`

---

**Ready to start?** Implement the 4 endpoints above and the app will be functional! 🎉

**Questions?** Check the full documentation in `BACKEND_API_REQUIREMENTS.md`
