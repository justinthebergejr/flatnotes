from abc import ABC, abstractmethod
from typing import Literal

from .models import GroupCreate, Note, NoteCreate, NoteUpdate, SearchResult


class BaseNotes(ABC):
    @abstractmethod
    def create(self, data: NoteCreate) -> Note:
        """Create a new note."""
        pass

    @abstractmethod
    def get(self, title: str) -> Note:
        """Get a specific note."""
        pass

    @abstractmethod
    def update(self, title: str, new_data: NoteUpdate) -> Note:
        """Update a specific note."""
        pass

    @abstractmethod
    def delete(self, title: str) -> None:
        """Delete a specific note.""" ""
        pass

    @abstractmethod
    def search(
        self,
        term: str,
        sort: Literal["score", "title", "last_modified"] = "score",
        order: Literal["asc", "desc"] = "desc",
        limit: int = None,
    ) -> list[SearchResult]:
        """Search for notes."""
        pass

    @abstractmethod
    def get_tags(self) -> list[str]:
        """Get a list of all indexed tags."""
        pass

    @abstractmethod
    def get_groups(self) -> list[str]:
        """Get a list of all groups."""
        pass

    @abstractmethod
    def create_group(self, data: GroupCreate) -> str:
        """Create a new, empty group."""
        pass

    @abstractmethod
    def delete_group(
        self, name: str, notes: Literal["move", "delete"] = "move"
    ) -> None:
        """Delete a group. Its notes are either moved out of the group or
        deleted along with it."""
        pass
