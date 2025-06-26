const fs = require('fs');
const path = require('path');
const readline = require('readline');

// B+ Tree Node
class BPlusTreeNode {
    constructor(isLeaf = false) {
        this.isLeaf = isLeaf;
        this.keys = [];
        this.children = [];
        this.next = null;
    }
}

// B+ Tree Class
class BPlusTree {
    constructor(maxKeys = 4) {
        this.maxKeys = maxKeys;
        this.root = new BPlusTreeNode(true);
    }

    insert(key) {
        const root = this.root;
        if (root.keys.length < this.maxKeys) {
            this.insertNonFull(root, key);
        } else {
            const newRoot = new BPlusTreeNode(false);
            newRoot.children.push(this.root);
            this.splitChild(newRoot, 0);
            this.root = newRoot;
            this.insertNonFull(newRoot, key);
        }
    }

    insertNonFull(node, key) {
        let i = node.keys.length - 1;

        if (node.isLeaf) {
            while (i >= 0 && key < node.keys[i]) {
                i--;
            }
            node.keys.splice(i + 1, 0, key);
        } else {
            while (i >= 0 && key < node.keys[i]) {
                i--;
            }
            i++;
            if (node.children[i].keys.length === this.maxKeys) {
                this.splitChild(node, i);
                if (key > node.keys[i]) {
                    i++;
                }
            }
            this.insertNonFull(node.children[i], key);
        }
    }
    splitChild(parent, index) {
            const node = parent.children[index];
            const newNode = new BPlusTreeNode(node.isLeaf);
            const mid = Math.floor((this.maxKeys + 1) / 2); // +1 ensures even splits

            if (node.isLeaf) {
                // Split the keys for leaf
                newNode.keys = node.keys.splice(mid); // Take the right half
                const promoteKey = newNode.keys[0];   // First key of new node to promote

                // Link the new leaf
                newNode.next = node.next;
                node.next = newNode;

                // Insert the promoteKey into parent (but do NOT remove from leaf)
                parent.keys.splice(index, 0, promoteKey);
                parent.children.splice(index + 1, 0, newNode);
            } else {
                // Internal node split logic
                const promoteKey = node.keys[mid];

                newNode.keys = node.keys.splice(mid + 1); // right part (excluding mid)
                newNode.children = node.children.splice(mid + 1); // right children
                node.keys = node.keys.slice(0, mid); // left keys

                parent.keys.splice(index, 0, promoteKey);
                parent.children.splice(index + 1, 0, newNode);
            }
        }

    search(key) {
        return this._search(this.root, key);
    }

    _search(node, key) {
        let i = 0;
        while (i < node.keys.length && key > node.keys[i]) {
            i++;
        }

        if (node.isLeaf) {
            return node.keys.includes(key);
        } else {
            return this._search(node.children[i], key);
        }
    }

    delete(key) {
        this._delete(this.root, key);
    }

    _delete(node, key) {
        let i = 0;
        while (i < node.keys.length && key > node.keys[i]) {
            i++;
        }

        if (node.isLeaf) {
            const index = node.keys.indexOf(key);
            if (index !== -1) {
                node.keys.splice(index, 1);
                console.log(`🗑️ Deleted "${key}" from the B+ Tree.`);
            } else {
                console.log(`⚠️ Cannot delete "${key}" — not found.`);
            }
        } else {
            this._delete(node.children[i], key);
        }
    }
}

// Load words from file
function loadWordsFromFile(filepath, tree) {
    if (!fs.existsSync(filepath)) {
        console.log(`❌ File not found: ${filepath}`);
        return;
    }

    const data = fs.readFileSync(filepath, 'utf-8');
    const words = data.split(/\r?\n/).map(w => w.trim()).filter(Boolean);

    const start = process.hrtime(); // start timer

    words.forEach(word => {
        tree.insert(word);
    });

    const elapsed = process.hrtime(start); // stop timer
    const elapsedMs = (elapsed[0] * 1000 + elapsed[1] / 1e6).toFixed(3);

    console.log(`✅ Loaded ${words.length} words into the B+ Tree.`);
    console.log(`⏱️ Time Consumed: ${elapsedMs} ms`);
}


// Create tree and load words
const tree = new BPlusTree(4);
const filePath = path.join(__dirname, 'words.txt');
loadWordsFromFile(filePath, tree);

// CLI Interaction
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function showMenu() {
    console.log(`\n📘 B+ Tree Dictionary Menu`);
    console.log(`1. Search word`);
    console.log(`2. Insert word`);
    console.log(`3. Delete word`);
    console.log(`4. Exit`);

    rl.question(`Choose an option (1-4): `, choice => {
        switch (choice.trim()) {
            case '1':
                rl.question('🔍 Enter the word to search: ', word => {
                    const target = word.trim();

                    const start = process.hrtime(); 
                    const found = tree.search(target); 
                    const elapsed = process.hrtime(start); 

                    const elapsedMs = (elapsed[0] * 1000 + elapsed[1] / 1e6).toFixed(6); 

                    if (found) {
                        console.log(`✅ Word "${target}" found.`);
                    } else {
                        console.log(`❌ Word "${target}" not found.`);
                    }

                    console.log(`⏱️ Search time: ${elapsedMs} ms`);
                    showMenu();
                });
                break;

            case '2':
                rl.question('➕ Enter word to insert: ', word => {
                    const trimmed = word.trim();
                    if (tree.search(trimmed)) {
                        console.log(`⚠️ Word "${trimmed}" already exists.`);
                    } else {
                        tree.insert(trimmed);
                        console.log(`✅ Inserted "${trimmed}" into the tree.`);
                    }
                    showMenu();
                });
                break;

            case '3':
                rl.question('🗑️ Enter word to delete: ', word => {
                    tree.delete(word.trim());
                    showMenu();
                });
                break;

            case '4':
                console.log('👋 Exiting. Goodbye!');
                rl.close();
                break;

            default:
                console.log('⚠️ Invalid option. Try again.');
                showMenu();
        }
    });
}

// Start the menu
showMenu();
