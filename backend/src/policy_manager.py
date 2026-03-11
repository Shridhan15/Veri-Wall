import json
import hashlib
import os
from datetime import datetime, timezone

DRAFT_DIR = "policies/draft/"
ACTIVE_DIR = "policies/active/"

def create_policy(name, version, rule_data, prev_hash, creator, justification):
    os.makedirs(DRAFT_DIR, exist_ok=True)
     
    clean_name = name.replace(" ", "_").lower()
    filename = f"{clean_name}_v{version}.json"
    path = os.path.join(DRAFT_DIR, filename)
 
    if version == 1 and os.path.exists(path):
        raise ValueError(f"A policy named '{clean_name}' already exists. Please choose a unique name.")
 
    if isinstance(rule_data, str):
        try:
            rule_data = json.loads(rule_data)
        except json.JSONDecodeError:
            pass  
 
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

    # Save to disk
    with open(path, "w") as f:
        json.dump(policy, f, indent=4)

    return policy