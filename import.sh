#!/bin/sh

FORGE_REPOSITORY='https://github.com/digitalbazaar/forge.git'
FORGE_PATH='__forge'
FORGE_TARGETS=`find lib/ -type f | sed -E 's/lib\/(\w+).js/\1/g'`

rm -rf ${FORGE_PATH}
git clone ${FORGE_REPOSITORY} ${FORGE_PATH}

for i in ${FORGE_TARGETS};
    do node bin/import.js ${FORGE_PATH}/js/$i.js lib/$i.js;
done;

make tidy;
echo '\nIMPORT FINISHED. Things have broken.'
echo 'You may want to have a look at the diff to see what changed'
echo '\t1. apply manual fixes'
echo '\t2. run node test/index.js'
echo '\nHappy Hunting...\n'
