"""Torrentstream CLI interface"""
from contextlib import suppress
from async_timeout import timeout
import sys
import logging
import asyncio
from torrent import TorrentSession

from rich.progress import (
    BarColumn,
    DownloadColumn,
    TextColumn,
    TransferSpeedColumn,
    TimeRemainingColumn,
    Progress,
    TaskID,
)

logging.basicConfig(level=logging.INFO)


async def update_progress(progress, task_id, file):
    """Update progress object."""
    while not progress.finished:
        await asyncio.sleep(1)
        with suppress(Exception):
            progress.update(task_id,
                            advance=(file.completed_percent -
                                     progress._tasks[task_id].completed))


async def show_alerts(session, console):
    async for alert in session.alerts:
        console.print(alert)
        await asyncio.sleep(1)


async def stream_torrent(hash_torrent):
    # Create a session, and add a torrent
    session = TorrentSession()

    # By default this will cleanup torrent contents after playing
    with session.add_torrent(magnet_link=hash_torrent,
                             remove_after=False, save_path=".") as torrent:
        with Progress() as progress:
            # Force sequential mode
            torrent.sequential(True)

            asyncio.ensure_future(show_alerts(session, progress.console))

            progress.console.print("Waiting for torrent metadata")
            # Wait for torrent to be started
            await torrent.wait_for('started')
            progress.console.print("Starting torrent download")

            # Get first match of a media file
            try:
                media = next(a for a in torrent
                             if a.is_media and not 'sample' in a.path.lower())
            except StopIteration:
                raise Exception('Could not find a playable source')

            progress.console.print(
                f"[bold red]Selected media file {media.path}[/]")

            task_id = progress.add_task(media.path, start=True, total=100)

            asyncio.ensure_future(update_progress(progress, task_id, media))

            with timeout(5 * 60):  # Abort if we can't fill 5% in 5 minutes
                await media.wait_for_completion(5)

            return await asyncio.gather(media.wait_for_completion(100),
                                        media.launch())

magnet = "magnet:?xt=urn:btih:59756CEF987CD5E06E4293E2CF3AF3AA71AD193A&dn=Aussie.Gold.Hunters.S10E01.WEBRip.x264-skorpion&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&tr=udp%3A%2F%2F9.rarbg.to%3A2710%2Fannounce&tr=udp%3A%2F%2Fexodus.desync.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.uw0.xyz%3A6969%2Fannounce&tr=udp%3A%2F%2Fopen.stealth.si%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.tiny-vps.com%3A6969%2Fannounce&tr=udp%3A%2F%2Fopen.demonii.si%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.cyberia.is%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.kamigami.org%3A2710%2Fannounce&tr=udp%3A%2F%2Fopentor.org%3A2710%2Fannounce%5B%2Ffo&tr=udp%3A%2F%2Fopentracker.i2p.rocks%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.zerobytes.xyz%3A1337%2Fannounce&tr=udp%3A%2F%2Faaa.army%3A8866%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=http%3A%2F%2Ftracker.openbittorrent.com%3A80%2Fannounce&tr=udp%3A%2F%2Fopentracker.i2p.rocks%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&tr=udp%3A%2F%2Fcoppersurfer.tk%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.zer0day.to%3A1337%2Fannounce"
def main():
    asyncio.run(stream_torrent(magnet))

main()