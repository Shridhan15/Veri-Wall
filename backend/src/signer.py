import json
import os
import hashlib
from cryptography.hazmat.primitives import serialization

DRAFT_DIR = "policies/draft/"

def load_private_key(admin_name):
    path = f"keys/{admin_name}_private.pem"
    if not os.path.exists(path):
        raise FileNotFoundError(f"Private key for {admin_name} not found.")
        
    with open(path, "rb") as f:
        return serialization.load_pem_private_key(f.read(), password=None)

def sign_policy(filename, current_admin):
    policy_path = os.path.join(DRAFT_DIR, filename)
    
    with open(policy_path, "r") as f:
        policy = json.load(f)

    # 1. Enforce Separation of Duties (Creator cannot sign)
    if policy.get("creator") == current_admin:
        return False, "Separation of Duties violation: Creator cannot sign their own policy."

    # 2. Prevent Double Signing
    for sig in policy.get("signatures", []):
        if sig["admin"] == current_admin:
            return False, f"{current_admin} has already signed this policy."

    # 3. WYSIWYS CHECK: RECALCULATE HASH BEFORE SIGNING
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
        
        # Deterministic Hash Generation
        policy_str = json.dumps(policy_content, sort_keys=True).encode()
        recalculated_hash = hashlib.sha256(policy_str).hexdigest()
        
        # Security Alert! The file data was modified after it was hashed.
        if recalculated_hash != policy["policy_hash"]:
            return False, "🚨 SECURITY ALERT: The policy file was tampered with after creation! Hash mismatch."
            
    except KeyError as e:
        return False, f"Malformed policy file. Missing field: {e}"

    # 4. Load Private Key and Sign the VERIFIED Hash
    try:
        private_key = load_private_key(current_admin)
        
        # The actual cryptographic signing
        signature = private_key.sign(recalculated_hash.encode())
        
        # Append the hex signature to the envelope
        policy["signatures"].append({
            "admin": current_admin,
            "signature": signature.hex()
        })
        
        # Save updated file
        with open(policy_path, "w") as f:
            json.dump(policy, f, indent=4)
            
        return True, f"Successfully signed by {current_admin}"
        
    except Exception as e:
        return False, str(e)