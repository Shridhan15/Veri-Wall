import shutil

ACTIVE_DIR = "policies/active/"

def apply_policy(policy_path):

    dest = ACTIVE_DIR + "active_policy.json"

    shutil.copy(policy_path, dest)

    print("Policy applied →", dest)