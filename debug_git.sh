#!/bin/bash
echo "=== GIT STATUS ===" > debug_output.txt
git status >> debug_output.txt 2>&1
echo "=== GIT LOG -1 ===" >> debug_output.txt
git log -1 >> debug_output.txt 2>&1
echo "=== GIT DIFF STAT ===" >> debug_output.txt
git diff --stat >> debug_output.txt 2>&1
echo "=== GIT DIFF CACHED STAT ===" >> debug_output.txt
git diff --cached --stat >> debug_output.txt 2>&1
