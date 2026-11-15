const appId = process.env.DISCORD_APP_ID;
const botToken = process.env.DISCORD_BOT_TOKEN;

if (!appId || !botToken) {
  throw new Error("Set DISCORD_APP_ID and DISCORD_BOT_TOKEN before running this script.");
}

const commands = [
  {
    name: "add-rec",
    description: "Add a novel recommendation to lagierr.me/recs",
    integration_types: [0, 1],
    contexts: [0, 1, 2],
    options: [
      { name: "title", description: "Novel title", type: 3, required: true },
      { name: "note", description: "Your short review/take", type: 3, required: true },
      {
        name: "category",
        description: "Genre filter",
        type: 3,
        required: false,
        choices: [
          { name: "FANTASY", value: "FANTASY" },
          { name: "MYSTERY", value: "MYSTERY" }
        ]
      },
      { name: "peak", description: "Mark as ★ PEAK?", type: 5, required: false },
      { name: "status", description: "e.g. FINISHED, READING", type: 3, required: false },
      { name: "tags", description: "Comma-separated tags e.g. Steampunk, Eldritch", type: 3, required: false }
    ]
  },
  {
    name: "del-rec",
    description: "Remove a novel from lagierr.me/recs",
    integration_types: [0, 1],
    contexts: [0, 1, 2],
    options: [{
      name: "title",
      description: "Select novel to delete",
      type: 3,
      required: true,
      autocomplete: true
    }]
  },
  {
    name: "add-service",
    description: "Add a hosted service to /host",
    integration_types: [0, 1],
    contexts: [0, 1, 2],
    options: [
      { name: "name", description: "Service name", type: 3, required: true },
      { name: "url", description: "Full service URL", type: 3, required: true },
      { name: "description", description: "What the service does", type: 3, required: true },
      { name: "subdomain", description: "Displayed subdomain or hostname", type: 3, required: false },
      { name: "access", description: "Access label, such as PUBLIC or INVITE", type: 3, required: false },
      { name: "tags", description: "Comma-separated tags", type: 3, required: false }
    ]
  }
];

const response = await fetch(`https://discord.com/api/v10/applications/${appId}/commands`, {
  method: "PUT",
  headers: { Authorization: `Bot ${botToken}`, "Content-Type": "application/json" },
  body: JSON.stringify(commands)
});

if (!response.ok) {
  throw new Error(`Discord command registration failed (${response.status}): ${await response.text()}`);
}

const registeredCommands = await response.json();
const registeredNames = new Set(registeredCommands.map((command) => command.name));
const missingCommands = commands
  .map((command) => command.name)
  .filter((name) => !registeredNames.has(name));

if (missingCommands.length > 0) {
  throw new Error(`Discord registration response is missing: ${missingCommands.join(", ")}`);
}

console.log(`Registered ${registeredCommands.length} global Discord commands: ${[...registeredNames].join(", ")}.`);
console.log(`User-install URL: https://discord.com/oauth2/authorize?client_id=${appId}&scope=applications.commands&integration_type=1`);
