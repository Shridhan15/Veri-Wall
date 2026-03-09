import json
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from src.hashing import hash_policy
import json


CONFIG = "config/system_config.json"


def load_public_key(path):

    with open(path, "rb") as f:
        return serialization.load_pem_public_key(f.read())


def verify_policy(policy_path):

    with open(CONFIG) as f:
        cfg = json.load(f)

    required = cfg["required_signatures"]

    with open(policy_path) as f:
        policy = json.load(f)

    policy_hash = hash_policy(policy_path)

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