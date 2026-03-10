import json
import hashlib

def hash_policy(policy_data):
    # Ensure keys are sorted to get a deterministic hash
    policy_content = {
        "version": policy_data["version"],
        "rule": policy_data["rule"],
        "previous_hash": policy_data["previous_hash"]
    }
    policy_str = json.dumps(policy_content, sort_keys=True).encode()
    return hashlib.sha256(policy_str).hexdigest()