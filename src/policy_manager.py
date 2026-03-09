import json
import os

DRAFT_DIR = "policies/draft/"

def create_policy(version, rule, prev_hash):

    policy = {
        "version": version,
        "rule": rule,
        "previous_hash": prev_hash,
        "signatures": []
    }

    path = f"{DRAFT_DIR}policy_v{version}.json"

    with open(path, "w") as f:
        json.dump(policy, f, indent=4)

    print("Policy created:", path)