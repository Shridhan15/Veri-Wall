import json
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization
from src.hashing import hash_policy


def load_private_key(path):

    with open(path, "rb") as f:
        return serialization.load_pem_private_key(
            f.read(),
            password=None
        )


def sign_policy(policy_path, admin):

    key_path = f"keys/{admin}_private.pem"
    private_key = load_private_key(key_path)

    policy_hash = hash_policy(policy_path)

    signature = private_key.sign(policy_hash.encode())

    with open(policy_path, "r") as f:
        policy = json.load(f)

    policy["signatures"].append({
        "admin": admin,
        "signature": signature.hex()
    })

    with open(policy_path, "w") as f:
        json.dump(policy, f, indent=4)

    print("Signed by", admin)