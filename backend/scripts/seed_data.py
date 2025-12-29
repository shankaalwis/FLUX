"""
Seed data script for BankStat application.
Creates demo user, categories, and sample data.
"""

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.core.security import get_password_hash
from app.models import User, Category, BankProfile, ParserType
import uuid


def seed_categories(db: Session):
    """Create default categories"""
    categories = [
        {"name": "Food & Dining", "icon": "🍔", "color": "#FF6B6B"},
        {"name": "Transportation", "icon": "🚗", "color": "#4ECDC4"},
        {"name": "Shopping", "icon": "🛍️", "color": "#95E1D3"},
        {"name": "Utilities", "icon": "⚡", "color": "#F38181"},
        {"name": "Entertainment", "icon": "🎬", "color": "#AA96DA"},
        {"name": "Healthcare", "icon": "🏥", "color": "#FCBAD3"},
        {"name": "Income", "icon": "💰", "color": "#A8E6CF"},
        {"name": "Transfer", "icon": "🔄", "color": "#FFD3B6"},
        {"name": "Fees & Charges", "icon": "💳", "color": "#FFAAA5"},
        {"name": "Subscriptions", "icon": "📱", "color": "#C7CEEA"},
        {"name": "Other Expenses", "icon": "📦", "color": "#B4B4B4"},
        {"name": "Other Income", "icon": "💵", "color": "#90EE90"},
    ]
    
    for cat_data in categories:
        existing = db.query(Category).filter(Category.name == cat_data["name"]).first()
        if not existing:
            category = Category(**cat_data)
            db.add(category)
    
    db.commit()
    print("✓ Categories seeded")


def seed_demo_user(db: Session):
    """Create demo user account"""
    demo_email = "demo@bankstat.com"
    demo_password = "demo123"
    
    existing = db.query(User).filter(User.email == demo_email).first()
    if not existing:
        user = User(
            email=demo_email,
            hashed_password=get_password_hash(demo_password)
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create a demo bank profile
        profile = BankProfile(
            user_id=user.id,
            bank_name="Demo Bank - Checking",
            parser_type=ParserType.GENERIC
        )
        db.add(profile)
        db.commit()
        
        print(f"✓ Demo user created: {demo_email} / {demo_password}")
        return user
    else:
        print(f"✓ Demo user already exists: {demo_email}")
        return existing


def main():
    """Run all seed functions"""
    print("Starting database seeding...")
    
    db = SessionLocal()
    try:
        seed_categories(db)
        seed_demo_user(db)
        print("\n✅ Database seeding completed successfully!")
        print("\nDemo credentials:")
        print("  Email: demo@bankstat.com")
        print("  Password: demo123")
    except Exception as e:
        print(f"\n❌ Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
