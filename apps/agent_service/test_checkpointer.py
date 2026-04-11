import asyncio
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
print(getattr(AsyncPostgresSaver, '__init__', None))
