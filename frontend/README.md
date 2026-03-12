#  Cryptographically Secure Policy Governance System

A secure backend system for managing and enforcing policies using **cryptographic integrity, digital signatures, and multi-admin approval**.

This system ensures that policies cannot be tampered with and can only be applied after **cryptographic verification and sufficient administrator approvals**.

---

#  Features

*  **Policy Integrity using SHA256 Hashing**
*  **Digital Signatures using Ed25519**
*  **Multi-Admin Approval System**
*  **Tamper Detection**
*  **Policy Versioning**
*  **Policy History Tracking**
*  **Separation of Duties (Creator cannot sign)**

---

# How the System Works

##  Policy Creation

When a policy is created:

* Policy content is structured
* A **SHA256 hash** is generated from immutable fields
* The policy is saved in the **draft folder**

```
policy_hash = SHA256(policy_content)
```

This ensures the policy cannot be modified without detection.

---

##  Policy Signing

Admins approve policies using **digital signatures**.

Each admin signs the **policy hash** using their private key.

```
signature = Sign(private_key, policy_hash)
```

The signature is stored inside the policy file.

Example:

```json
"signatures": [
  {
    "admin": "admin2",
    "signature": "8a3f9c..."
  }
]
```

Security rules enforced:

* Creator **cannot sign their own policy**
* Same admin **cannot sign twice**

---

##  Policy Verification

Before enforcement, the system verifies:

1. Policy integrity
2. Digital signatures
3. Minimum approval requirement

### Integrity Verification

The system recomputes the hash:

```
recalculated_hash = SHA256(policy_content)
```

If the hash does not match:

```
POLICY TAMPERED
```

---

### Signature Verification

Each signature is verified using the admin's **public key**.

```
Verify(public_key, signature, policy_hash)
```

Only valid signatures are counted.

Minimum required signatures:

```
REQUIRED_SIGNATURES = 2
```

---

## 4️Policy Enforcement

Once verified:

* Draft policy is moved to **active folder**
* Policy becomes the **currently enforced system policy**

```
draft → active/history
draft → active_policy.json
```

The system maintains a **history of all policies**.

---

 

---

#  Cryptographic Components

| Component   | Purpose                       |
| ----------- | ----------------------------- |
| SHA256      | Policy integrity verification |
| Ed25519     | Digital signatures            |
| Public Key  | Signature verification        |
| Private Key | Signature generation          |

---

#  Policy Lifecycle

```
Create Policy
      ↓
Generate SHA256 Hash
      ↓
Store in Draft
      ↓
Admins Sign Policy
      ↓
Verify Hash + Signatures
      ↓
Apply Policy
      ↓
Move to Active Folder
```

---
# API Endpoints

## Create Policy

```
POST /create-policy
```

Creates a new draft policy.

---

## Sign Policy

```
POST /sign-policy
```

Admin signs a policy using their private key.

---

## Verify Policy

```
POST /verify-policy
```

Checks:

* Hash integrity
* Digital signatures
* Required approvals

---

## Apply Policy

```
POST /apply-policy
```

Applies the verified policy and moves it to the active state.

---

# 🛡 Security Guarantees

This system provides:

* **Integrity** – Policies cannot be altered without detection
* **Authentication** – Only authorized admins can sign
* **Non-Repudiation** – Admins cannot deny their signatures
* **Multi-Party Approval** – Policies require multiple signatures
* **Auditability** – All policies are stored with version history

 