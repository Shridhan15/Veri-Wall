import json
import hashlib
import os
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization

REQUIRED_SIGNATURES = 2

def load_public_key(admin_name):
    """Loads the public key to verify an admin's signature."""
    path = f"keys/{admin_name}_public.pem"
    if not os.path.exists(path):
        raise FileNotFoundError(f"Public key for {admin_name} not found.")
        
    with open(path, "rb") as f:
        return serialization.load_pem_public_key(f.read())

def verify_policy(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return False, []
        
    with open(filepath, "r") as f:
        policy = json.load(f)
         
    try:
        policy_content = {
            "policyName": policy["policyName"],
            "version": policy["version"],
            "previous_hash": policy["previous_hash"],
            "rule": policy["rule"],
            "creator": policy["creator"],
            "created_at": policy["created_at"],
            "justification": policy["justification"]
        }
    except KeyError as e:
        print(f"POLICY REJECTED: Missing critical field for hash reconstruction - {e}")
        return False, []
 
    policy_str = json.dumps(policy_content, sort_keys=True).encode()
    recalculated_hash = hashlib.sha256(policy_str).hexdigest()
     
    if recalculated_hash != policy["policy_hash"]:
        print("POLICY TAMPERED — HASH MISMATCH")
        print(f"Expected: {policy['policy_hash']}")
        print(f"Got:      {recalculated_hash}")
        return False, []
         
    valid_signers = []
    for sig in policy.get("signatures", []):
        admin = sig["admin"]
        signature_hex = sig["signature"]
        
        try:
            public_key = load_public_key(admin) 
            public_key.verify(bytes.fromhex(signature_hex), policy["policy_hash"].encode())
            valid_signers.append(admin)
        except Exception as e:
            print(f"INVALID SIGNATURE DETECTED from {admin}: {e}")
             
    if len(valid_signers) < REQUIRED_SIGNATURES:
        print(f"Verification Failed: Not enough valid signatures. Got {len(valid_signers)}, need {REQUIRED_SIGNATURES}")
        return False, valid_signers
        
    return True, valid_signers