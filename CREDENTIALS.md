# Initial Login Credentials

## Default Admin Accounts

After running the database seed (`npm run prisma:seed`), the following default accounts are created:

### Super Administrator

- **Email:** `admin@elections.ke`
- **Password:** `Admin@2024!Secure`
- **Role:** `super_admin`
- **National ID:** `00000001`

### Election Manager

- **Email:** `manager@elections.ke`
- **Password:** `Manager@2024!Secure`
- **Role:** `election_manager`
- **National ID:** `00000002`

## ⚠️ IMPORTANT SECURITY NOTICE

### First Login Actions Required:

1. **Change Default Passwords Immediately**

   - Login with default credentials
   - Navigate to Settings → Change Password
   - Use a strong, unique password

2. **Delete or Disable Unused Accounts**

   - If you don't need both accounts, disable the unused one
   - Go to User Management → Users → Deactivate

3. **Enable MFA (When Implemented)**
   - Enable Multi-Factor Authentication for all admin accounts

### Password Requirements:

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&\*(),.?":{}|<>)

## User Registration

### Secured Registration Process

User registration is **NOT publicly accessible**. New users can only be created by:

1. **Super Administrators** (`super_admin` role)
2. **Election Managers** (`election_manager` role)

### Creating New Users:

```bash
# Login as admin first
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@elections.ke",
    "password": "Admin@2024!Secure"
  }'

# Use the accessToken from response
export TOKEN="your_access_token_here"

# Register new user (requires admin authentication)
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "nationalId": "12345678",
    "email": "newuser@elections.ke",
    "firstName": "John",
    "lastName": "Doe",
    "password": "SecurePass123!",
    "phoneNumber": "+254712345678"
  }'
```

## User Roles

### super_admin

- Full system access
- Can manage elections, users, and system settings
- Can register new users
- Cannot be deleted or deactivated

### election_manager

- Manage elections and contests
- Register field observers
- View all results and reports
- Cannot modify system settings

### field_observer (Default)

- Submit polling station results
- Report incidents
- Upload photos with GPS coordinates
- View assigned polling stations

### public_viewer

- Read-only access to published results
- No data submission capabilities

## Seeding the Database

```bash
# Using Docker
docker compose exec api npm run prisma:seed

# Local development
cd backend
npm run prisma:seed
```

## Resetting the Database (Development Only)

⚠️ **WARNING:** This will delete ALL data!

```bash
# Using Docker
docker compose exec api npm run db:reset

# Local development
cd backend
npm run db:reset
```

## Production Deployment

### Before Going Live:

1. **Change all default passwords**
2. **Create production-specific admin accounts**
3. **Delete or disable seed accounts**
4. **Set strong JWT secrets** in environment variables
5. **Enable HTTPS** and SSL certificates
6. **Configure proper CORS origins**
7. **Enable rate limiting**
8. **Set up monitoring and alerts**
9. **Regular security audits**
10. **Implement backup procedures**

## Troubleshooting

### Cannot Login with Default Credentials

1. **Check if database is seeded:**

   ```bash
   docker compose exec api npx prisma studio
   # Look for users with emails: admin@elections.ke, manager@elections.ke
   ```

2. **Re-run seed script:**

   ```bash
   docker compose exec api npm run prisma:seed
   ```

3. **Check database connection:**
   ```bash
   docker compose logs database
   docker compose logs api
   ```

### Account Locked

After 5 failed login attempts, accounts are automatically locked. Contact a super administrator to unlock or reset the account through Prisma Studio.

## Support

For security concerns or issues:

- Review [Security Documentation](./SECURITY.md)
- Check [API Documentation](./backend/src/domains/auth/README.md)
- Contact system administrator
