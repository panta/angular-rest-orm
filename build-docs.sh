#!/bin/bash -e

grunt build && grunt ngdocs $@

if [ -d site ] ; then
	rm -rf site
fi
mkdir -p site/docs
mv  tmp/* site/docs/
rm -rf tmp
