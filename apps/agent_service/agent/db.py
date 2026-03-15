"""
Postgres checkpointer setup for LangGraph state persistence.
"""

from __future__ import annotations

import psycopg
from psycopg_pool import AsyncConnectionPool
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver


async def get_checkpointer(db_url: str) -> AsyncPostgresSaver:
    """
    Create and initialize an AsyncPostgresSaver checkpointer.
    """
    # 1. Create the runtime pool first
    pool = AsyncConnectionPool(
        conninfo=db_url, 
        open=False,
        min_size=1,
        max_size=10
    )
    await pool.open()

    # 2. Run setup using a connection from the pool with autocommit=True
    # This avoids "CREATE INDEX CONCURRENTLY cannot run inside a transaction block"
    try:
        async with pool.connection() as conn:
            await conn.set_autocommit(True)
            # Use a temporary saver to run setup
            temp_saver = AsyncPostgresSaver(conn)
            await temp_saver.setup()
    except Exception as e:
        print(f"Error during Postgres setup: {e}")
        # Don't fail the whole app if setup fails, 
        # but the pool might still be open. 
        # If the tables already exist, this might just work anyway.
        pass

    # 3. Return a saver that uses the pool for runtime operations
    return AsyncPostgresSaver(pool)
