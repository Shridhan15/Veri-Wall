import os
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization

def generate_keypair(admin_name):
    os.makedirs("keys", exist_ok=True)
    
    # Generate the Ed25519 Private Key
    private_key = ed25519.Ed25519PrivateKey.generate()
    
    # Extract the Public Key
    public_key = private_key.public_key()
    
    # Save Private Key
    with open(f"keys/{admin_name}_private.pem", "wb") as f:
        f.write(private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ))
        
    # Save Public Key
    with open(f"keys/{admin_name}_public.pem", "wb") as f:
        f.write(public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ))
    print(f"Generated keys for {admin_name}")

if __name__ == "__main__":
    # List all your active admins here
    authorized_admins = ["admin1", "admin2", "admin3", "admin4"]
    
    for admin in authorized_admins:
        generate_keypair(admin)
        
    print("\nAll cryptographic keys generated successfully in the /keys directory.")