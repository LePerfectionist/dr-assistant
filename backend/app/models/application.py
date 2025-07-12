# from sqlmodel import SQLModel, Field, Relationship
# from datetime import datetime
# from typing import Optional, List

# class Application(SQLModel, table=True):
#     id: Optional[int] = Field(default=None, primary_key=True)
#     started_at: datetime = Field(default_factory=datetime.utcnow)
#     last_updated: datetime = Field(default_factory=datetime.utcnow)

#     user_id: int = Field(foreign_key="user.id")
#     user: "User" = Relationship(back_populates="applications")

#     runbooks: List["RunbookDocument"] = Relationship(back_populates="application")
#     systems: List["System"] = Relationship(back_populates="application")

#     @property
#     def filename(self) -> Optional[str]:
#         """Returns the filename of the first runbook (used for display)."""
#         if self.runbooks and len(self.runbooks) > 0:
#             return self.runbooks[0].filename
#         return None
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional, List

class Application(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    started_at: datetime = Field(default_factory=datetime.utcnow)
    last_updated: datetime = Field(default_factory=datetime.utcnow)

    user_id: int = Field(foreign_key="user.id")
    user: "User" = Relationship(back_populates="applications")

    runbooks: List["RunbookDocument"] = Relationship(back_populates="application")
    systems: List["System"] = Relationship(back_populates="application")

    @property
    def filename(self) -> Optional[str]:
        """Returns the filename of the first runbook (used for display)."""
        if self.runbooks and len(self.runbooks) > 0:
            return self.runbooks[0].filename
        return None
