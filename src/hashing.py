import hashlib
import json

def hash_policy(policy_path):
    with open(policy_path, "rb") as f:
        data = f.read()

    sha = hashlib.sha256(data).hexdigest()
    return sha