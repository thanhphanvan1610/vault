# FortressPass Web - Zero-Knowledge Password Manager

A secure, client-side encrypted password manager built with Next.js and Supabase. FortressPass implements military-grade encryption with a zero-knowledge architecture, ensuring your passwords are always encrypted before leaving your device.

## 🔐 Security Features

- **Zero-Knowledge Architecture**: Your data is encrypted locally before storage
- **Argon2id Key Derivation**: Industry-standard password-based key derivation
- **XChaCha20-Poly1305 Encryption**: Authenticated encryption with additional data (AEAD)
- **WebAuthn/Passkey Support**: Biometric vault unlocking
- **Automatic Clipboard Clearing**: Passwords auto-clear after 30 seconds
- **Row Level Security**: Database-level access controls

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase project with the provided database schema

### Environment Setup

1. Clone this repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up the database schema by running the migration in `supabase/migrations/create_user_vaults.sql`

5. Start the development server:
```bash
npm run dev
```

### Database Setup

Execute the SQL migration file in your Supabase SQL editor:
- Navigate to your Supabase project dashboard
- Go to the SQL Editor
- Copy and execute the contents of `supabase/migrations/create_user_vaults.sql`

## 🛡️ Security Architecture

### Zero-Knowledge Principle

FortressPass implements a true zero-knowledge architecture:

1. **Master Password**: Never transmitted or stored anywhere
2. **Key Derivation**: Happens entirely in the browser using Argon2id
3. **Encryption**: All data encrypted client-side with XChaCha20-Poly1305
4. **Server Storage**: Only encrypted blobs are stored, server cannot decrypt

### Cryptographic Flow

1. **User Registration**: Create Supabase auth account (separate from master password)
2. **Vault Creation**: Generate salt, derive key from master password, create encrypted vault
3. **Data Storage**: Single encrypted JSON blob stored in database
4. **Unlock Process**: Retrieve salt, re-derive key, decrypt vault locally
5. **WebAuthn Enhancement**: Wrap/unwrap master key with biometric authentication

### Key Technologies

- **libsodium-wrappers**: WebAssembly cryptographic library
- **Supabase**: Backend-as-a-Service for auth and encrypted storage
- **Next.js**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS + shadcn/ui**: Modern UI components

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
├── components/             # React components
│   ├── auth/              # Authentication components
│   ├── vault/             # Password vault components
│   └── ui/                # Reusable UI components
├── lib/                   # Core services and utilities
│   ├── crypto-service.ts  # Client-side cryptography
│   ├── supabase-service.ts # Database operations
│   ├── webauthn-service.ts # WebAuthn/Passkey handling
│   ├── clipboard-service.ts # Secure clipboard operations
│   └── store.ts           # Application state management
├── supabase/              # Database migrations
└── docs/                  # Documentation
```

## 🔧 Core Services

### CryptoService
Handles all cryptographic operations:
- Argon2id key derivation
- XChaCha20-Poly1305 encryption/decryption
- Password generation
- WebAuthn key wrapping

### SupabaseService
Manages server interactions:
- User authentication
- Encrypted vault storage
- Row Level Security enforcement

### WebAuthnService
Provides biometric authentication:
- Credential registration
- Authentication ceremonies
- Key derivation from biometric data

## 🌐 Deployment

### Build for Production

```bash
npm run build
```

The app is configured for static export and can be deployed to any static hosting service.

### Recommended Deployment Platforms

- **Vercel**: Optimal for Next.js applications
- **Netlify**: Excellent static site hosting
- **GitHub Pages**: Free static hosting option

## 📚 Usage Guide

### First Time Setup
1. Create account with email/password (for authentication only)
2. Create strong Master Password (this encrypts your data)
3. Optionally register WebAuthn/Passkey for convenient unlocking
4. Start adding your passwords

### Daily Usage
1. Sign in to your account
2. Unlock vault with Master Password or biometric
3. Add, edit, or copy passwords as needed
4. Vault automatically saves and syncs across devices

### Security Best Practices
- Use a unique, strong Master Password
- Enable WebAuthn/Passkey when available
- Regularly update weak passwords (app identifies them)
- Keep your recovery phrase secure

## 🔒 Security Considerations

### What We Can See
- User email addresses (for authentication)
- Encrypted vault blobs (completely unreadable)
- Salt values (not secret, needed for key derivation)
- Access timestamps and metadata

### What We Cannot See
- Your Master Password
- Your actual passwords
- Website URLs, usernames, or notes
- Any plaintext data from your vault

### Threat Model
FortressPass is designed to protect against:
- Server breaches (encrypted data is useless)
- Network interception (only encrypted data transmitted)
- Malicious administrators (zero-knowledge architecture)
- Device theft (master password still required)

## 🤝 Contributing

We welcome security audits and contributions. Please review our security architecture before contributing and report any vulnerabilities responsibly.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Important Notes

- **Master Password Recovery**: If you forget your Master Password, your data cannot be recovered
- **Browser Requirements**: Modern browser with WebAssembly support required
- **Internet Connection**: Required for syncing, but vault works offline once loaded
- **Backup**: Consider keeping an encrypted export of critical passwords

---

Built with security and privacy as the highest priorities. Your passwords, your control.