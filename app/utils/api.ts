import { IUserMetadata } from "@/types";
import { env } from "@/config";

export const checkExpeditionProgress = async (address: string): Promise<IUserMetadata> => {
  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method: 'checkExpeditionProgress', params: { user: address } }),
  });
  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data as IUserMetadata;
};

export const submitInviteCode = async (
  address: string,
  inviteCode: string,
  twitterUsername: string,
  tgUsername: string,
  about: string,
  commitmentAmount: string,
): Promise<IUserMetadata> => {
  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/info`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method: 'useInviteCode',
      params: {
        user: address,
        invite_code: inviteCode,
        twitter_username: twitterUsername,
        tg_username: tgUsername,
        about: about,
        commitment_amount: commitmentAmount,
      },
    } as const),
  });
  const data = await response.json();

  // Check for error response from API
  if (data.error) {
    throw new Error(data.error);
  }

  if (!data.user_metadata) {
    throw new Error('Invalid response from server');
  }

  return data.user_metadata as IUserMetadata;
};

export interface SignLegalTermsResponse {
  success: boolean;
  message: string;
  terms_version: string;
  signed_at: number;
}

export const signLegalTerms = async (
  accountAddress: string,
  signature: string,
  termsVersion: string,
): Promise<SignLegalTermsResponse> => {
  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/legal-terms/sign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      account_address: accountAddress,
      signature: signature,
      terms_version: termsVersion,
    }),
  });
  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data as SignLegalTermsResponse;
};

export interface LegalTermsStatusResponse {
  signed: boolean;
}

export const getLegalTermsStatus = async (
  userAddress: string,
): Promise<LegalTermsStatusResponse> => {
  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/info`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method: 'legalTermsStatus',
      params: {
        user: userAddress,
      },
    }),
  });
  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data as LegalTermsStatusResponse;
};

const TESTNET_API_URL = 'https://testnet-api.hotstuff.trade';

/** Check if user has metadata on testnet (for Testnet OG badge on mainnet). Calls testnet API directly. */
export const checkTestnetUserMetadata = async (
  address: string,
): Promise<{ hasMetadata: boolean }> => {
  try {
    const response = await fetch(`${TESTNET_API_URL}/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'userMetadata',
        params: { user: address },
      }),
    });
    const data = await response.json();
    const hasMetadata = !data.error && data.user_address != null;
    return { hasMetadata };
  } catch {
    return { hasMetadata: false };
  }
};
