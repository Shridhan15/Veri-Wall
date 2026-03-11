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
from src.logger import log_event # Centralized logging engine

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
     "auditor1": {"password": "audit123", "role": "auditor", "display_name": "Eve (External Auditor)"}
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
        # LOGGING: Failed Login
        log_event("LOGIN_FAILED", creds.username, "Invalid credentials provided.", "warning")
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # LOGGING: Successful Login
    log_event("LOGIN", creds.username, f"User authenticated as {user['role']}.", "info")
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
        # Capture the returned policy dictionary
        new_policy = create_policy(
            name=data.name.strip(),
            version=data.version, 
            rule_data=data.rule, 
            prev_hash=data.prev_hash,
            creator=data.creator,
            justification=data.justification
        )
        
        # LOGGING: Pass the new_policy as the payload snapshot!
        log_event("POLICY_DRAFTED", data.creator, f"Drafted '{data.name.strip()}' (v{data.version}).", "info", payload=new_policy)
        return {"status": "policy created"}
    except ValueError as e:
        log_event("DRAFT_REJECTED", data.creator, str(e), "warning")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/sign-policy")
def sign(data: SignRequest):
    draft_path = f"policies/draft/{data.filename}"
    
    # 1. Capture the state of the policy BEFORE signing (useful for tamper alerts)
    policy_snapshot = None
    if os.path.exists(draft_path):
        with open(draft_path, "r") as f:
            policy_snapshot = json.load(f)

    # 2. Attempt the signature
    success, message = sign_policy(data.filename, data.admin_name)
    
    if not success:
        severity = "danger" if "SECURITY ALERT" in message else "warning"
        # LOGGING: Attach snapshot so auditor sees the tampered file!
        log_event("SIGN_REJECTED", data.admin_name, message, severity, payload=policy_snapshot)
        raise HTTPException(status_code=400, detail=message)
    
    # 3. Capture the state AFTER successful signing
    with open(draft_path, "r") as f:
        updated_policy = json.load(f)
        
    log_event("POLICY_SIGNED", data.admin_name, f"Applied cryptographic signature to {data.filename}.", "success", payload=updated_policy)

    # --- AUTOMATED MULTI-SIG ENFORCEMENT ---
    if len(updated_policy.get("signatures", [])) >= REQUIRED_SIGNATURES:
        is_valid, signers = verify_policy(draft_path)
        
        if is_valid:
            apply_success, apply_message = apply_policy(data.filename)
            if apply_success:
                log_event("AUTO_ENFORCED", "System", f"Threshold met (2/2). Automatically deployed {data.filename}.", "success", payload=updated_policy)
                return {"status": "success", "message": "Signed successfully! Threshold met: Policy automatically enforced."}
            else:
                log_event("AUTO_ENFORCE_FAILED", "System", apply_message, "danger", payload=updated_policy)
        else:
            log_event("VERIFY_FAILED", "System", f"Cryptographic verification failed during auto-enforce for {data.filename}.", "danger", payload=updated_policy)

    return {"status": "success", "message": message}


@app.post("/verify-policy")
def verify(data: VerifyRequest):
    draft_path = f"policies/draft/{data.policy}"
    ok, signers = verify_policy(draft_path)
    return {
        "verified": ok,
        "signers": signers
    }
 
@app.get("/activity-logs")
def get_activity_logs():
    path = "logs/system_events.json"
    if not os.path.exists(path):
        return []
    with open(path, "r") as f:
        return json.load(f)

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