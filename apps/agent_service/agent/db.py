"""
Postgres checkpointer setup for LangGraph state persistence.
"""

from __future__ import annotations

import psycopg
from psycopg_pool import ConnectionPool
from langgraph.checkpoint.postgres import PostgresSaver

_pool = None

def get_checkpointer(db_url: str) -> PostgresSaver:
    """
    Create and initialize a PostgresSaver checkpointer.
    Uses a singleton ConnectionPool to avoid reconnecting.
    """
    global _pool
    if _pool is None:
        _pool = ConnectionPool(
            conninfo=db_url, 
            min_size=1,
            max_size=10
        )
        
        # Run setup using a connection from the pool with autocommit=True
        # This avoids "CREATE INDEX CONCURRENTLY cannot run inside a transaction block"
        try:
            with _pool.connection() as conn:
                conn.autocommit = True
                temp_saver = PostgresSaver(conn)
                temp_saver.setup()
        except Exception as e:
            print(f"Error during Postgres setup: {e}")
            pass

    import asyncio

    saver = PostgresSaver(_pool)
    
    # LangGraph's astream/astream_events requires async checkpointer methods
    # We patch them here to wrap the synchronous pool calls in thread executors
    async def aget_tuple(*args, **kwargs):
        return await asyncio.to_thread(saver.get_tuple, *args, **kwargs)
    
    async def aput(*args, **kwargs):
        return await asyncio.to_thread(saver.put, *args, **kwargs)
        
    async def aput_writes(*args, **kwargs):
        return await asyncio.to_thread(saver.put_writes, *args, **kwargs)
        
    async def alist(*args, **kwargs):
        # We need to exhaust the generator into a list because to_thread returns immediately 
        # and synchronous generators can't be yielded asynchronously natively.
        def _list_all():
            return list(saver.list(*args, **kwargs))
        return await asyncio.to_thread(_list_all)

    saver.aget_tuple = aget_tuple
    saver.aput = aput
    saver.aput_writes = aput_writes
    saver.alist = alist

    return saver
