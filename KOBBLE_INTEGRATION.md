# Kobble API Integration Guide

This document explains the integration of Kobble API for beneficiary management when users add bank accounts.

## Overview

When a user creates a bank account in the AdvanzPay system, the application automatically:

1. **Authenticates** with Kobble API using OAuth2 client credentials flow
2. **Creates a beneficiary** in the Kobble payment system with the bank account details

## Architecture

### Files Created/Modified

1. **`src/services/KobbleApiService.ts`** - New service to handle Kobble API interactions
2. **`src/controller/bankAccount/BankAccountController.ts`** - Updated to integrate Kobble API

### Flow Diagram

```
User adds bank account
        ↓
Save account to database
        ↓
Get OAuth2 token from Kobble
        ↓
Create beneficiary in Kobble
        ↓
Return response to user
```

## KobbleApiService

### Features

- **Token Caching**: OAuth2 tokens are cached and reused until they expire
- **Automatic Token Refresh**: Tokens are automatically refreshed when they expire
- **Error Handling**: Comprehensive error handling for API failures
- **Singleton Pattern**: Single instance manages all API interactions

### Configuration

Current configuration (hardcoded in the service):

```typescript
AUTH_URL = 'https://cognito.staging.apikobble.net/oauth2/token';
BENEFICIARY_URL = 'https://staging.apikobble.net/customers/v1/beneficiaries';
CLIENT_ID = '49bvjcsndpnrj1urd6dt2qo1vg';
CLIENT_SECRET = '17ppj73nu2lrv7t0nqhb9d7n1d71ggv38q1cu29rg3pqq17gr250';
SCOPE = 'client/write';
```

### Methods

#### `getAccessToken()`

- Private method to get OAuth2 access token
- Caches tokens with 60-second buffer before expiry
- Returns cached token if still valid

#### `createBeneficiary(bankAccount)`

- Public method to create a beneficiary
- Parameters:
  - `accountNumber`: Bank account number
  - `holderName`: Account holder name
  - `bankName`: Bank name
  - `branch`: BSB code (optional, defaults to '111-111')

#### `getWalletBalance()`

- Public method to get wallet balance from Kobble
- Returns the `total_amount` of the first wallet
- Used by Admin Analytics for account balance display
- Returns 0 if no wallets found or error occurs

#### `clearTokenCache()`

- Public method to clear cached token
- Useful for testing or forced refresh

## BankAccountController Integration

### Updated `create()` Method

The create method now:

1. Validates input and saves the bank account to the database
2. Calls `kobbleApiService.createBeneficiary()` to create the beneficiary
3. Handles success/failure scenarios:

   **Success Case:**

   - Beneficiary ID is included in the response
   - Account creation succeeds

   **Failure Case:**

   - Error is logged but doesn't fail the entire operation
   - Warning message included in response
   - Bank account still created in local database

### Response Format

**Successful response with beneficiary creation:**

```json
{
  "id": "123",
  "accountNumber": "05293193",
  "holderName": "Mike Smith",
  "bankName": "Westpac",
  "branch": "111-111",
  "nickname": "My Savings",
  "isDefault": true,
  "isActive": true,
  "createdAt": "2025-12-03T10:00:00.000Z",
  "updatedAt": "2025-12-03T10:00:00.000Z",
  "kobbleBeneficiaryId": "beneficiary-id-from-kobble"
}
```

**Response when beneficiary creation fails:**

```json
{
  "id": "123",
  "accountNumber": "05293193",
  "holderName": "Mike Smith",
  "bankName": "Westpac",
  "branch": "111-111",
  "nickname": "My Savings",
  "isDefault": true,
  "isActive": true,
  "createdAt": "2025-12-03T10:00:00.000Z",
  "updatedAt": "2025-12-03T10:00:00.000Z",
  "kobbleWarning": "Beneficiary creation in payment system failed"
}
```

## Error Handling Strategy

The current implementation uses a **non-blocking error handling strategy**:

- Bank account creation **succeeds** even if Kobble API fails
- Errors are logged for monitoring
- Warning message is returned to the client

### Alternative Strategies

If you want different behavior, you can modify the error handling:

#### Option 1: Fail the entire operation

```typescript
try {
  const beneficiaryResponse = await this.kobbleApiService.createBeneficiary(...);
} catch (kobbleErr: any) {
  // Delete the saved account
  await this.BankAccountRepo.remove(savedAccount);

  return responseFormatter.error(req, res, {
    statusCode: 500,
    status: false,
    message: 'Failed to create beneficiary in payment system'
  });
}
```

#### Option 2: Mark account for manual review

```typescript
try {
  const beneficiaryResponse = await this.kobbleApiService.createBeneficiary(...);
} catch (kobbleErr: any) {
  // Add a flag to the account
  savedAccount.needsManualReview = true;
  savedAccount.reviewReason = 'Beneficiary creation failed';
  await this.BankAccountRepo.save(savedAccount);
}
```

