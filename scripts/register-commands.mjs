const appId = process.env.DISCORD_APP_ID;
const botToken = process.env.DISCORD_BOT_TOKEN;

if (!appId || !botToken) {
  throw new Error("Set DISCORD_APP_ID and DISCORD_BOT_TOKEN before running this script.");
}

const commands = [
  {
    name: "add-rec",
    description: "Add a novel recommendation",
    integration_types: [0, 1],
    contexts: [0, 1, 2],
    options: [
      { name: "title", description: "Novel title", type: 3, required: true },
      { name: "note", description: "Why you recommend it", type: 3, required: true },
      { name: "category", description: "Novel category", type: 3, required: true, choices: [{ name: "FANTASY", value: "FANTASY" }, { name: "MYSTERY", value: "MYSTERY" }] },
      { name: "peak", description: "Mark this as peak", type: 5, required: false },
      { name: "status", description: "Reading status", type: 3, required: false },
      { name: "tags", description: "Comma-separated tags", type: 3, required: false }
    ]
  },
  {
    name: "del-rec",
    description: "Remove a novel recommendation",
    integration_types: [0, 1],
    contexts: [0, 1, 2],
    options: [{ name: "title", description: "Title to remove", type: 3, required: true, autocomplete: true }]
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

console.log(`Registered ${commands.length} global Discord commands.`);
console.log(`User-install URL: https://discord.com/oauth2/authorize?client_id=${appId}&scope=applications.commands&integration_type=1`);
