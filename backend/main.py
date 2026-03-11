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
 
USER_DB = {
    "admin1": {"password": "admin123", "role": "admin", "display_name": "Alice (Lead Admin)"},
    "admin2": {"password": "admin123", "role": "admin", "display_name": "Bob (SecOps)"},
    "admin3": {"password": "admin123", "role": "admin", "display_name": "Charlie (Compliance)"},
    "admin4": {"password": "admin123", "role": "admin", "display_name": "Diana (Network Eng)"},
    "verifier": {"password": "verify123", "role": "verifier", "display_name": "System Verifier Node"}
}
 
class LoginRequest(BaseModel):
    username: str
    password: str

class PolicyCreateRequest(BaseModel):
    name: str  
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
                    "policyName": data.get("policyName", filename), 
                    "hash": data.get("policy_hash", "N/A"),
                    "creator": data.get("creator", "Unknown"),
                    "signatures": data.get("signatures", []), 
                    "justification": data.get("justification", ""),  
                    "rule_content": data.get("rule", {}),  
                    "status": "Verified" if sig_count >= REQUIRED_SIGNATURES else "Pending",
                    "required_signatures": REQUIRED_SIGNATURES 
                })
    return policy_list

@app.get("/system-stats")
def get_stats():
    draft_path = "policies/draft/"
    active_path = "policies/active/"
    quarantine_path = "policies/quarantine/"
    
    active_list = []
    pending_list = []
    alert_list = []

    # Get Active Policies
    if os.path.exists(active_path):
        for f in os.listdir(active_path):
            if f.endswith(".json") and f != "active_policy.json":
                with open(os.path.join(active_path, f), "r") as p:
                    data = json.load(p)
                    active_list.append({
                        "id": data.get("version"),
                        "fileName": f, 
                        "policyName": data.get("policyName", f), 
                        "creator": data.get("creator", "System"),
                        "hash": data.get("policy_hash", "N/A"),
                        "justification": data.get("justification", ""),
                        "rule_content": data.get("rule", {}),
                        "signatures": data.get("signatures", []),
                        "required_signatures": REQUIRED_SIGNATURES
                    })
    
    # Get Pending Drafts
    if os.path.exists(draft_path):
        for f in os.listdir(draft_path):
            if f.endswith(".json"):
                with open(os.path.join(draft_path, f), "r") as p:
                    data = json.load(p)
                    sig_count = len(data.get("signatures", []))
                    pending_list.append({
                        "id": data.get("version"),
                        "fileName": f, 
                        "policyName": data.get("policyName", f), 
                        "creator": data.get("creator", "Unknown"),
                        "hash": data.get("policy_hash", "N/A"),
                        "justification": data.get("justification", ""),
                        "rule_content": data.get("rule", {}),
                        "signatures": data.get("signatures", []),
                        "required_signatures": REQUIRED_SIGNATURES,
                        "status": "Verified" if sig_count >= REQUIRED_SIGNATURES else "Pending",
                        "sig_count": sig_count
                    })
                    
    # Get Quarantined/Alert Policies
    if os.path.exists(quarantine_path):
        for f in os.listdir(quarantine_path):
            if f.endswith(".json"):
                with open(os.path.join(quarantine_path, f), "r") as p:
                    data = json.load(p)
                    alert_list.append({
                        "id": data.get("version"),
                        "fileName": f, 
                        "policyName": data.get("policyName", f), 
                        "detected_by": data.get("tamper_detected_by", "Unknown"),
                        "creator": data.get("creator", "Unknown"),
                        "hash": data.get("policy_hash", "N/A"),
                        "justification": data.get("justification", ""),
                        "rule_content": data.get("rule", {}),
                        "signatures": data.get("signatures", []),
                        "required_signatures": REQUIRED_SIGNATURES
                    })
                    
    return {
        "active_policies": len(active_list),
        "pending_signatures": len(pending_list),
        "verified_admins": len(USER_DB) - 1,
        "alerts": len(alert_list),
        "active_list": active_list,      
        "pending_list": pending_list,    
        "alert_list": alert_list         
    }



@app.get("/active-policies")
def get_active_policies():
    path = "policies/active/"
    if not os.path.exists(path): 
        return []
    
    latest_policies = {} # Dictionary to store only the highest version
    
    for filename in os.listdir(path):
        if filename.endswith(".json") and filename != "active_policy.json":
            with open(os.path.join(path, filename), "r") as f:
                data = json.load(f)
                p_name = data.get("policyName", filename.split("_v")[0])
                p_ver = data.get("version", 1)
                
                # If we haven't seen this policy, or this version is higher, save it
                if p_name not in latest_policies or latest_policies[p_name]["id"] < p_ver:
                    latest_policies[p_name] = {
                        "id": p_ver,
                        "fileName": filename,
                        "policyName": p_name,
                        "hash": data.get("policy_hash", ""),
                        "rule": data.get("rule", {}),
                    }
                    
    # Convert dictionary back to list for the frontend
    return list(latest_policies.values())