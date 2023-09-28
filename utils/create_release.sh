#!/usr/bin/bash

set -e

# Get new release version (user-provided)
latest_release_version=$(git describe --abbrev=0 --tags)
echo "Current release version: ${latest_release_version}"
read -p "New release version: v" ver
release_version=v${ver}

if ! [[ ${release_version} =~ ^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*).* ]]; then
    echo "User-provided version is not valid semantic version (e.g. v1.0.0)"
    exit 1
fi

# Refresh develop
git checkout develop
git pull
git push

# Refresh main
git checkout main
git pull

# Merge develop into main & push the commits
git merge -m "Release: ${release_version}" develop
git push

# Tag current commit with release version & push the tag
git tag ${release_version}
git push --tags

# Create GitHub release
gh release create ${release_version} --notes "Release: ${release_version}"

# Merge main back into develop & push
git checkout develop
git merge main
git push
