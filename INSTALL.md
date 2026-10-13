# Lumenarium Studio CLI and skills

[Русский](INSTALL.ru.md)

## Install

Requires Node.js 22.20+ and npm. Run in your game project:

```bash
npx @lumenarium/game-studio-skills@latest setup
```

This installs the CLI and skills for Codex and Claude Code and prepares `.env`.

## Get started

1. Create a token on [Agent access](https://studio.lumenarium.biz/settings/agent-access) in Lumenarium Studio.
2. Open `.env` in your game project and paste the token after `GAME_STUDIO_TOKEN=`.
3. Open the project in your agent and start:
   - Codex: `$game-studio-project-setup`;
   - Claude Code: `/game-studio-project-setup`.

Describe your game and your first task. For example:

> Help me set up a project for a pixel-art RPG.

Keep your token private. If the skills do not appear, restart the agent.

[MIT](LICENSE)