## Security Considerations

### Current Implementation

- Credentials are hardcoded in the service (suitable for staging/development)
- OAuth2 token is cached for performance

### Production Recommendations

1. **Move credentials to environment variables:**

```typescript
private readonly CLIENT_ID = process.env.KOBBLE_CLIENT_ID;
private readonly CLIENT_SECRET = process.env.KOBBLE_CLIENT_SECRET;
```

2. **Add environment-specific URLs:**

```typescript
private readonly AUTH_URL = process.env.KOBBLE_AUTH_URL;
private readonly BENEFICIARY_URL = process.env.KOBBLE_API_URL;
```

3. **Implement credential rotation strategy**

4. **Add request/response logging for audit trails**

5. **Consider encrypting sensitive data in transit**

## Testing

### Manual Testing

1. **Create a bank account:**

```bash
curl --location 'http://localhost:3000/api/bank-accounts' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--header 'Content-Type: application/json' \
--data '{
    "accountNumber": "05293193",
    "holderName": "Mike Smith",
    "bankName": "Westpac",
    "branch": "111-111",
    "nickname": "My Account"
}'
```

2. **Check the logs** for beneficiary creation status

3. **Verify response** includes `kobbleBeneficiaryId` or `kobbleWarning`

### Testing Token Caching

```typescript
const kobbleService = KobbleApiService.getInstance();

// First call - gets new token
await kobbleService.createBeneficiary(accountData1);

// Second call - uses cached token
await kobbleService.createBeneficiary(accountData2);

// Clear cache
kobbleService.clearTokenCache();

// Next call - gets new token
await kobbleService.createBeneficiary(accountData3);
```

## Monitoring & Logging

All Kobble API interactions are logged:

- Token acquisition success/failure
- Beneficiary creation success/failure
- API error responses

Example logs:

```
Creating beneficiary in Kobble system...
Beneficiary created successfully with ID: ben_123456
```

Or in case of error:

```
Failed to create beneficiary in Kobble: Invalid account number
```

## Future Enhancements

1. **Retry Logic**: Add automatic retry for failed API calls
2. **Webhook Integration**: Listen for beneficiary status updates from Kobble
3. **Batch Operations**: Support bulk beneficiary creation
4. **Beneficiary Updates**: Sync updates when bank account details change
5. **Database Field**: Add `kobbleBeneficiaryId` field to BankAccount entity
6. **Admin Dashboard**: UI for viewing/managing beneficiary sync status

## Troubleshooting

### Token Errors

- **Issue**: "Failed to get access token"
- **Solution**: Check CLIENT_ID and CLIENT_SECRET are correct

### Beneficiary Creation Fails

- **Issue**: "Failed to create beneficiary"
- **Possible Causes**:
  - Invalid BSB code format
  - Invalid account number
  - Beneficiary already exists in Kobble
  - Network connectivity issues

### Performance Issues

- **Issue**: Slow account creation
- **Solution**: Token caching should help, but check network latency to Kobble API

## API Reference

### Kobble OAuth2 Token Endpoint

**POST** `https://cognito.staging.apikobble.net/oauth2/token`

```
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
client_id={CLIENT_ID}
client_secret={CLIENT_SECRET}
scope=client/write
```

### Kobble Beneficiary Endpoint

**POST** `https://staging.apikobble.net/customers/v1/beneficiaries`

```json
{
  "bank_name": "Westpac",
  "bank_country": "AUS",
  "bank_code_type": "BSB",
  "bank_code": "111-111",
  "account_number": "05293193",
  "person": {
    "name": "Mike Smith"
  },
  "metadata": {}
}
```

### Kobble Wallet Endpoint

**GET** `https://staging.apikobble.net/customers/v1/wallets`

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Response:**

```json
[
  {
    "id": "ab99bb8c-50db-4f94-b928-44c33d1174f7",
    "external_id": null,
    "account_number": null,
    "bank_code_type": null,
    "bank_code": null,
    "created_at": "2025-11-17T07:12:32.222Z",
    "updated_at": "2025-11-18T15:37:16.395Z",
    "holder_id": "33536dbb-fa74-446a-b3b4-246a0c62bea7",
    "asset": "AUD",
    "asset_class": "CURRENCY",
    "status": "ACTIVE",
    "partner_product": "KOBBLE_AUD_1",
    "total_amount": 100,
    "amount": 100,
    "reserved_amount": 0,
    "owner": "250fc955-98a9-40af-aae8-1891e81cd8c2"
  }
]
```

**Usage:**

- Returns an array of wallet objects
- Used to fetch account balance for admin dashboard
- The `total_amount` of the first wallet is used as the account balance

## Contact

For issues or questions about the Kobble integration, contact the backend team.
