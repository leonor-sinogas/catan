class CatanGame {
    constructor() {
        this.currentPlayer = 0;
        this.players = [
            { id: 0, name: 'Player 1', resources: { wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 }, victoryPoints: 0, settlements: [], cities: [], roads: [] },
            { id: 1, name: 'Player 2', resources: { wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 }, victoryPoints: 0, settlements: [], cities: [], roads: [] },
            { id: 2, name: 'Player 3', resources: { wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 }, victoryPoints: 0, settlements: [], cities: [], roads: [] },
            { id: 3, name: 'Player 4', resources: { wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 }, victoryPoints: 0, settlements: [], cities: [], roads: [] }
        ];
        this.board = this.generateBoard();
        this.gamePhase = 'setup'; // setup, playing
        this.setupRound = 1;
        this.buildMode = null;
        this.init();
    }

    generateBoard() {
        const terrains = ['forest', 'hills', 'pasture', 'fields', 'mountains', 'desert'];
        const resourceTypes = ['wood', 'brick', 'sheep', 'wheat', 'ore', null];
        const numbers = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
        
        const hexes = [];

        let terrainDeck = [
            'forest', 'forest', 'forest', 'forest',
            'hills', 'hills', 'hills',
            'pasture', 'pasture', 'pasture', 'pasture',
            'fields', 'fields', 'fields', 'fields',
            'mountains', 'mountains', 'mountains',
            'desert'
        ];

        this.shuffleArray(terrainDeck);
        this.shuffleArray(numbers);

        let numberIndex = 0;

        const hexLayout = this.getHexLayout();
        for (let row = 0; row < hexLayout.length; row++) {
            for (let col = 0; col < hexLayout[row].length; col++) {
                const hexId = hexLayout[row][col];
                const terrain = terrainDeck[hexId];
                const resource = terrain === 'desert' ? null : this.getResourceFromTerrain(terrain);
                const number = terrain === 'desert' ? null : numbers[numberIndex++];
                
                const hex = {
                    id: hexId,
                    row: row,
                    col: col,
                    terrain: terrain,
                    resource: resource,
                    number: number,
                    x: this.getHexX(row, col),
                    y: this.getHexY(row, col),
                    hasRobber: terrain === 'desert'
                };
                
                hexes.push(hex);
            }
        }

        return hexes;
    }

    getResourceFromTerrain(terrain) {
        const mapping = {
            'forest': 'wood',
            'hills': 'brick',
            'pasture': 'sheep',
            'fields': 'wheat',
            'mountains': 'ore'
        };
        return mapping[terrain];
    }

    getHexX(row, col) {
        const hexWidth = 60.6; // hexSize * √3 for touching edges (35 * 1.732)
        const centerX = 400;
        return centerX + (col - this.getHexLayout()[row].length / 2 + 0.5) * hexWidth;
    }

    getHexY(row, col) {
        const hexHeight = 50.6; // hexSize * √3 for touching edges (35 * 1.732)
        const centerY = 340;
        return centerY + (row - 2) * hexHeight;
    }

    getHexLayout() {
        return [
            [0, 1, 2],
            [3, 4, 5, 6],
            [7, 8, 9, 10, 11],
            [12, 13, 14, 15],
            [16, 17, 18]
        ];
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    init() {
        this.drawBoard();
        this.updateUI();
        this.bindEvents();
    }

    drawBoard() {
        const svg = document.getElementById('board-svg');
        svg.innerHTML = '';

        this.board.forEach(hex => {
            this.drawHex(svg, hex);
        });

        this.drawVertices(svg);
        this.drawEdges(svg);
        this.drawBuildings(svg);
    }

    drawHex(svg, hex) {
        const hexSize = 35;
        const points = [];
        
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i + (Math.PI / 6); // Add 30 degrees (π/6) to rotate by 90 degrees
            const x = hex.x + hexSize * Math.cos(angle);
            const y = hex.y + hexSize * Math.sin(angle);
            points.push(`${x},${y}`);
        }

        const hexElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        hexElement.setAttribute('points', points.join(' '));
        hexElement.setAttribute('class', `hex ${hex.terrain}`);
        hexElement.setAttribute('data-hex-id', hex.id);
        
        const colors = {
            forest: '#228B22',
            hills: '#8B4513',
            pasture: '#90EE90',
            fields: '#FFD700',
            mountains: '#696969',
            desert: '#F4A460'
        };
        
        hexElement.setAttribute('fill', colors[hex.terrain]);
        hexElement.setAttribute('stroke', '#000');
        hexElement.setAttribute('stroke-width', '2');
        
        svg.appendChild(hexElement);

        if (hex.number) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', hex.x);
            text.setAttribute('y', hex.y + 5);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '16');
            text.setAttribute('font-weight', 'bold');
            text.setAttribute('fill', hex.number === 6 || hex.number === 8 ? 'red' : 'black');
            text.textContent = hex.number;
            svg.appendChild(text);
        }

        if (hex.hasRobber) {
            const robber = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            robber.setAttribute('cx', hex.x);
            robber.setAttribute('cy', hex.y - 15);
            robber.setAttribute('r', '8');
            robber.setAttribute('fill', 'black');
            robber.setAttribute('class', 'robber');
            svg.appendChild(robber);
        }
    }

    drawVertices(svg) {
        this.board.forEach(hex => {
            const hexSize = 35;
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i + (Math.PI / 6); // Add 30 degrees to match hex rotation
                const x = hex.x + hexSize * Math.cos(angle);
                const y = hex.y + hexSize * Math.sin(angle);
                
                const vertex = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                vertex.setAttribute('cx', x);
                vertex.setAttribute('cy', y);
                vertex.setAttribute('r', '6');
                vertex.setAttribute('fill', 'white');
                vertex.setAttribute('stroke', '#333');
                vertex.setAttribute('stroke-width', '2');
                vertex.setAttribute('class', 'vertex');
                vertex.setAttribute('data-vertex-id', `${hex.id}-${i}`);
                vertex.style.cursor = 'pointer';
                
                vertex.addEventListener('click', (e) => this.handleVertexClick(e, hex.id, i));
                svg.appendChild(vertex);
            }
        });
    }

    drawEdges(svg) {
        this.board.forEach(hex => {
            const hexSize = 35;
            for (let i = 0; i < 6; i++) {
                const angle1 = (Math.PI / 3) * i + (Math.PI / 6); // Add 30 degrees to match hex rotation
                const angle2 = (Math.PI / 3) * ((i + 1) % 6) + (Math.PI / 6); // Add 30 degrees to match hex rotation
                const x1 = hex.x + hexSize * Math.cos(angle1);
                const y1 = hex.y + hexSize * Math.sin(angle1);
                const x2 = hex.x + hexSize * Math.cos(angle2);
                const y2 = hex.y + hexSize * Math.sin(angle2);
                
                const edge = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                edge.setAttribute('x1', x1);
                edge.setAttribute('y1', y1);
                edge.setAttribute('x2', x2);
                edge.setAttribute('y2', y2);
                edge.setAttribute('stroke', 'transparent');
                edge.setAttribute('stroke-width', '8');
                edge.setAttribute('class', 'edge');
                edge.setAttribute('data-edge-id', `${hex.id}-${i}`);
                edge.style.cursor = 'pointer';
                
                edge.addEventListener('click', (e) => this.handleEdgeClick(e, hex.id, i));
                svg.appendChild(edge);
            }
        });
    }

    drawBuildings(svg) {
        this.players.forEach(player => {
            player.settlements.forEach(settlement => {
                this.drawSettlement(svg, settlement.vertex, player.id);
            });
            
            player.cities.forEach(city => {
                this.drawCity(svg, city.vertex, player.id);
            });
            
            player.roads.forEach(road => {
                this.drawRoad(svg, road.edge, player.id);
            });
        });
    }

    drawSettlement(svg, vertexId, playerId) {
        const [hexId, vertexIndex] = vertexId.split('-').map(Number);
        const hex = this.board.find(h => h.id === hexId);
        const hexSize = 35;
        const angle = (Math.PI / 3) * vertexIndex + (Math.PI / 6); // Add 30 degrees to match hex rotation
        const x = hex.x + hexSize * Math.cos(angle);
        const y = hex.y + hexSize * Math.sin(angle);
        
        const settlement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        settlement.setAttribute('x', x - 4);
        settlement.setAttribute('y', y - 4);
        settlement.setAttribute('width', '8');
        settlement.setAttribute('height', '8');
        settlement.setAttribute('class', 'settlement');
        settlement.setAttribute('fill', this.getPlayerColor(playerId));
        svg.appendChild(settlement);
    }

    drawCity(svg, vertexId, playerId) {
        const [hexId, vertexIndex] = vertexId.split('-').map(Number);
        const hex = this.board.find(h => h.id === hexId);
        const hexSize = 35;
        const angle = (Math.PI / 3) * vertexIndex + (Math.PI / 6); // Add 30 degrees to match hex rotation
        const x = hex.x + hexSize * Math.cos(angle);
        const y = hex.y + hexSize * Math.sin(angle);
        
        const city = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        city.setAttribute('x', x - 6);
        city.setAttribute('y', y - 6);
        city.setAttribute('width', '12');
        city.setAttribute('height', '12');
        city.setAttribute('class', 'city');
        city.setAttribute('fill', this.getPlayerColor(playerId));
        svg.appendChild(city);
    }

    drawRoad(svg, edgeId, playerId) {
        const [hexId, edgeIndex] = edgeId.split('-').map(Number);
        const hex = this.board.find(h => h.id === hexId);
        const hexSize = 35;
        const angle1 = (Math.PI / 3) * edgeIndex + (Math.PI / 6); // Add 30 degrees to match hex rotation
        const angle2 = (Math.PI / 3) * ((edgeIndex + 1) % 6) + (Math.PI / 6); // Add 30 degrees to match hex rotation
        const x1 = hex.x + hexSize * Math.cos(angle1);
        const y1 = hex.y + hexSize * Math.sin(angle1);
        const x2 = hex.x + hexSize * Math.cos(angle2);
        const y2 = hex.y + hexSize * Math.sin(angle2);
        
        const road = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        road.setAttribute('x1', x1);
        road.setAttribute('y1', y1);
        road.setAttribute('x2', x2);
        road.setAttribute('y2', y2);
        road.setAttribute('stroke', this.getPlayerColor(playerId));
        road.setAttribute('stroke-width', '4');
        road.setAttribute('stroke-linecap', 'round');
        road.setAttribute('class', 'road');
        svg.appendChild(road);
    }

    getPlayerColor(playerId) {
        const colors = ['#e74c3c', '#3498db', '#f39c12', '#27ae60'];
        return colors[playerId];
    }

    handleVertexClick(event, hexId, vertexIndex) {
        if (this.buildMode === 'settlement' || this.buildMode === 'city') {
            const vertexId = `${hexId}-${vertexIndex}`;
            this.placeBuildingAtVertex(vertexId, this.buildMode);
        }
    }

    handleEdgeClick(event, hexId, edgeIndex) {
        if (this.buildMode === 'road') {
            const edgeId = `${hexId}-${edgeIndex}`;
            this.placeRoadAtEdge(edgeId);
        }
    }

    placeBuildingAtVertex(vertexId, buildingType) {
        const player = this.players[this.currentPlayer];
        
        if (!this.canAffordBuilding(buildingType)) {
            alert(`Not enough resources to build ${buildingType}!`);
            return;
        }

        if (buildingType === 'settlement') {
            if (this.isVertexOccupied(vertexId)) {
                alert('Vertex already occupied!');
                return;
            }
            
            player.settlements.push({ vertex: vertexId });
            player.victoryPoints += 1;
        } else if (buildingType === 'city') {
            const settlementIndex = player.settlements.findIndex(s => s.vertex === vertexId);
            if (settlementIndex === -1) {
                alert('Must upgrade an existing settlement!');
                return;
            }
            
            player.settlements.splice(settlementIndex, 1);
            player.cities.push({ vertex: vertexId });
            player.victoryPoints += 1; // Net +1 (city worth 2, settlement was 1)
        }

        this.payForBuilding(buildingType);
        this.buildMode = null;
        document.querySelectorAll('#building-controls button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        this.drawBoard();
        this.updateUI();
        
        if (this.checkWinCondition()) {
            return;
        }
    }

    placeRoadAtEdge(edgeId) {
        const player = this.players[this.currentPlayer];
        
        if (!this.canAffordBuilding('road')) {
            alert('Not enough resources to build road!');
            return;
        }

        if (this.isEdgeOccupied(edgeId)) {
            alert('Edge already occupied!');
            return;
        }

        player.roads.push({ edge: edgeId });
        this.payForBuilding('road');
        this.buildMode = null;
        document.querySelectorAll('#building-controls button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        this.drawBoard();
        this.updateUI();
    }

    isVertexOccupied(vertexId) {
        return this.players.some(player => 
            player.settlements.some(s => s.vertex === vertexId) ||
            player.cities.some(c => c.vertex === vertexId)
        );
    }

    isEdgeOccupied(edgeId) {
        return this.players.some(player => 
            player.roads.some(r => r.edge === edgeId)
        );
    }

    bindEvents() {
        document.getElementById('roll-dice').addEventListener('click', () => this.rollDice());
        document.getElementById('end-turn').addEventListener('click', () => this.endTurn());
        document.getElementById('build-settlement').addEventListener('click', () => this.setBuildMode('settlement'));
        document.getElementById('build-city').addEventListener('click', () => this.setBuildMode('city'));
        document.getElementById('build-road').addEventListener('click', () => this.setBuildMode('road'));
    }

    rollDice() {
        const die1 = Math.floor(Math.random() * 6) + 1;
        const die2 = Math.floor(Math.random() * 6) + 1;
        const total = die1 + die2;
        
        document.getElementById('dice-result').textContent = `Roll: ${die1} + ${die2} = ${total}`;
        
        if (total === 7) {
            this.handleRobber();
        } else {
            this.distributeResources(total);
        }
    }

    distributeResources(number) {
        const matchingHexes = this.board.filter(hex => hex.number === number && !hex.hasRobber);
        
        matchingHexes.forEach(hex => {
            // Find adjacent settlements and cities
            // This is simplified - in a full implementation you'd track vertex positions
            this.players.forEach(player => {
                // Simplified resource distribution
                if (hex.resource) {
                    player.resources[hex.resource] += 1;
                }
            });
        });
        
        this.updateUI();
    }

    handleRobber() {
        // Simplified robber handling
        console.log('Robber activated! Players with 7+ cards must discard half.');
    }

    setBuildMode(mode) {
        this.buildMode = mode;
        document.querySelectorAll('#building-controls button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`build-${mode}`).classList.add('active');
    }

    canAffordBuilding(buildingType) {
        const player = this.players[this.currentPlayer];
        const costs = {
            settlement: { wood: 1, brick: 1, sheep: 1, wheat: 1 },
            city: { wheat: 2, ore: 3 },
            road: { wood: 1, brick: 1 }
        };
        
        const cost = costs[buildingType];
        return Object.keys(cost).every(resource => player.resources[resource] >= cost[resource]);
    }

    payForBuilding(buildingType) {
        const player = this.players[this.currentPlayer];
        const costs = {
            settlement: { wood: 1, brick: 1, sheep: 1, wheat: 1 },
            city: { wheat: 2, ore: 3 },
            road: { wood: 1, brick: 1 }
        };
        
        const cost = costs[buildingType];
        Object.keys(cost).forEach(resource => {
            player.resources[resource] -= cost[resource];
        });
    }

    endTurn() {
        this.buildMode = null;
        document.querySelectorAll('#building-controls button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        this.currentPlayer = (this.currentPlayer + 1) % 4;
        this.updateUI();
    }

    updateUI() {
        const currentPlayerData = this.players[this.currentPlayer];
        
        document.getElementById('current-player').textContent = `Current Player: ${currentPlayerData.name}`;
        
        Object.keys(currentPlayerData.resources).forEach(resource => {
            const element = document.getElementById(`${resource}-count`);
            if (element) {
                element.textContent = currentPlayerData.resources[resource];
            }
        });
        
        document.getElementById('victory-points').textContent = currentPlayerData.victoryPoints;
        
        document.querySelectorAll('.player').forEach((playerEl, index) => {
            playerEl.classList.toggle('active', index === this.currentPlayer);
            playerEl.textContent = `${this.players[index].name}: ${this.players[index].victoryPoints} VP`;
        });
        
        // Update building button states
        document.getElementById('build-settlement').disabled = !this.canAffordBuilding('settlement');
        document.getElementById('build-city').disabled = !this.canAffordBuilding('city');
        document.getElementById('build-road').disabled = !this.canAffordBuilding('road');
    }

    checkWinCondition() {
        const winner = this.players.find(player => player.victoryPoints >= 10);
        if (winner) {
            alert(`${winner.name} wins with ${winner.victoryPoints} victory points!`);
            return true;
        }
        return false;
    }
}

// Initialize the game when the page loads
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new CatanGame();
});