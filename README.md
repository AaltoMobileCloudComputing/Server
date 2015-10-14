# MCC Awesome Project

## Accessing VM

    # Local
    ssh mccgroup16@echo.niksula.hut.fi
    
    # On echo
    ./ssh-vm.sh
    
## SOCKS Proxy

    ssh -D 2001 mccgroup16@echo.niksula.hut.fi
    
After this set your computer to use proxy `127.0.0.1:2001`
    
## Service
Place `mcc.conf` under `/etc/init`. After that the service can be started and stopped using
    
    sudo service mcc start
    sudo service mcc stop
    

## Deploying
There is no fancy deploy script or anything. Updating the service is done using git, the repo is in `/opt/mcc` on VM. After `git pull` the changes take effect after restarting the service with abovementioned commands.
