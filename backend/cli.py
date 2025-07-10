import typer
from sqlmodel import Session, select
from app.database import engine, init_db
from app.models.user import User
from app.routers.auth import get_password_hash

cli_app = typer.Typer()

@cli_app.command()
def create_admin(
    name: str = typer.Option(..., prompt="Admin Name"),
    email: str = typer.Option(..., prompt="Admin Email"),
    password: str = typer.Option(..., prompt="Admin Password", hide_input=True, confirmation_prompt=True),
):
    """
    Creates the initial admin user. Must be run from the command line.
    """
    print("Creating admin user...")
    
    # Ensure the database and tables exist
    init_db()

    with Session(engine) as session:
        # Check if an admin already exists
        existing_admin = session.exec(select(User).where(User.role == "admin")).first()
        if existing_admin:
            print("An admin user already exists. Aborting.")
            raise typer.Exit()

        admin_user = User(
            name=name,
            email=email,
            password=get_password_hash(password),
            role="admin"  # Explicitly set the role
        )
        session.add(admin_user)
        session.commit()
        
    print(f"Admin user '{email}' created successfully!")

if __name__ == "__main__":
    cli_app()