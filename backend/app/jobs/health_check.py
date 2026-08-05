"""Scheduled health-check job."""

import logging
import os

import httpx
from apscheduler.schedulers.asyncio import AsyncIOScheduler

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def ping_health_endpoint() -> None:
    """Call the backend health endpoint."""

    backend_api_url = os.getenv("BACKEND_API_URL")

    if not backend_api_url:
        logger.warning(
            "BACKEND_API_URL is not configured. Skipping health check."
        )
        return

    health_url = f"{backend_api_url.rstrip('/')}/health"

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(health_url)
            response.raise_for_status()

        logger.info(
            "Health check succeeded: %s - %s",
            response.status_code,
            response.text,
        )

    except httpx.HTTPError as error:
        logger.exception(
            "Health check failed for %s: %s",
            health_url,
            error,
        )


def start_health_check_scheduler() -> None:
    """Start the health-check scheduler."""

    if scheduler.running:
        return

    scheduler.add_job(
        ping_health_endpoint,
        trigger="interval",
        minutes=10,
        id="backend_health_check",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )

    scheduler.start()
    logger.info("Health-check scheduler started.")


def stop_health_check_scheduler() -> None:
    """Stop the health-check scheduler."""

    if not scheduler.running:
        return

    scheduler.shutdown(wait=False)
    logger.info("Health-check scheduler stopped.")