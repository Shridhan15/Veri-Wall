import json
import hashlib
import os
from datetime import datetime, timezone

DRAFT_DIR = "policies/draft/"
ACTIVE_DIR = "policies/active/"

def create_policy(name, version, rule_data, prev_hash, creator, justification):
    os.makedirs(DRAFT_DIR, exist_ok=True)
    os.makedirs(ACTIVE_DIR, exist_ok=True)
    
    clean_name = name.replace(" ", "_").lower()
    filename = f"{clean_name}_v{version}.json"
    draft_path = os.path.join(DRAFT_DIR, filename)

    # 1. Prevent overlapping drafts
    if os.path.exists(draft_path):
        raise ValueError(f"A draft for '{filename}' already exists. Please review or quarantine it first.")

    # 2. GENESIS BLOCK VALIDATION (v1)
    if version == 1:
        active_v1_path = os.path.join(ACTIVE_DIR, f"{clean_name}_v1.json")
        if os.path.exists(active_v1_path):
            raise ValueError(f"Genesis policy '{clean_name}' already exists. You must evolve it, not recreate it.")
        if prev_hash != "00000000000000000000000000000000":
            raise ValueError("Genesis policies must have a zeroed previous hash.")

    # 3. EVOLUTION BLOCK VALIDATION (v > 1)
    if version > 1:
        prev_filename = f"{clean_name}_v{version-1}.json"
        active_prev_path = os.path.join(ACTIVE_DIR, prev_filename)
        
        # Ensure the previous version was actually deployed!
        if not os.path.exists(active_prev_path):
            raise ValueError(f"Cannot evolve policy. Previous version ({prev_filename}) is not active.")
            
        # Verify the chain cryptographically
        with open(active_prev_path, "r") as f:
            prev_policy = json.load(f)
            actual_prev_hash = prev_policy.get("policy_hash")
            
        if actual_prev_hash != prev_hash:
            raise ValueError("🚨 CRYPTOGRAPHIC CHAIN BROKEN: The previous hash provided does not match the live system!")

    # 4. Parse JSON rule
    if isinstance(rule_data, str):
        try:
            rule_data = json.loads(rule_data)
        except json.JSONDecodeError:
            pass 

    # --- IMMUTABLE PAYLOAD ---
    policy_content = {
        "policyName": clean_name,
        "version": version,
        "previous_hash": prev_hash,
        "rule": rule_data,
        "creator": creator,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "justification": justification
    }

    policy_str = json.dumps(policy_content, sort_keys=True).encode()
    policy_hash = hashlib.sha256(policy_str).hexdigest()

    policy = {
        **policy_content,
        "policy_hash": policy_hash,
        "signatures": []
    }

    with open(draft_path, "w") as f:
        json.dump(policy, f, indent=4)

    return policy