import { importSPKI, exportJWK } from 'jose';

const getPublicKey = () => {
  const publicKey = process.env.JWT_PUBLIC_KEY;
  if (!publicKey) {
    throw new Error('JWT_PUBLIC_KEY is not set in environment variables');
  }
  return publicKey.replace(/\\n/g, '\n');
};

export async function GET() {
  try {
    const publicKeyPem = getPublicKey();
    const keyId = process.env.JWT_KEY_ID!;

    const ecPublicKey = await importSPKI(publicKeyPem, 'RS256');
    const jwk = await exportJWK(ecPublicKey);

    const jwks = {
      keys: [
        {
          ...jwk,
          kid: keyId,
          use: 'sig',
          alg: 'RS256',
        },
      ],
    };

    return new Response(JSON.stringify(jwks), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    console.error('JWKS Error:', error);
    return new Response(
      JSON.stringify({ message: 'An unexpected error occurred' }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    );
  }
}