import asyncio
from torrentstream import TorrentSession  
from async_timeout import timeout  

async def stream_torrent(hash_torrent):
    session = TorrentSession()

    # By default this will cleanup torrent contents after playing
    with session.add_torrent(magnet_link=hash_torrent, remove_after=False) as torrent:
        # Force sequential mode
        torrent.sequential(True)

        # Wait for torrent to be started
        await torrent.wait_for('started')

        # Get first match of a media file
        try:
            media = next(a for a in torrent
                         if a.is_media and not 'sample' in a.path.lower())
        except StopIteration:
            raise Exception('Could not find a playable source')

        with timeout(5 * 60):  # Abort if we can't fill 5% in 5 minutes
            await media.wait_for_completion(5)

        return await asyncio.gather(media.wait_for_completion(100),
                                    media.launch())
    

manget = "magnet:?xt=urn:btih:A44D8911A8B4E07A5DA7BA6220846EF5B51324E8&dn=Tom+And+Jerry+-+004+-+Fraidy+Cat+1942+%5Bmaxxcrime%5D+%5B1337x%5D&tr=http%3A%2F%2Ffr33dom.h33t.com%3A3310%2Fannounce&tr=http%3A%2F%2Fexodus.1337x.org%2Fannounce&tr=http%3A%2F%2Ftracker.publicbt.com%3A80%2Fannounce&tr=http%3A%2F%2Ftracker1.publicbt.com%3A80%2Fannounce&tr=http%3A%2F%2Fgenesis.1337x.org%3A1337%2Fannounce&tr=http%3A%2F%2Ftracker.publicbt.com%3A80%2Fannounce&tr=http%3A%2F%2Ftracker.openbittorrent.com%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.1337x.org%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=http%3A%2F%2Ftracker.openbittorrent.com%3A80%2Fannounce&tr=udp%3A%2F%2Fopentracker.i2p.rocks%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&tr=udp%3A%2F%2Fcoppersurfer.tk%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.zer0day.to%3A1337%2Fannounce"

asyncio.run(stream_torrent(manget))