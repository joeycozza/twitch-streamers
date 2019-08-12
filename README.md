# Twitch Streamers

A package that pulls streamer information for currently active streams between a certain viewer #

## Usage

Easiest way to use it is just run `npx twitch-streamers`. It will prompt you for min viewers, max viewers, csv filename, and client ID

## Environment Setup

If you don't want to keep filling in the prompt info each time, you can create a `.env` file wherever you are running the
npx command, and fill it in with these values.

If you don't include one of the variables, you'll still be prompted for it.

```
MIN_VIEWERS=putYourNumberHere
MAX_VIEWERS=putYourNumberHere
CLIENT_ID=putYourIdHere
FILENAME=putYourFilenameHereEndItWithDotCSV
```
