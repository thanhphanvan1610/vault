/**
 * FortressPass Cryptographic Service
 * 
 * This service implements the core zero-knowledge cryptographic operations
 * for FortressPass Web. All sensitive operations occur client-side only.
 * 
 * Security Features:
 * - Argon2id key derivation with secure parameters
 * - XChaCha20-Poly1305 authenticated encryption
 * - Cryptographically secure random salt/nonce generation
 * - Master key never leaves client memory
 */

import sodium from 'libsodium-wrappers'

export interface PasswordEntry {
  id: string
  title: string
  username: string
  password: string
  url: string
  notes: string
  created_at: string
  updated_at: string
}

export interface VaultData {
  entries: PasswordEntry[]
  version: number
  created_at: string
  updated_at: string
}

class CryptoService {
  private isInitialized = false
  private masterKey: Uint8Array | null = null

  /**
   * Initialize libsodium - must be called before any crypto operations
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return
    
    await sodium.ready
    this.isInitialized = true
  }

  /**
   * Generate a cryptographically secure random salt for key derivation
   * This salt is not secret and will be stored on the server
   */
  generateSalt(): string {
    this.ensureInitialized()
    const salt = sodium.randombytes_buf(16) // 128 bits
    return sodium.to_base64(salt)
  }

  /**
   * Derive encryption key from master password using Argon2id
   * 
   * Parameters chosen for security:
   * - Memory: 64MB (67108864 bytes)
   * - Iterations: 3
   * - Parallelism: 1 (browser limitation)
   * - Output: 32 bytes (256 bits)
   */
  async deriveMasterKey(masterPassword: string, saltB64: string): Promise<Uint8Array> {
  this.ensureInitialized()
  
  const salt = sodium.from_base64(saltB64)

  // phải có await ở đây
  const masterKey = await sodium.crypto_pwhash(
    32, // độ dài output
    masterPassword,
    salt,
    3, // iterations
    67108864, // 64MB
    sodium.crypto_pwhash_ALG_ARGON2ID
  )

  this.masterKey = new Uint8Array(masterKey)
  return this.masterKey
}

  /**
   * Encrypt vault data using XChaCha20-Poly1305 AEAD
   * A new random nonce is generated for each encryption
   */
  encryptVault(vaultData: VaultData): string {
    this.ensureInitialized()
    if (!this.masterKey) {
      throw new Error('Master key not derived. Call deriveMasterKey first.')
    }

    // Serialize vault data
    const plaintext = JSON.stringify(vaultData)
    const plaintextBytes = sodium.from_string(plaintext)
    
    // Generate random nonce (192 bits for XChaCha20)
    const nonce = sodium.randombytes_buf(24)
    
    // Encrypt with authentication
    const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      plaintextBytes,
      null, // no additional data
      null, // no secret nonce
      nonce,
      this.masterKey
    )
    
    // Combine nonce + ciphertext and encode
    const combined = new Uint8Array(nonce.length + ciphertext.length)
    combined.set(nonce)
    combined.set(ciphertext, nonce.length)
    
    return sodium.to_base64(combined)
  }

  /**
   * Decrypt vault data using XChaCha20-Poly1305 AEAD
   * Automatically verifies authenticity and integrity
   */
  decryptVault(encryptedData: string): VaultData {
    this.ensureInitialized()
    if (!this.masterKey) {
      throw new Error('Master key not derived. Call deriveMasterKey first.')
    }

    try {
      const combined = sodium.from_base64(encryptedData)
      
      // Extract nonce and ciphertext
      const nonce = combined.slice(0, 24)
      const ciphertext = combined.slice(24)
      
      // Decrypt and verify authentication
      const decrypted = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
        null, // no secret nonce
        ciphertext,
        null, // no additional data
        nonce,
        this.masterKey
      )
      
      // Parse JSON
      const plaintext = sodium.to_string(decrypted)
      return JSON.parse(plaintext) as VaultData
    } catch (error) {
      throw new Error('Vault decryption failed. Invalid master password or corrupted data.')
    }
  }

  /**
   * Securely generate a random password
   */
  generatePassword(length: number = 16, includeSymbols: boolean = true): string {
    this.ensureInitialized()
    
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const numbers = '0123456789'
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    
    let charset = uppercase + lowercase + numbers
    if (includeSymbols) {
      charset += symbols
    }
    
    let password = ''
    for (let i = 0; i < length; i++) {
      const randomIndex = sodium.randombytes_uniform(charset.length)
      password += charset[randomIndex]
    }
    
    return password
  }

  /**
   * Create wrapped master key for WebAuthn/Passkey unlock
   * The master key is encrypted with a WebAuthn-derived key
   */
  async wrapMasterKeyForWebAuthn(webAuthnKey: Uint8Array): Promise<string> {
    this.ensureInitialized()
    if (!this.masterKey) {
      throw new Error('Master key not available for wrapping')
    }

    const nonce = sodium.randombytes_buf(24)
    const wrapped = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      this.masterKey,
      null,
      null,
      nonce,
      webAuthnKey
    )

    const combined = new Uint8Array(nonce.length + wrapped.length)
    combined.set(nonce)
    combined.set(wrapped, nonce.length)

    return sodium.to_base64(combined)
  }

  /**
   * Unwrap master key using WebAuthn-derived key
   */
  async unwrapMasterKeyFromWebAuthn(wrappedKey: string, webAuthnKey: Uint8Array): Promise<void> {
    this.ensureInitialized()

    try {
      const combined = sodium.from_base64(wrappedKey)
      const nonce = combined.slice(0, 24)
      const wrapped = combined.slice(24)

      const unwrapped = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
        null,
        wrapped,
        null,
        nonce,
        webAuthnKey
      )

      this.masterKey = new Uint8Array(unwrapped)
    } catch (error) {
      throw new Error('Failed to unwrap master key with WebAuthn credentials')
    }
  }

  /**
   * Clear master key from memory (logout)
   */
  clearMasterKey(): void {
    if (this.masterKey) {
      // Securely zero the key material
      this.masterKey.fill(0)
      this.masterKey = null
    }
  }

  /**
   * Check if master key is available
   */
  isMasterKeyAvailable(): boolean {
    return this.masterKey !== null
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('CryptoService not initialized. Call initialize() first.')
    }
  }
}

export const cryptoService = new CryptoService()