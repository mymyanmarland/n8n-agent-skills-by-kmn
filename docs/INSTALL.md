# Installation

Install the `n8n-myanmar-workflow-builder` skill into your Cursor workspace.

## Requirements

- **Cursor** (IDE or CLI) with Agent mode
- **Node.js** >= 18 (for the CLI scripts)
- An existing **n8n** instance (local Docker, n8n.cloud, or self-hosted)
- Optional: `TELEGRAM_BOT_TOKEN` env var for `check-telegram-channel.cjs`

## Option A - Install into one project (recommended)

From your project's root:

```bash
mkdir -p .cursor/skills
cp -r n8n-myanmar-workflow-builder .cursor/skills/
```

The agent will auto-discover the skill on the next chat in that project.

## Option B - Install globally for all your projects

Copy into your user skills folder so every project picks it up.

| OS | Path |
|---|---|
| Windows | `%USERPROFILE%\.cursor\skills\n8n-myanmar-workflow-builder` |
| macOS / Linux | `~/.cursor/skills/n8n-myanmar-workflow-builder` |

```bash
# Linux / macOS
mkdir -p ~/.cursor/skills
cp -r n8n-myanmar-workflow-builder ~/.cursor/skills/
```

```powershell
# Windows PowerShell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.cursor\skills"
Copy-Item -Recurse ".\n8n-myanmar-workflow-builder" "$env:USERPROFILE\.cursor\skills\"
```

## Option C - Install just the scripts to your PATH

If you only want the CLI tools without the agent skill:

```bash
# Linux / macOS - symlink scripts to ~/.local/bin
mkdir -p ~/.local/bin
for s in build-workflow validate-workflow audit-credentials check-telegram-channel; do
  ln -s "$PWD/n8n-myanmar-workflow-builder/scripts/${s}.cjs" ~/.local/bin/n8n-${s%-workflow}
done

# Make sure ~/.local/bin is in your PATH
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
```

```powershell
# Windows PowerShell - add scripts folder to PATH
$env:Path += ";$PWD\n8n-myanmar-workflow-builder\scripts"
[Environment]::SetEnvironmentVariable("Path", $env:Path, "User")
```

## Verify

```bash
# In any project where the skill is installed:
node .cursor/skills/n8n-myanmar-workflow-builder/scripts/validate-workflow.cjs \
  .cursor/skills/n8n-myanmar-workflow-builder/examples/chat-claude.json
```

Expected: warnings about a missing StickyNote, exit code 2.

```bash
node .cursor/skills/n8n-myanmar-workflow-builder/scripts/audit-credentials.cjs .
```

Expected: `OK: No credential leaks detected`, exit code 0.

```bash
TELEGRAM_BOT_TOKEN=123:abc node .cursor/skills/n8n-myanmar-workflow-builder/scripts/check-telegram-channel.cjs --me
```

Expected: JSON describing the bot (no token is printed).

## Trigger the skill

Open Cursor and chat with the agent. Mention any of these phrases:

- "build an n8n workflow"
- "create a Telegram bot with Claude"
- "schedule a digest for Telegram channel"
- "validate this workflow JSON"
- "audit for credential leaks"
- "check my Telegram channel"
- "set up a Cloudflare tunnel for n8n"

The agent will load `SKILL.md` and the relevant references.

## Uninstall

```bash
rm -rf .cursor/skills/n8n-myanmar-workflow-builder
```

For a global install:

```bash
rm -rf ~/.cursor/skills/n8n-myanmar-workflow-builder  # macOS / Linux
Remove-Item -Recurse "$env:USERPROFILE\.cursor\skills\n8n-myanmar-workflow-builder"  # Windows
```
