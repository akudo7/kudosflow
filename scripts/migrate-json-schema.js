const fs = require('fs');
const path = require('path');

function migrateWorkflowFile(filePath) {
  console.log(`Migrating: ${filePath}`);

  // Read file
  const content = fs.readFileSync(filePath, 'utf8');
  let json = JSON.parse(content);

  // 1. Rename a2aClients → a2aServers
  if (json.a2aClients) {
    json.a2aServers = json.a2aClients;
    delete json.a2aClients;
  }

  // 2. Rename function → handler and implementation → function in nodes
  if (json.nodes) {
    json.nodes.forEach(node => {
      if (node.function) {
        // Rename parent object: function → handler
        node.handler = node.function;
        delete node.function;

        // Rename child property: implementation → function
        if (node.handler.implementation !== undefined) {
          node.handler.function = node.handler.implementation;
          delete node.handler.implementation;
        }
      }
    });
  }

  // 3. Rename function → handler and implementation → function in conditional edges
  if (json.edges) {
    json.edges.forEach(edge => {
      if (edge.condition?.function) {
        // Rename parent object: function → handler
        edge.condition.handler = edge.condition.function;
        delete edge.condition.function;

        // Rename child property: implementation → function
        if (edge.condition.handler.implementation !== undefined) {
          edge.condition.handler.function = edge.condition.handler.implementation;
          delete edge.condition.handler.implementation;
        }
      }
    });
  }

  // Write back with formatting
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
  console.log(`✅ Migrated: ${filePath}`);
}

// Migrate all JSON files
const jsonDir = path.join(__dirname, '../json');
const files = [
  'model.json',
  'interrupt.json',
  'a2a/client.json',
  'a2a/servers/task-creation.json',
  'a2a/servers/research-execution.json',
  'a2a/servers/quality-evaluation.json'
];

files.forEach(file => {
  const filePath = path.join(jsonDir, file);
  if (fs.existsSync(filePath)) {
    migrateWorkflowFile(filePath);
  } else {
    console.warn(`⚠️  File not found: ${filePath}`);
  }
});

console.log('\n✅ Migration complete!');
