from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization


def generate(admin):

    private_key = Ed25519PrivateKey.generate()
    public_key = private_key.public_key()

    priv_bytes = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )

    pub_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )

    with open(f"keys/{admin}_private.pem","wb") as f:
        f.write(priv_bytes)

    with open(f"keys/{admin}_public.pem","wb") as f:
        f.write(pub_bytes)

    print("Keys generated for", admin)


if __name__ == "__main__":

    admins = ["admin1","admin2","admin3"]

    for a in admins:
        generate(a)