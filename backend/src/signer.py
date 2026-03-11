import json
import os
import hashlib
import shutil
from datetime import datetime, timezone
from cryptography.hazmat.primitives import serialization

DRAFT_DIR = "policies/draft/"
QUARANTINE_DIR = "policies/quarantine/"  

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

    if policy.get("creator") == current_admin:
        return False, "Separation of Duties violation: Creator cannot sign their own policy."

    for sig in policy.get("signatures", []):
        if sig["admin"] == current_admin:
            return False, f"{current_admin} has already signed this policy."
 
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
        
        policy_str = json.dumps(policy_content, sort_keys=True).encode()
        recalculated_hash = hashlib.sha256(policy_str).hexdigest()
         
        if recalculated_hash != policy["policy_hash"]:
            os.makedirs(QUARANTINE_DIR, exist_ok=True)
             
            policy["status"] = "COMPROMISED"
            policy["tamper_detected_by"] = current_admin
            policy["tamper_detected_at"] = datetime.now(timezone.utc).isoformat()
             
            with open(policy_path, "w") as f:
                json.dump(policy, f, indent=4)
                 
            quarantine_path = os.path.join(QUARANTINE_DIR, filename)
            shutil.move(policy_path, quarantine_path)
            
            return False, f"SECURITY ALERT: Hash mismatch detected. File '{filename}' has been quarantined!"
            
    except KeyError as e:
        return False, f"Malformed policy file. Missing field: {e}"
 
    try:
        private_key = load_private_key(current_admin)
        signature = private_key.sign(recalculated_hash.encode())
        
        policy["signatures"].append({
            "admin": current_admin,
            "signature": signature.hex()
        })
        
        with open(policy_path, "w") as f:
            json.dump(policy, f, indent=4)
            
        return True, f"Successfully signed by {current_admin}"
        
    except Exception as e:
        return False, str(e)