const fs = require('fs');
const path = require('path');

function validateWorkflowFile(filePath) {
  console.log(`Validating: ${filePath}`);

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(content);

    // Check for old schema
    if (json.a2aClients) {
      console.error(`❌ ${filePath}: Still uses 'a2aClients' (should be 'a2aServers')`);
      return false;
    }

    // Check nodes
    if (json.nodes) {
      for (const node of json.nodes) {
        if (node.function) {
          console.error(`❌ ${filePath}: Node '${node.id}' still uses 'function' (should be 'handler')`);
          return false;
        }
        if (node.handler?.implementation) {
          console.error(`❌ ${filePath}: Node '${node.id}' still uses 'implementation' (should be 'function')`);
          return false;
        }
      }
    }

    // Check edges
    if (json.edges) {
      for (let i = 0; i < json.edges.length; i++) {
        const edge = json.edges[i];
        if (edge.condition?.function) {
          console.error(`❌ ${filePath}: Edge ${i} condition still uses 'function' (should be 'handler')`);
          return false;
        }
        if (edge.condition?.handler?.implementation) {
          console.error(`❌ ${filePath}: Edge ${i} condition still uses 'implementation' (should be 'function')`);
          return false;
        }
      }
    }

    console.log(`✅ ${filePath}: Valid`);
    return true;

  } catch (error) {
    console.error(`❌ ${filePath}: ${error.message}`);
    return false;
  }
}

// Validate all JSON files
const jsonDir = path.join(__dirname, '../json');
const files = [
  'model.json',
  'interrupt.json',
  'a2a/client.json',
  'a2a/servers/task-creation.json',
  'a2a/servers/research-execution.json',
  'a2a/servers/quality-evaluation.json'
];

let allValid = true;
files.forEach(file => {
  const filePath = path.join(jsonDir, file);
  if (fs.existsSync(filePath)) {
    if (!validateWorkflowFile(filePath)) {
      allValid = false;
    }
  } else {
    console.warn(`⚠️  File not found: ${filePath}`);
  }
});

if (allValid) {
  console.log('\n✅ All files valid!');
  process.exit(0);
} else {
  console.log('\n❌ Some files have errors');
  process.exit(1);
}
