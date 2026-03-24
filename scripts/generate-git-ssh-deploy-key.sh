#!/usr/bin/env bash
# Generate an Ed25519 SSH key pair for Git deploy access (e.g. GitHub Deploy keys,
# or git@github.com:org/repo.git remotes). Never commit the private key.
#
# Usage:
#   chmod +x scripts/generate-git-ssh-deploy-key.sh
#   ./scripts/generate-git-ssh-deploy-key.sh
#
# Then add the printed PUBLIC key in GitHub → Repo → Settings → Deploy keys (read-only
# is enough for Vercel builds that clone submodules). Vercel itself deploys from Git
# via the GitHub/GitLab integration; this key is for local clones or CI that use SSH.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${ROOT}/.ssh-deploy"
KEY="${OUT_DIR}/vercel_git_ed25519"

mkdir -p "${OUT_DIR}"
chmod 700 "${OUT_DIR}"

if [[ -f "${KEY}" ]]; then
  echo "Key already exists: ${KEY}"
  echo "Remove it first if you want a new pair."
  exit 1
fi

ssh-keygen -t ed25519 -C "mm-dxd git deploy" -f "${KEY}" -N ""

echo ""
echo "=== PUBLIC KEY (add this to GitHub → Deploy keys or your Git host) ==="
cat "${KEY}.pub"
echo ""
echo "Private key (keep secret, never commit): ${KEY}"
echo "This directory is gitignored (.ssh-deploy/)."
