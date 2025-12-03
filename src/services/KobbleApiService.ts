import axios, { AxiosInstance } from 'axios';

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface BeneficiaryRequest {
  bank_name: string;
  bank_country: string;
  bank_code_type: string;
  bank_code: string;
  account_number: string;
  person: {
    name: string;
  };
  metadata?: Record<string, any>;
}

interface BeneficiaryResponse {
  id?: string;
  status?: string;
  [key: string]: any;
}

export default class KobbleApiService {
  private static instance: KobbleApiService;
  private axiosInstance: AxiosInstance;
  private tokenCache: {
    token: string | null;
    expiresAt: number | null;
  };

  // Kobble API Configuration
  private readonly AUTH_URL = 'https://cognito.staging.apikobble.net/oauth2/token';
  private readonly BENEFICIARY_URL = 'https://staging.apikobble.net/customers/v1/beneficiaries';
  private readonly CLIENT_ID = '49bvjcsndpnrj1urd6dt2qo1vg';
  private readonly CLIENT_SECRET = '17ppj73nu2lrv7t0nqhb9d7n1d71ggv38q1cu29rg3pqq17gr250';
  private readonly SCOPE = 'client/write';

  private constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.tokenCache = {
      token: null,
      expiresAt: null
    };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): KobbleApiService {
    if (!KobbleApiService.instance) {
      KobbleApiService.instance = new KobbleApiService();
    }
    return KobbleApiService.instance;
  }

  /**
   * Get OAuth2 access token with caching
   */
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid cached token
    const now = Date.now();
    if (this.tokenCache.token && this.tokenCache.expiresAt && this.tokenCache.expiresAt > now) {
      return this.tokenCache.token;
    }

    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', this.CLIENT_ID);
      params.append('client_secret', this.CLIENT_SECRET);
      params.append('scope', this.SCOPE);

      const response = await axios.post<TokenResponse>(this.AUTH_URL, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const { access_token, expires_in } = response.data;

      // Cache the token with a buffer (reduce expiry by 60 seconds for safety)
      this.tokenCache.token = access_token;
      this.tokenCache.expiresAt = now + (expires_in - 60) * 1000;

      return access_token;
    } catch (error: any) {
      console.error('Error getting Kobble access token:', error.response?.data || error.message);
      throw new Error(`Failed to get access token: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Create a beneficiary in Kobble system
   */
  public async createBeneficiary(bankAccount: { accountNumber: string; holderName: string; bankName: string; branch?: string }): Promise<BeneficiaryResponse> {
    try {
      // Get access token
      const accessToken = await this.getAccessToken();

      // Parse BSB code from branch or use default
      // Expected format: "XXX-XXX" or just "XXXXXX"
      let bsbCode = '111-111'; // Default
      if (bankAccount.branch && bankAccount.branch !== 'N/A') {
        bsbCode = bankAccount.branch;
      }

      // Prepare beneficiary request payload
      const beneficiaryData: BeneficiaryRequest = {
        bank_name: bankAccount.bankName,
        bank_country: 'AUS', // Default to Australia, can be configurable
        bank_code_type: 'BSB',
        bank_code: bsbCode,
        account_number: bankAccount.accountNumber,
        person: {
          name: bankAccount.holderName
        },
        metadata: {}
      };

      // Make API call to create beneficiary
      const response = await this.axiosInstance.post<BeneficiaryResponse>(this.BENEFICIARY_URL, beneficiaryData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Beneficiary created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating beneficiary:', error.response?.data || error.message);

      // Rethrow with more context
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      throw new Error(`Failed to create beneficiary: ${errorMessage}`);
    }
  }

  /**
   * Clear token cache (useful for testing or forced refresh)
   */
  public clearTokenCache(): void {
    this.tokenCache.token = null;
    this.tokenCache.expiresAt = null;
  }
}
