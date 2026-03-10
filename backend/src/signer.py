import json
import os
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

    # 3. Load Private Key and Sign the Hash
    try:
        private_key = load_private_key(current_admin)
        policy_hash = policy["policy_hash"]
        
        # The actual cryptographic signing
        signature = private_key.sign(policy_hash.encode())
        
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