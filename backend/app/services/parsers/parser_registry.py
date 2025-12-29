from typing import Dict, Type
from app.services.parsers.base_parser import BaseParser


class ParserRegistry:
    """Registry for managing PDF parsers"""
    
    def __init__(self):
        self._parsers: Dict[str, Type[BaseParser]] = {}
    
    def register(self, parser_type: str, parser_class: Type[BaseParser]):
        """Register a parser"""
        self._parsers[parser_type] = parser_class
    
    def get_parser(self, parser_type: str) -> BaseParser:
        """Get a parser instance by type"""
        parser_class = self._parsers.get(parser_type)
        if parser_class is None:
            raise ValueError(f"Unknown parser type: {parser_type}")
        return parser_class()
    
    def list_parsers(self) -> list[str]:
        """List all registered parser types"""
        return list(self._parsers.keys())


# Global registry instance
parser_registry = ParserRegistry()
