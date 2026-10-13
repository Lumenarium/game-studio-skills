# CLI и скиллы Lumenarium Studio

[English](README.md)

## Установка

Нужны Node.js 22.20+ и npm. Выполните в папке игрового проекта:

```bash
npx @lumenarium/game-studio-skills@latest setup
```

Команда установит CLI и скиллы для Codex и Claude Code и подготовит `.env`.

## С чего начать

1. Создайте токен на странице [«Доступ для агентов»](https://studio.lumenarium.biz/settings/agent-access) в Lumenarium Studio.
2. Откройте `.env` в папке игрового проекта и вставьте токен после `GAME_STUDIO_TOKEN=`.
3. Откройте проект в агенте и запустите:
   - Codex: `$game-studio-project-setup`;
   - Claude Code: `/game-studio-project-setup`.

Расскажите об игре и первой задаче. Например:

> Помоги создать проект для пиксельной RPG.

Не передавайте токен другим. Если скиллы не появились, перезапустите агента.

[MIT](LICENSE)
