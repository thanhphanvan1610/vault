/**
 * FortressPass WebAuthn/Passkey Service
 * 
 * Provides secure biometric/hardware key authentication
 * for convenient vault unlocking without master password.
 */

import { startRegistration, startAuthentication } from '@simplewebauthn/browser'

export class WebAuthnService {
  private readonly rpId = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
  private readonly rpName = 'FortressPass Web'

  /**
   * Check if WebAuthn is supported in current browser
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 
           window.PublicKeyCredential !== undefined &&
           typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
  }

  /**
   * Check if platform authenticator (biometrics) is available
   */
  async isPlatformAuthenticatorAvailable(): Promise<boolean> {
    if (!this.isSupported()) return false
    
    try {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    } catch (error) {
      return false
    }
  }

  /**
   * Generate WebAuthn registration options
   */
  generateRegistrationOptions(userEmail: string): PublicKeyCredentialCreationOptions {
    const userId = new TextEncoder().encode(userEmail)
    
    return {
      rp: {
        name: this.rpName,
        id: this.rpId,
      },
      user: {
        id: userId,
        name: userEmail,
        displayName: userEmail,
      },
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      timeout: 60000,
      attestation: 'none',
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        requireResidentKey: true,
      },
    }
  }

  /**
   * Register new WebAuthn credential
   */
  async registerCredential(userEmail: string): Promise<{ credentialId: string; publicKey: string }> {
    if (!this.isSupported()) {
      throw new Error('WebAuthn not supported in this browser')
    }

    try {
      const options = this.generateRegistrationOptions(userEmail)
      const credential = await navigator.credentials.create({ publicKey: options }) as PublicKeyCredential
      
      if (!credential) {
        throw new Error('Failed to create credential')
      }

      const response = credential.response as AuthenticatorAttestationResponse
      
      return {
        credentialId: credential.id,
        publicKey: Array.from(new Uint8Array(response.publicKey!))
          .map(byte => byte.toString(16).padStart(2, '0'))
          .join(''),
      }
    } catch (error) {
      throw new Error(`WebAuthn registration failed: ${error}`)
    }
  }

  /**
   * Generate WebAuthn authentication options
   */
  generateAuthenticationOptions(credentialId: string): PublicKeyCredentialRequestOptions {
    return {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      timeout: 60000,
      rpId: this.rpId,
      allowCredentials: [{
        type: 'public-key',
        id: this.base64ToArrayBuffer(credentialId),
      }],
      userVerification: 'required',
    }
  }

  /**
   * Authenticate with existing WebAuthn credential
   */
  async authenticateCredential(credentialId: string): Promise<{ signature: string; authenticatorData: string }> {
    if (!this.isSupported()) {
      throw new Error('WebAuthn not supported in this browser')
    }

    try {
      const options = this.generateAuthenticationOptions(credentialId)
      const credential = await navigator.credentials.get({ publicKey: options }) as PublicKeyCredential
      
      if (!credential) {
        throw new Error('Authentication failed')
      }

      const response = credential.response as AuthenticatorAssertionResponse
      
      return {
        signature: Array.from(new Uint8Array(response.signature))
          .map(byte => byte.toString(16).padStart(2, '0'))
          .join(''),
        authenticatorData: Array.from(new Uint8Array(response.authenticatorData))
          .map(byte => byte.toString(16).padStart(2, '0'))
          .join(''),
      }
    } catch (error) {
      throw new Error(`WebAuthn authentication failed: ${error}`)
    }
  }

  /**
   * Derive encryption key from WebAuthn authentication data
   */
  async deriveKeyFromWebAuthn(signature: string, authenticatorData: string): Promise<Uint8Array> {
    const combinedData = signature + authenticatorData
    const encoder = new TextEncoder()
    const data = encoder.encode(combinedData)
    
    // Use SHA-256 to derive a consistent 32-byte key
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    return new Uint8Array(hashBuffer)
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
  }
}

export const webAuthnService = new WebAuthnService()