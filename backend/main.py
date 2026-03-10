from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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


@app.get("/")
def home():
    return {"message": "VeriWall Backend Running"}


@app.post("/create-policy")
def create(version: int, rule: str, prev_hash: str):

    create_policy(version, rule, prev_hash)

    return {"status": "policy created"}


@app.post("/sign-policy")
def sign(policy: str, admin: str):

    sign_policy(policy, admin)

    return {"status": "signed"}


@app.post("/verify-policy")
def verify(policy: str):

    ok, signers = verify_policy(policy)

    return {
        "verified": ok,
        "signers": signers
    }


@app.post("/apply-policy")
def apply(policy: str):

    ok, signers = verify_policy(policy)

    if not ok:
        return {"status": "verification failed"}

    apply_policy(policy)

    return {"status": "policy applied"}