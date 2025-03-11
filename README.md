# /dev/log for hypertube
Personal movie / anime streaming site where the content are obtained via bittorrent protocol built with nextjs and django.

## Design, Demo and screenshots
![image](https://hackmd.io/_uploads/HyZ3a0cokl.png)
> User is able to create an account with their email or a third party app

![Screenshot 2025-03-09 172108](https://hackmd.io/_uploads/BykPCA5oJx.png)
> Discover screen inspired by netflix

![image](https://hackmd.io/_uploads/Skq0A0csyl.png)
> Video streaming in action

![image](https://hackmd.io/_uploads/B1KJJyosyl.png)
> Comment section for videos

## BitTorrent protocol
This protocol is well known for peer-to-peer file sharing, and the documentation can be found [here](https://wiki.theory.org/BitTorrentSpecification) and [here](https://www.bittorrent.org/beps/bep_0003.html). This re-iteration of the procol in this writeup is to further abstract the protocol, making it easier for future reference.

Every node / machine in the network is considered a peer. A peer can be a seeder (file uploader) or a leecher (file downloader) depending on what they want to acheive in the network. 

### The torrent file
The .torrent file or Metainfo file is a file that contains information on the underlying file to download such as the length, filename, hash, pieces, piece length and so on.

> NOTE: A piece here refers to a part of the actual files content. The `pieces` property in the .torrent file is the result of **concatnation** of the hashes of the specific parts of files, not the hash of the actual file itself. `piece length` is just a number of how big a piece should be

> NOTE: A piece length is usually a power of 2 number, so the final piece may contain extra number of bytes from the actual file. what in trying to say here is that the bytes in the actual file is not exactly divisible by the fixed length pieces as defined in the .torrent file

The .torrent file also contains information about its announce URL of its tracker(s), which will be an important information for file acquisition.

For leechers, the .torrent file is the first step to downloading files. They can acquire this file from a public database or shared from friends or family.

For seeders, the generation of the .torrent file is the last step of sharing files to the network.

### The tracker
The tracker is an HTTP over TCP/UDP service that keeps tracks of what peers have what files. Leechers will query trackers to get a list of peers to download from and seeders will query to a tracker to add itself as a peer for a certain file. 

The query to trackers is also known as **announce** requests. Periodically, clients would make **announce** request to update the tracker on the state of the current upload / download. The trackers
will maintain their record internally for all of the announce requests receive.

The **announce** request will contain information about the number of bytes uploaded / downloaded and the number of bytes left in the upload / download. For leechers, it also accepts information on how many peers would the leecher like to expect from the response of the query. 

The response will contain information such as as number of seeders / leechers, as well as a list of peers the leechers can start downloading from.

The tracker will also support a `/scrape` endpoint which just shows the current status for any given torrent.

There are some public trackers [out there](http://www.torrent2exe.com/forum/viewtopic.php?id=153), however you can also deploy your own tracker for the same purposes as long the convention is followed strictly.

### Download messaging
Once the peers are determined, the leecher can initiate the download by sending messages to the peer using formatted messages.

The sequence starts with a handshake, and the leecher will send request messages requesting for data, the peer will then response with piece messages containing raw bytes of the requested file. The full protocol can be viewed [here](https://wiki.theory.org/BitTorrentSpecification) under section Peer wire protocol (TCP).

## Video streaming
The previous sections described the acquisition of the video file, the following processes will involve the delivery part of the service, where we still stream the video source to the client.

Though the requirements specify that we need to use WebRTC, my persoal opinion thinks that using RTMP is a better option, considering the former is used mainly for realtime video calls optimizing processing speed with the cost of quality over the latter which is optimized for high quality streaming in exchange for slower processing speed.

Below is the video streaming flow we have implemented with a simple websocket server as the signalling server. 
![image](https://raw.githubusercontent.com/neosizzle/hypertube/refs/heads/main/docs/rtc-flow.png)

## Mkv conversion
The mp4 files are converted to mkv on the fly using [ffmpeg-python](https://github.com/kkroening/ffmpeg-python), a ffmpeg wrapper for python. 

> NOTE: This is not required anymore as MediaStream API is compatible for all video files within our obsevation

> NOTE: The codecs supported by webRTC can be referred [here](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/WebRTC_codecs), the package we use to initialize streams (aiortcs mediaplayer) conviniently converts the files to the correct codecs for us 

## External search APIs
To facilitate the discovery feature, we offloaded the search function to two external APIs, [OMDB](https://www.omdbapi.com) and [TMDB](https://developer.themoviedb.org/reference/intro/getting-started). Both of these offer search and filter functions, however we use OMDB as our source of truth and the TMDB acts as a backup complementing the contents which OMDB is lacking. OMDB results will always be the priority in the case of a conflict.

## Torrent file matching
Once a movie name is obtained, a query has to be made to an external magnet database to obtain the magnet link / metainfo. We are using `yts` search endpoint for this purpose. Once we have a list of magnets and their titles to go through, we used [groq](https://groq.com) LLM to match the most suitable title for us from the list of titles. 

## i18n
i18n is used for internationalization of static web text content. It uses the nextjs curated `next-intl` package to manage locales and translations. All text contents and their translations are stored in `frontend/messages/{language}.json`. 

## Requirements

- **Node.js**: v20.10.0 or compatible
- **Python**: v3.10 or compatible
- **ffmpeg** v4.4.2

## Environment
### Node.js Installation
To install the correct version of Node.js on your system, use **nvm** (Node Version Manager) to manage your Node.js versions.

1. First, install nvm if you haven't already. You can follow the installation instructions from the [official nvm repository](https://github.com/nvm-sh/nvm#installing-and-updating).

2. Once nvm is installed, run the following commands to install and use Node.js v20:

    ```bash
    nvm install 20
    nvm use 20
    ```

### Python Installation with Conda

To install and set up Python 3.11.1 (or compatible) using **Conda**, follow these steps:

1. **Install Conda**: If you don't have Conda installed, you can install it by downloading the [Miniconda](https://docs.conda.io/en/latest/miniconda.html) or [Anaconda](https://www.anaconda.com/products/distribution) distribution, which includes Conda.

2. **Create a new Conda environment** with Python 3.10:

    ```bash
    conda create -n hypertube python=3.10
    ```

    Replace `hypertube` with the name you wish to give to your environment.

3. **Activate the environment**:

    ```bash
    conda activate hypertube
    ```

4. To confirm that the correct version of Python is installed, run:

    ```bash
    python --version
    ```

    This should display Python 3.10 (or a compatible version, depending on what you installed).

## Instructions
### 1. Credentials setup

To make sure the required credentials are in place

```bash
cp .env.example .env
```

---

### 2. Frontend Setup

To get the frontend up and running, follow these steps:

1. **Navigate to the frontend directory**:

    ```bash
    cd frontend
    ```

2. **Install the necessary dependencies** and start the development server:

    ```bash
    npm install && npm run dev
    ```

   - `npm install` will install all required dependencies from the `package.json` file.
   - `npm run dev` will start the development server (make sure you have the necessary environment variables and configurations set).

   The frontend should now be available at `http://localhost:3000` (or another port depending on your configuration).

---
### 3. Backend Setup
To set up the backend, follow these steps:

1. **Navigate to the backend directory**:

    ```bash
    cd backend
    ```

2. **Install the required Python dependencies**:

    If you're using a virtual environment (recommended):

    ```bash
    pip install -r ../requirements.txt
    ```

   This will install all necessary packages listed in `requirements.txt`.

3. **Run the backend server**:

    ```bash
    python manage.py migrate # run table migrations
    python manage.py createsuperuser # create super user, needed for admin access
    python manage.py runserver
    ```

    This will start the Django development server. By default, the admin page will be available at `http://127.0.0.1:8000/admin`.

    - If you're using a different configuration (e.g., Docker or a custom port), be sure to adjust the command accordingly.


## Feature suggestions
1. Multifile torrents for tv series with multiple episodes
2. Custom title matching engine for torrent file query
3. Direct peer to peer with webrtc just like how webtorrent does it, bypassing the signalling requirement(?)
4. Optimizations for larger mkv to support multiple streams
5. More options to apply filters on the fly
6. More robust torrent state handling
