#!/bin/bash

echo "Checking deployment status for latest commit..."
LAST_COMMIT=$(git rev-parse HEAD)
echo "Latest commit: $LAST_COMMIT"
echo "--------------------------------"
git --no-pager log -1 --stat
echo "--------------------------------"
echo "If this commit is on 'main' or 'master', the CI/CD pipeline should be triggered."
echo "Please checks GitHub Actions tab for real-time progress."
