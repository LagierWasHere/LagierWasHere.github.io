# LagierWasHere.github.io

## Cloudflare Pages setup

The site now uses the root `index.html` for both `/me` and `/recs`. `_redirects`
rewrites those client-side routes to the page while `/api/*` continues to be
handled by Pages Functions.

Before deploying the Discord integration:

1. Create a KV namespace and replace the placeholder ID in `wrangler.toml`.
2. Configure the Pages binding named `RECS_KV` for that namespace.
3. Add `DISCORD_PUBLIC_KEY` and `ALLOWED_DISCORD_ID` as Pages environment variables.
4. Run `DISCORD_APP_ID=... DISCORD_BOT_TOKEN=... node scripts/register-commands.mjs`
   locally once to register the global slash commands.
5. Set the Discord Interactions Endpoint URL to `https://lagierr.me/api/discord`.
6. In the Discord Developer Portal, enable **User Install** for the app, then
   install it to your account using the user-install URL printed by the script.
   The command registration includes `integration_types: [0, 1]` and
   `contexts: [0, 1, 2]`, allowing the commands in servers and user-installed
   contexts.
7. Re-run the registration script after deploying service support to register
   `/add-service`. Add services with their full URL, then view their live
   checker result at `/host`.

Never commit `DISCORD_BOT_TOKEN` or other secrets. The bot token is only needed
when running the registration script; the deployed webhook uses the public key
and KV binding instead.