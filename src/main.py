import click

from src.policy_manager import create_policy
from src.signer import sign_policy
from src.verifier import verify_policy
from src.enforcer import apply_policy
from src.hashing import hash_policy


@click.group()
def cli():
    pass


@cli.command()
@click.argument("version")
@click.argument("rule")
@click.argument("prev_hash")
def create(version, rule, prev_hash):
    create_policy(version, rule, prev_hash)


@cli.command()
@click.argument("policy")
def hash(policy):
    print(hash_policy(policy))


@cli.command()
@click.argument("policy")
@click.argument("admin")
def sign(policy, admin):
    sign_policy(policy, admin)


@cli.command()
@click.argument("policy")
def verify(policy):
    verify_policy(policy)


@cli.command()
@click.argument("policy")
def apply(policy):

    ok, signers = verify_policy(policy)

    if ok:
        apply_policy(policy)
    else:
        print("Policy rejected")


if __name__ == "__main__":
    cli()