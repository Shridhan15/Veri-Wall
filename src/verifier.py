import json
import hashlib
from cryptography.hazmat.primitives import serialization

CONFIG = "config/system_config.json"


def compute_policy_hash(policy):

    policy_content = {
        "version": policy["version"],
        "rule": policy["rule"],
        "previous_hash": policy["previous_hash"]
    }

    policy_str = json.dumps(policy_content).encode()
    return hashlib.sha256(policy_str).hexdigest()


def verify_policy(policy_path):

    with open(CONFIG) as f:
        cfg = json.load(f)

    required = cfg["required_signatures"]

    with open(policy_path) as f:
        policy = json.load(f)

    stored_hash = policy["policy_hash"]

    computed_hash = compute_policy_hash(policy)

    if stored_hash != computed_hash:

        print("POLICY TAMPERED — HASH MISMATCH")
        return False, []

    policy_hash = stored_hash

    valid = 0
    signers = []

    for sig in policy["signatures"]:

        admin = sig["admin"]
        signature = bytes.fromhex(sig["signature"])

        pub = load_public_key(f"keys/{admin}_public.pem")

        try:
            pub.verify(signature, policy_hash.encode())
            valid += 1
            signers.append(admin)

        except:
            print("Invalid signature from", admin)

    if valid >= required:

        print("POLICY VERIFIED")
        return True, signers

    else:

        print("Verification failed")
        return False, signers