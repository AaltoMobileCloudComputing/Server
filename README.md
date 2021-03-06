# MCC Awesome Project

This is project done for Aalto University course [Mobile Cloud Computing T-110.5121](to.fi/course/view.php?id=8779)

## Service
Place `mcc.conf` under `/etc/init`. After that the service can be started and stopped using

    sudo service mcc start
    sudo service mcc stop

Also, mongodb needs to be started before starting the service. This can be done with

    sudo service mongodb start

## Deploying
### Required packages

1. nodejs
2. npm
3. mongodb

### Setup

This setup is for Ubuntu 14.04

1. Clone the git repo/copy files into `/opt/mcc` and run `npm install` there
2. Copy `mcc.conf` to `/etc/init`
3. Start mongo (`sudo service mongodb start`), open mongo shell (`mongo`) and change database to mcc (`use mcc`)
4. Start service with `sudo service mcc start` (note: mongo needs to be always started first)

After initial setup updates can be done simply using `git pull` and `sudo service mcc restart`.

## API

See `mcc-api.md` for more info.
