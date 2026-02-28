import { Address } from 'viem';
import { recoverMessageAddress, recoverTypedDataAddress } from 'viem';
import { AuthActions } from '@/stores/slices/auth-slice';

type RecoverDeps = Pick<AuthActions, 'setAddress' | 'setMaster' | 'setAgent' | 'setStatus'> & {
  setModal: (modal: string | null) => void;
};

export async function recoverFromQrPayload(raw: string, deps: RecoverDeps) {
  const { setAddress, setMaster, setAgent, setStatus, setModal } = deps;
  try {
    const decoded = JSON.parse(decodeURIComponent(escape(atob(raw))));
    const { signature, typedData, message, agent, signer: signerFromPayload } = decoded || {};

    // Agent-only payload (no signature) for QR-generated agents.
    if (!signature || !typedData) {
      if (agent?.address && agent?.privateKey && signerFromPayload) {
        const finalSigner = signerFromPayload as `0x${string}`;
        setAddress(finalSigner);
        setMaster(finalSigner);
        setAgent(finalSigner, {
          name: agent.name ?? 'qr-wallet',
          address: agent.address as Address,
          privateKey: agent.privateKey,
        });
        setStatus('trading-enabled');
        setModal(null);
        return { success: true, signer: finalSigner };
      }
      throw new Error('Invalid QR payload');
    }

    let signer: `0x${string}`;

    if (typedData) {
      const typedMessage = {
        ...typedData.message,
        nonce: BigInt(typedData.message?.nonce ?? 0),
      };

      signer = await recoverTypedDataAddress({
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: typedMessage,
        signature: signature as `0x${string}`,
      });
    } else {
      signer = await recoverMessageAddress({
        message,
        signature: signature as `0x${string}`,
      });
    }

    const finalSigner = (signerFromPayload ?? signer) as `0x${string}`;

    setAddress(finalSigner);
    setMaster(finalSigner);

    if (agent?.address && agent?.privateKey) {
      setAgent(finalSigner, {
        name: agent.name ?? 'qr-wallet',
        address: agent.address as Address,
        privateKey: agent.privateKey,
      });
      setStatus('trading-enabled');
    } else {
      setStatus('connected');
    }

    setModal(null);
    return { success: true, signer: finalSigner };
  } catch (error) {
    console.error('QR link login failed', error);
    return { success: false, error };
  }
}

export function extractLinkParam(input: string) {
  try {
    const url = new URL(input);
    const linkParam = url.searchParams.get('link');
    if (linkParam) return linkParam;
  } catch {
    /* not a URL */
  }
  return input;
}
