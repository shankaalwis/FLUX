# Import parsers and register them
from app.services.parsers.parser_registry import parser_registry
from app.services.parsers.generic_parser import GenericParser

# Register parsers
parser_registry.register("generic", GenericParser)

__all__ = ["parser_registry", "GenericParser"]
