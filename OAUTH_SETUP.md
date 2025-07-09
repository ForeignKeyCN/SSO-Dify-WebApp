# OAuth Setup Guide

## Environment Variables Required

Create a `.env.local` file in the project root with the following variables:

```bash
# Azure AD OAuth Configuration
NEXT_PUBLIC_AZURE_CLIENT_ID=your_azure_client_id_here
NEXT_PUBLIC_AZURE_TENANT_ID=common
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000/auth/callback

# Backend Azure AD Configuration (for server-side token exchange)
AZURE_CLIENT_ID=your_azure_client_id_here
AZURE_CLIENT_SECRET=your_azure_client_secret_here

# Dify Configuration
NEXT_PUBLIC_API_PREFIX=http://localhost:5001
NEXT_PUBLIC_APP_ID=your_dify_app_id_here
```

## Azure AD App Registration Setup

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to "Azure Active Directory" > "App registrations"
3. Click "New registration"
4. Fill in the details:
   - **Name**: Your app name
   - **Supported account types**: "Accounts in any organizational directory and personal Microsoft accounts"
   - **Redirect URI**: `http://localhost:3000/auth/callback` (for development)

5. After registration, note down:
   - **Application (client) ID** → Use as `NEXT_PUBLIC_AZURE_CLIENT_ID`
   - **Directory (tenant) ID** → Use as `NEXT_PUBLIC_AZURE_TENANT_ID`

6. Go to "Certificates & secrets" and create a new client secret:
   - Click "New client secret"
   - Add description and choose expiration
   - Copy the **Value** → Use as `AZURE_CLIENT_SECRET`

7. Go to "API permissions" and add these permissions:
   - **Microsoft Graph** > **User.Read**
   - **Microsoft Graph** > **Mail.Read**
   - **Microsoft Graph** > **Mail.ReadWrite**
   - **Microsoft Graph** > **Mail.Send**
   - **Microsoft Graph** > **Calendars.Read**

8. Click "Grant admin consent" for your organization

## How It Works

1. **User clicks "Login with Microsoft"** → Opens Azure AD popup
2. **User authenticates** → Azure AD redirects to `/auth/callback` with code
3. **Callback page processes code** → Exchanges code for access token
4. **Token is stored** → Both in localStorage and server-side
5. **User can now chat** → Access token is available for backend use

## Files Created/Modified

- `service/auth.ts` - OAuth service
- `app/auth/callback/page.tsx` - OAuth callback page
- `app/api/auth/callback/route.ts` - Backend token exchange
- `app/api/auth/validate/route.ts` - Token validation
- `hooks/use-auth.ts` - Authentication hook
- `app/components/welcome/index.tsx` - Updated with auth integration
- `app/components/welcome/massive-component.tsx` - Updated ChatBtn

## Testing

1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Click "Login with Microsoft" button
4. Complete Azure AD authentication
5. Verify you can start chatting after authentication 