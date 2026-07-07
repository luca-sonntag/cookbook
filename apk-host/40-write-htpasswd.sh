#!/bin/sh
set -e
if [ -n "$HTPASSWD_CONTENT" ]; then
  printf '%s\n' "$HTPASSWD_CONTENT" > /etc/nginx/.htpasswd
fi
