#!/bin/sh

FORGE_REPOSITORY='https://github.com/digitalbazaar/forge.git'
FORGE_PATH='__forge'
FORGE_TARGETS=`find ${FORGE_PATH}/js -type f | sed -E 's/.+\/(\w+).js$/\1/g' | grep -v prime.worker`

rm -rf ${FORGE_PATH}
git clone ${FORGE_REPOSITORY} ${FORGE_PATH}

for i in ${FORGE_TARGETS};
    do node bin/import.js ${FORGE_PATH}/js/$i.js lib/$i.js;
done;

echo '\nIMPORT FINISHED. Things have broken.'
echo '\nImported files are in ./lib'
