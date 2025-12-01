from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, DateTime, Text, ForeignKey, CheckConstraint
from datetime import datetime
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    pass


class Prompt(Base):
    """Table for storing prompts"""

    __tablename__ = "prompt"

    id: Mapped[int] = mapped_column(primary_key=True)
    user: Mapped[str] = mapped_column(String(), nullable=False)
    agent_name: Mapped[str] = mapped_column(String(50), server_default="unknown")
    prompt: Mapped[str] = mapped_column(String(15000), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    def __repr__(self):
        return f"id: {self.id}, agent_name: {self.agent_name}, prompt: {self.prompt}"


class Conversation(Base):
    """Table for storing conversations"""

    __tablename__ = "conversation"
    __table_args__ = (
        CheckConstraint(
            "turns >= 1 AND turns <= 10", name="conversation_turns_range_check"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user: Mapped[str] = mapped_column(String(), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    thread_id: Mapped[str] = mapped_column(String(100), nullable=False)
    model: Mapped[str] = mapped_column(String(50), nullable=True)
    system_prompt_a: Mapped[str] = mapped_column(Text(), nullable=True)
    system_prompt_b: Mapped[str] = mapped_column(Text(), nullable=True)
    turns: Mapped[int] = mapped_column(nullable=False, server_default="3", default=3)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    messages: Mapped[list["Message"]] = relationship(
        "Message", back_populates="conversation", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"id: {self.id}, user: {self.user}, title: {self.title}"


class Message(Base):
    """Table for storing individual messages in a conversation"""

    __tablename__ = "message"

    id: Mapped[int] = mapped_column(primary_key=True)
    conversation_id: Mapped[int] = mapped_column(
        ForeignKey("conversation.id", ondelete="CASCADE"), nullable=False, index=True
    )
    chatbot: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # 'user', 'a', or 'b'
    message: Mapped[str] = mapped_column(Text(), nullable=False)
    order: Mapped[int] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    conversation: Mapped["Conversation"] = relationship(
        "Conversation", back_populates="messages"
    )

    def __repr__(self):
        return f"id: {self.id}, chatbot: {self.chatbot}, order: {self.order}"
