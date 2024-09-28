#!/usr/bin/env bash
set -euo pipefail

[[ ${DOCKER_DEBUG:-} == "true" ]] && set -x

if [[ ${1:-} == "bash" ]]; then
  exec "${@}"
  exit;
elif [[ ${1:-} == "sh" ]]; then
    exec "${@}"
    exit;
fi

###
### Globals
###

# Path to scripts to source
CONFIG_DIR="/docker-entrypoint.d"

init="$( find "${CONFIG_DIR}" -name '*.sh' -type f | sort -u )"
for f in ${init}; do
 # shellcheck disable=SC1090
 echo "[Entrypoint] running $f"
 . "${f}"
done

# Run command with node if the first argument contains a "-" or is not a system command. The last
# part inside the "{}" is a workaround for the following bug in ash/dash:
# https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=874264
if [ "${1#-}" != "${1}" ] || [ -z "$(command -v "${1}")" ] || { [ -f "${1}" ] && ! [ -x "${1}" ]; }; then
  set -- node "$@"
fi

echo
echo '[Entrypoint] Init process done. Ready for the start-up.'
echo

exec "$@"
