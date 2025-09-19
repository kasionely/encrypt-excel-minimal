export async function generateKeyPair() {
    return await crypto.subtle.generateKey(
        {
            name: 'RSA-OAEP',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt']
    );
}


export async function encryptCell(text: string, publicKey: CryptoKey): Promise<string> {
    const encoded = new TextEncoder().encode(text);
    const encrypted = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, encoded);
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}


export async function decryptCell(text: string, privateKey: CryptoKey): Promise<string> {
    const buffer = Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
    const decrypted = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, buffer);
    return new TextDecoder().decode(decrypted);
}