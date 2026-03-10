from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json

# Your custom module imports
from src.policy_manager import create_policy
from src.signer import sign_policy
from src.verifier import verify_policy
from src.enforcer import apply_policy

app = FastAPI(title="VeriWall API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

REQUIRED_SIGNATURES = 2

# --- DATABASE MOCK ---
USER_DB = {
    "admin1": {"password": "admin123", "role": "admin", "display_name": "Alice (Lead Admin)"},
    "admin2": {"password": "admin123", "role": "admin", "display_name": "Bob (SecOps)"},
    "admin3": {"password": "admin123", "role": "admin", "display_name": "Charlie (Compliance)"},
    "admin4": {"password": "admin123", "role": "admin", "display_name": "Diana (Network Eng)"},
    "verifier": {"password": "verify123", "role": "verifier", "display_name": "System Verifier Node"}
}

# --- PYDANTIC MODELS ---
class LoginRequest(BaseModel):
    username: str
    password: str

class PolicyCreateRequest(BaseModel):
    name: str # NEW: Compulsory Name
    version: int
    rule: str
    prev_hash: str
    creator: str
    justification: str

class SignRequest(BaseModel):
    filename: str
    admin_name: str

class VerifyRequest(BaseModel):
    policy: str 

class ApplyRequest(BaseModel):
    policy: str 

# --- ROUTES ---

@app.get("/")
def home():
    return {"message": "VeriWall Backend Running"}

@app.post("/login")
def login(creds: LoginRequest):
    user = USER_DB.get(creds.username)
    if not user or user["password"] != creds.password:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return {
        "success": True,
        "username": creds.username,
        "role": user["role"],
        "display_name": user["display_name"]
    }

@app.post("/create-policy")
def create(data: PolicyCreateRequest):
    # API-level validation to ensure name is not empty
    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="Policy name is compulsory.")
        
    try:
        create_policy(
            name=data.name.strip(),
            version=data.version, 
            rule_data=data.rule, 
            prev_hash=data.prev_hash,
            creator=data.creator,
            justification=data.justification
        )
        return {"status": "policy created"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/sign-policy")
def sign(data: SignRequest):
    success, message = sign_policy(data.filename, data.admin_name)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"status": "success", "message": message}

@app.post("/verify-policy")
def verify(data: VerifyRequest):
    draft_path = f"policies/draft/{data.policy}"
    ok, signers = verify_policy(draft_path)
    return {
        "verified": ok,
        "signers": signers
    }

@app.post("/apply-policy")
def apply(data: ApplyRequest):
    draft_path = f"policies/draft/{data.policy}"
    
    is_valid, signers = verify_policy(draft_path)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Cryptographic verification failed.")
        
    success, message = apply_policy(data.policy)
    if not success:
        raise HTTPException(status_code=500, detail=message)
        
    return {"status": "policy applied", "message": message, "signers": signers}

@app.get("/list-policies")
def list_policies():
    path = "policies/draft/"
    if not os.path.exists(path): return []
    
    policy_list = []
    for filename in os.listdir(path):
        if filename.endswith(".json"):
            with open(os.path.join(path, filename), "r") as f:
                data = json.load(f)
                sig_count = len(data.get("signatures", []))
                
                policy_list.append({
                    "id": data.get("version"),
                    "fileName": filename,
                    "policyName": data.get("policyName", filename), # Added for Modal
                    "hash": data.get("policy_hash", "N/A"),
                    "creator": data.get("creator", "Unknown"),
                    "signatures": data.get("signatures", []), 
                    "justification": data.get("justification", ""), # Added for Modal
                    "rule_content": data.get("rule", {}), # Added for Modal payload view
                    "status": "Verified" if sig_count >= REQUIRED_SIGNATURES else "Pending",
                    "required_signatures": REQUIRED_SIGNATURES 
                })
    return policy_list

@app.get("/system-stats")
def get_stats():
    draft_path = "policies/draft/"
    active_path = "policies/active/"
    
    # 1. Count actual ACTIVE policies (Files that have been successfully deployed)
    active = 0
    if os.path.exists(active_path):
        # Count all deployed versions (excluding the "active_policy.json" symlink/copy)
        active = len([f for f in os.listdir(active_path) if f.endswith(".json") and f != "active_policy.json"])
    
    # 2. Count drafts awaiting signatures OR awaiting the Verifier
    pending = 0
    if os.path.exists(draft_path):
        pending = len([f for f in os.listdir(draft_path) if f.endswith(".json")])
                    
    return {
        "active_policies": active,
        "pending_signatures": pending, # This includes both awaiting signatures AND awaiting enforcement
        "verified_admins": len(USER_DB) - 1, 
        "alerts": 0
    }