// Utility to generate VAPID keys for push notifications
// Run this once to generate your keys, then add them to secrets and .env

export async function generateVapidKeys() {
  try {
    // Generate ECDSA P-256 key pair
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true,
      ['sign', 'verify']
    );

    // Export public key
    const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const publicKeyArray = new Uint8Array(publicKeyBuffer);
    
    // Export private key
    const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    const privateKeyArray = new Uint8Array(privateKeyBuffer);

    // Convert to base64url format
    const publicKey = arrayBufferToBase64Url(publicKeyArray);
    const privateKey = arrayBufferToBase64Url(privateKeyArray);

    return {
      publicKey,
      privateKey,
    };
  } catch (error) {
    console.error('Error generating VAPID keys:', error);
    throw error;
  }
}

function arrayBufferToBase64Url(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode.apply(null, Array.from(buffer)));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Helper function to display keys in console
export async function displayVapidKeys() {
  console.log('🔑 Generating VAPID Keys...\n');
  
  const keys = await generateVapidKeys();
  
  console.log('✅ VAPID Keys Generated Successfully!\n');
  console.log('📋 Copy these values:\n');
  console.log('='.repeat(80));
  console.log('\n1️⃣ PUBLIC KEY (add to .env as VITE_VAPID_PUBLIC_KEY):');
  console.log(`\n${keys.publicKey}\n`);
  console.log('='.repeat(80));
  console.log('\n2️⃣ PRIVATE KEY (keep this SECRET - already in Supabase secrets):');
  console.log(`\n${keys.privateKey}\n`);
  console.log('='.repeat(80));
  console.log('\n📝 Instructions:');
  console.log('1. Go to Settings > Secrets in Lovable');
  console.log('2. Update VAPID_PUBLIC_KEY with the public key above');
  console.log('3. Update VAPID_PRIVATE_KEY with the private key above');
  console.log('4. Add to your .env file (you need to export project and edit locally):');
  console.log('   VITE_VAPID_PUBLIC_KEY="your-public-key-here"');
  console.log('\n⚠️  IMPORTANT: Never commit the private key to Git!');
  
  return keys;
}
