# Flatnotes

A fork of the self-hosted, database-less note-taking web app that utilises a flat folder of markdown files for storage.

flatnotes is designed to be a distraction-free note-taking app that puts your note content first. However my fork adds features which are not planned (such as groups) while trying to keep that distraction-free interface

## Features

* Mobile responsive web interface.
* Raw/WYSIWYG markdown editor modes.
* Advanced search functionality.
* Note "tagging" functionality.
* Customisable home page.
* Wikilink support to easily link to other notes (`[[My Other Note]]`).
* Light/dark themes.
* Multiple authentication options (none, read-only, username/password, 2FA).
* Restful API.
* Note Grouping

## Getting Started

### Docker

This fork doesn't publish an image, so build it from source:

```shell
git clone https://github.com/justinthebergejr/flatnotes.git
cd flatnotes
docker build -t flatnotes-fork .
```

Then run it:

```shell
docker run -d \
  -e "PUID=1000" \
  -e "PGID=1000" \
  -e "FLATNOTES_AUTH_TYPE=password" \
  -e "FLATNOTES_USERNAME=user" \
  -e 'FLATNOTES_PASSWORD=changeMe!' \
  -e "FLATNOTES_SECRET_KEY=aLongRandomSeriesOfCharacters" \
  -v "$(pwd)/data:/data" \
  -p "8080:8080" \
  flatnotes-fork
```

Or with Docker Compose:

```yaml
services:
  flatnotes:
    container_name: flatnotes
    build: .
    environment:
      PUID: 1000
      PGID: 1000
      FLATNOTES_AUTH_TYPE: "password"
      FLATNOTES_USERNAME: "user"
      FLATNOTES_PASSWORD: "changeMe!"
      FLATNOTES_SECRET_KEY: "aLongRandomSeriesOfCharacters"
    volumes:
      - "./data:/data"
    ports:
      - "8080:8080"
    restart: unless-stopped
```

Existing flatnotes data works as-is. Notes already in your data folder will show up with no group.

### Running locally

Instructions to come soon

## Staying Up to Date with Upstream

To pull in new changes from the original project:

```shell
git remote add upstream https://github.com/dullage/flatnotes.git
git fetch upstream
git merge upstream/develop
```

## Roadmap

As flatnotes was designed, I am trying to keep it as simple and distraction-free as possible while adding quality of life features. I am currently a college student and basically just adding as I think of stuff and find the time to implement it.

## Contribution

I completely support any contributions you wish to add! 

## Thanks

A thanks to 2 fantastic open-source projects that make flatnotes possible, and to Adam Dullage for creating flatnotes in the first place.

* [Whoosh](https://whoosh.readthedocs.io/en/latest/intro.html) - A fast, pure Python search engine library.
* [TOAST UI Editor](https://ui.toast.com/tui-editor) - A GFM Markdown and WYSIWYG editor for the browser.
* [Flatnotes](https://github.com/dullage/flatnotes) - Flatnotes
