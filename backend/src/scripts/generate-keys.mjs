import { generateKeyPair } from 'crypto';
import { promises as fs } from 'fs';

console.log('Generating RSA key pair...');

generateKeyPair(
  'rsa',
  {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  },
  async (err, publicKey, privateKey) => {
    if (err) {
      console.error('Error generating key pair:', err);
      return;
    }

    
    const formattedPrivateKey = privateKey.replace(/\n/g, '\\n');
    const formattedPublicKey = publicKey.replace(/\n/g, '\\n');

    const envContent = `
# ---- RSA KEYS FOR JWT ----
# Key ID for JWKS
JWT_KEY_ID="key-iaa-admin-2025-01"

# Private key for signing tokens
JWT_PRIVATE_KEY="${formattedPrivateKey}"

# Public key for JWKS endpoint
JWT_PUBLIC_KEY="${formattedPublicKey}"
`;

    console.log('\n✅ Key pair generated successfully!');
    console.log('\nAdd the following lines to your .env.local file:\n');
    console.log(envContent);
  },
);