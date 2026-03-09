import json
import hashlib

DRAFT_DIR = "policies/draft/"

def create_policy(version, rule, prev_hash):

    policy_content = {
        "version": version,
        "rule": rule,
        "previous_hash": prev_hash
    }

    policy_str = json.dumps(policy_content).encode()
    policy_hash = hashlib.sha256(policy_str).hexdigest()

    policy = {
        **policy_content,
        "policy_hash": policy_hash,
        "signatures": []
    }

    path = f"{DRAFT_DIR}policy_v{version}.json"

    with open(path, "w") as f:
        json.dump(policy, f, indent=4)

    print("Policy created:", path)