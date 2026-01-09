#!/bin/bash
# Establish persistent SSH tunnel to Postgres
# Local port 5432 forwarded to remote 5432 (or whatever remote DB uses)
# Assuming remote host resolves 'postgresql' or similar internally

ssh -f -N -L 5432:localhost:5432 devil
echo "Tunnel established on port 5432"
