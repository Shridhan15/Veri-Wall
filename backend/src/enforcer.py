import os
import shutil

DRAFT_DIR = "policies/draft/"
ACTIVE_DIR = "policies/active/"

def apply_policy(filename):
    draft_path = os.path.join(DRAFT_DIR, filename)
    active_path = os.path.join(ACTIVE_DIR, filename)
    
    if not os.path.exists(draft_path):
        return False, "Draft policy not found."
        
    os.makedirs(ACTIVE_DIR, exist_ok=True)
    
    try:
        # Move the specific version file into the active directory (e.g., core_firewall_v2.json)
        shutil.move(draft_path, active_path)
         
        generic_path = os.path.join(ACTIVE_DIR, "active_policy.json")
        shutil.copy(active_path, generic_path)
        
        return True, f"Policy {filename} successfully enforced and deployed!"
    except Exception as e:
        return False, f"Failed to enforce policy: {str(e)}"