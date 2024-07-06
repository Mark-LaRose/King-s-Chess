// script.js: This file contains the logic for the chess game
const gameBoard = document.querySelector("#gameboard")
const playerDisplay = document.querySelector('#player')
const infoDisplay = document.querySelector("#info-display")
const width = 8
let playerGo = 'black'
playerDisplay.textContent = 'black'
let kingMoved = { 'black': false, 'white': false }; // Tracks king for castling
let rookMoved = { 'black': [false, false], 'white': [false, false] }; // Tracks castles for castling

// Initialize scores
let whiteScore = 0;
let blackScore = 0;

// Load scores from localStorage if they exist
if (localStorage.getItem('whiteScore')) {
    whiteScore = parseInt(localStorage.getItem('whiteScore'), 10);
}
if (localStorage.getItem('blackScore')) {
    blackScore = parseInt(localStorage.getItem('blackScore'), 10);
}

// Update the score display
document.getElementById('white-score').textContent = whiteScore;
document.getElementById('black-score').textContent = blackScore;

// Array for chess board
const startPieces = [
    rook, knight, bishop, queen, king, bishop, knight, rook,
    pawn, pawn, pawn, pawn, pawn, pawn, pawn, pawn,
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    pawn, pawn, pawn, pawn, pawn, pawn, pawn, pawn,
    rook, knight, bishop, queen, king, bishop, knight, rook
]

// Initializes the chessboard
function createBoard() {
    startPieces.forEach((startPiece, i) => {
        const square = document.createElement('div')
        square.classList.add('square')
        square.innerHTML = startPiece
        square.firstChild?.setAttribute('draggable', true)
        square.setAttribute('square-id', i)

        const row = Math.floor( (63 - i) / 8) + 1
        if (row % 2 === 0) {
            square.classList.add(i % 2 === 0 ? "beige" : "brown")
        } else {
            square.classList.add(i % 2 === 0 ? "brown" : "beige")
        }
        if ( i <= 15){
            square.firstChild.firstChild.classList.add('black')
        }

        if ( i >= 48) {
            square.firstChild.firstChild.classList.add('white')
        }

        gameBoard.append(square)
    })
}

// Calls create board function
createBoard()

// Selects all elements with class square and stores as constant
const allSquares = document.querySelectorAll(".square")

// Event listeners for drag and drop
allSquares.forEach(square => {
    square.addEventListener('dragstart', dragStart)
    square.addEventListener('dragover', dragOver)
    square.addEventListener('drop', dragDrop)
})

let startPositionId // Variable to store starting piece position ID 
let draggedElement // Variable to store the dragged element

// Function to handle the drag start event
function dragStart(e) {
    startPositionId = e.target.parentNode.getAttribute('square-id')
    draggedElement = e.target
}

// Function to handle the drag over event
function dragOver(e) {
    e.preventDefault()
}

// Function to handle drop event
function dragDrop(e) {
    e.stopPropagation()                                                             // Stop the event from propagating to parent elements
    const correctGo = draggedElement.firstChild.classList.contains(playerGo)        // Check if the dragged piece belongs to the current player
    const taken = e.target.classList.contains('piece')                              // Check if the target square already contains a piece
    const valid = checkIfValid(e.target)                                            // Check if the move is valid
    const opponentGo = playerGo === 'white' ? 'black' : 'white'                     // Determine the opponent's color
    const takenByOpponent = e.target.firstChild?.classList.contains(opponentGo)     // Check if the target square is occupied by an opponent's piece

    if (correctGo) {
        const startId = Number(startPositionId);
        // Handle castling to the right
        if (valid === 'castling-right') {
            performCastling(startId, startId + 2, startId + 3, startId + 1);
            return;
        }
        // Handle castling to the left
        if (valid === 'castling-left') {
            performCastling(startId, startId - 2, startId - 4, startId - 1);
            return;
        }
        // Handle capturing an opponent's piece
        if (takenByOpponent && valid) {
            e.target.parentNode.append(draggedElement)
            e.target.remove()
            checkForWin()
            changePlayer()
            return
        }
        // Handle attempting to move to a occupied square
        if (taken && !takenByOpponent) {
            infoDisplay.textContent = "you cannot go here!"
            setTimeout(() => infoDisplay.textContent = "", 2000)
            return
        }
        // Handle a valid move to an empty square
        if (valid) {
            e.target.append(draggedElement)
            checkForWin()
            changePlayer()
            return
        }
    }
}

// Function to determine valid moves of pieces
function checkIfValid(target) {
    const targetId = Number(target.getAttribute('square-id') || target.parentNode.getAttribute('square-id'));
    const startId = Number(startPositionId);
    const piece = draggedElement.id;
    console.log('targetId', targetId);
    console.log('startId', startId);
    console.log('piece', piece);

    switch (piece) {
        case 'pawn':
            const starterRow = [8, 9, 10, 11, 12, 13, 14, 15];
            if (
                (starterRow.includes(startId) && startId + width * 2 === targetId) ||
                startId + width === targetId ||
                (startId + width - 1 === targetId && document.querySelector(`[square-id="${startId + width - 1}"]`)?.firstChild) ||
                (startId + width + 1 === targetId && document.querySelector(`[square-id="${startId + width + 1}"]`)?.firstChild)
            ) {
                return true;
            }
            break;
        case 'knight':
            if (
                startId + width * 2 - 1 === targetId ||
                startId + width * 2 + 1 === targetId ||
                startId + width - 2 === targetId ||
                startId + width + 2 === targetId ||
                startId - width * 2 + 1 === targetId ||
                startId - width * 2 - 1 === targetId ||
                startId - width - 2 === targetId ||
                startId - width + 2 === targetId
            ) {
                return true;
            }
            break;
        case 'bishop':
            const diff = Math.abs(startId - targetId);
            if (
                (diff % (width + 1) === 0 || diff % (width - 1) === 0) &&
                !isPathBlockedBishop(startId, targetId)
            ) {
                return true;
            }
            break;
        case 'rook':
            if (
                ((Math.abs(startId - targetId) % width === 0) ||
                (Math.floor(startId / width) === Math.floor(targetId / width))) &&
                !isPathBlockedRook(startId, targetId)
            ) {
                return true;
            }
            break;
        case 'queen':
            if (
                ((Math.abs(startId - targetId) % (width + 1) === 0 || Math.abs(startId - targetId) % (width - 1) === 0) &&
                !isPathBlockedBishop(startId, targetId)) ||
                (startId + width === targetId) ||
                (startId - width === targetId) ||
                (startId + 1 === targetId) ||
                (startId - 1 === targetId)
            ) {
                return true;
            }
            break;
        case 'king':
            if (
                startId + 1 === targetId ||
                startId - 1 === targetId ||
                startId + width === targetId ||
                startId - width === targetId ||
                startId + width - 1 === targetId ||
                startId + width + 1 === targetId ||
                startId - width - 1 === targetId ||
                startId - width + 1 === targetId
            ) {
                return true;
            }

            // Castling
            if (!kingMoved[playerGo] && !inCheck(playerGo)) {
                if (targetId === startId + 2 && !rookMoved[playerGo][1] &&
                    !document.querySelector(`[square-id="${startId + 1}"]`)?.firstChild &&
                    !document.querySelector(`[square-id="${startId + 2}"]`)?.firstChild &&
                    !inCheck(playerGo, startId + 1) && !inCheck(playerGo, startId + 2)) {
                    return 'castling-right';
                }
                if (targetId === startId - 2 && !rookMoved[playerGo][0] &&
                    !document.querySelector(`[square-id="${startId - 1}"]`)?.firstChild &&
                    !document.querySelector(`[square-id="${startId - 2}"]`)?.firstChild &&
                    !document.querySelector(`[square-id="${startId - 3}"]`)?.firstChild &&
                    !inCheck(playerGo, startId - 1) && !inCheck(playerGo, startId - 2)) {
                    return 'castling-left';
                }
            }
            break;
    }
    return false;
}

// Function to change the current player
function changePlayer() {
    if (playerGo === "black") {
        reverseIds()
        playerGo = "white"
        playerDisplay.textContent = 'white'
    } else {
        revertIds()
        playerGo = "black"
        playerDisplay.textContent = 'black'
    }
}

// Function to reverse the square IDs
function reverseIds() {
    const allSquares = document.querySelectorAll(".square")
    allSquares.forEach((square, i) =>
        square.setAttribute('square-id', (width * width - 1) - i))
}

// Function to revert the square IDs
function revertIds() {
    const allSquares = document.querySelectorAll(".square")
    allSquares.forEach((square, i) => square.setAttribute('square-id', i))
}

// Function to check if there is a winner
function checkForWin() {
    const allSquares = document.querySelectorAll('.square');
    const blackKingExists = Array.from(allSquares).some(square => {
        const piece = square.firstChild;
        return piece && piece.id === 'king' && piece.firstChild.classList.contains('black');
    });

    const whiteKingExists = Array.from(allSquares).some(square => {
        const piece = square.firstChild;
        return piece && piece.id === 'king' && piece.firstChild.classList.contains('white');
    });

    if (!blackKingExists) {
        infoDisplay.innerHTML = "White player wins!";
        allSquares.forEach(square => square.firstChild?.setAttribute('draggable', false));
        updateScore('white');
    }

    if (!whiteKingExists) {
        infoDisplay.innerHTML = "Black player wins!";
        allSquares.forEach(square => square.firstChild?.setAttribute('draggable', false));
        updateScore('black');
    }
}

// Checks if Bishops path is blocked
function isPathBlockedBishop(startId, targetId) {
    const step = (Math.abs(startId - targetId) % (width + 1) === 0) ? (width + 1) : (width - 1);
    let currentId = startId < targetId ? startId + step : startId - step;
    while (currentId !== targetId) {
        if (document.querySelector(`[square-id="${currentId}"]`)?.firstChild) {
            return true;
        }
        currentId = startId < targetId ? currentId + step : currentId - step;
    }
    return false;
}

// Checks if Rooks path is blocked
function isPathBlockedRook(startId, targetId) {
    let step;
    if (Math.abs(startId - targetId) % width === 0) {
        step = startId < targetId ? width : -width;
    } else {
        step = startId < targetId ? 1 : -1;
    }
    let currentId = startId + step;
    while (currentId !== targetId) {
        if (document.querySelector(`[square-id="${currentId}"]`)?.firstChild) {
            return true;
        }
        currentId += step;
    }
    return false;
}

// Checks if Queens path is blocked
function isPathBlockedQueen(startId, targetId) {
    if (Math.abs(startId - targetId) % width === 0 || Math.floor(startId / width) === Math.floor(targetId / width)) {
        return isPathBlockedRook(startId, targetId);
    } else {
        return isPathBlockedBishop(startId, targetId);
    }
}

// Added function for castling
function performCastling(kingStart, kingEnd, rookStart, rookEnd) {
    const king = document.querySelector(`[square-id="${kingStart}"]`).firstChild;
    const rook = document.querySelector(`[square-id="${rookStart}"]`).firstChild;

    document.querySelector(`[square-id="${kingEnd}"]`).append(king);
    document.querySelector(`[square-id="${rookEnd}"]`).append(rook);

    kingMoved[playerGo] = true;
    if (rookStart === 0 || rookStart === 56) {
        rookMoved[playerGo][0] = true;
    } else {
        rookMoved[playerGo][1] = true;
    }

    checkForWin();
    changePlayer();
}

// Checks if King is in check
function inCheck(player, position = null) {
    const king = position !== null ? document.querySelector(`[square-id="${position}"] .king.${player}`) : document.querySelector(`.king.${player}`);
    if (!king) return false;

    const kingPositionId = position !== null ? position : king.parentElement.getAttribute('square-id');
    const opponent = player === 'white' ? 'black' : 'white';
    const kingRow = Math.floor(kingPositionId / width);
    const kingCol = kingPositionId % width;

    // Check for threats from rooks, queens, and bishops in all directions
    const directions = [
        { x: 1, y: 0 }, { x: -1, y: 0 }, // Horizontal
        { x: 0, y: 1 }, { x: 0, y: -1 }, // Vertical
        { x: 1, y: 1 }, { x: 1, y: -1 }, // Diagonal
        { x: -1, y: 1 }, { x: -1, y: -1 }
    ];

    for (let { x, y } of directions) {
        let currentX = kingCol + x;
        let currentY = kingRow + y;
        while (currentX >= 0 && currentX < width && currentY >= 0 && currentY < width) {
            const currentSquare = document.querySelector(`[square-id="${currentY * width + currentX}"]`);
            if (currentSquare && currentSquare.firstChild) {
                if (currentSquare.firstChild.classList.contains(opponent)) {
                    if (currentSquare.firstChild.id === 'rook' || currentSquare.firstChild.id === 'queen' || (Math.abs(x) === Math.abs(y) && currentSquare.firstChild.id === 'bishop')) {
                        return true;
                    }
                }
                break;
            }
            currentX += x;
            currentY += y;
        }
    }

    // Check for threats from knights
    const knightMoves = [
        { x: 2, y: 1 }, { x: 2, y: -1 }, { x: -2, y: 1 }, { x: -2, y: -1 },
        { x: 1, y: 2 }, { x: 1, y: -2 }, { x: -1, y: 2 }, { x: -1, y: -2 }
    ];

    for (let { x, y } of knightMoves) {
        const currentX = kingCol + x;
        const currentY = kingRow + y;
        if (currentX >= 0 && currentX < width && currentY >= 0 && currentY < width) {
            const currentSquare = document.querySelector(`[square-id="${currentY * width + currentX}"]`);
            if (currentSquare && currentSquare.firstChild && currentSquare.firstChild.classList.contains(opponent) && currentSquare.firstChild.id === 'knight') {
                return true;
            }
        }
    }

    // Check for threats from pawns
    const pawnDirection = player === 'white' ? -1 : 1;
    const pawnMoves = [
        { x: -1, y: pawnDirection },
        { x: 1, y: pawnDirection }
    ];

    for (let { x, y } of pawnMoves) {
        const currentX = kingCol + x;
        const currentY = kingRow + y;
        if (currentX >= 0 && currentX < width && currentY >= 0 && currentY < width) {
            const currentSquare = document.querySelector(`[square-id="${currentY * width + currentX}"]`);
            if (currentSquare && currentSquare.firstChild && currentSquare.firstChild.classList.contains(opponent) && currentSquare.firstChild.id === 'pawn') {
                return true;
            }
        }
    }

    // Check for threats from the opposing king
    const kingMoves = [
        { x: 1, y: 0 }, { x: -1, y: 0 },
        { x: 0, y: 1 }, { x: 0, y: -1 },
        { x: 1, y: 1 }, { x: 1, y: -1 },
        { x: -1, y: 1 }, { x: -1, y: -1 }
    ];

    for (let { x, y } of kingMoves) {
        const currentX = kingCol + x;
        const currentY = kingRow + y;
        if (currentX >= 0 && currentX < width && currentY >= 0 && currentY < width) {
            const currentSquare = document.querySelector(`[square-id="${currentY * width + currentX}"]`);
            if (currentSquare && currentSquare.firstChild && currentSquare.firstChild.classList.contains(opponent) && currentSquare.firstChild.id === 'king') {
                return true;
            }
        }
    }

    return false;
}

// Update the score based on the winner
function updateScore(winner) {
    if (winner === 'white') {
        whiteScore++;
        localStorage.setItem('whiteScore', whiteScore);
    } else {
        blackScore++;
        localStorage.setItem('blackScore', blackScore);
    }
    document.getElementById('white-score').textContent = whiteScore;
    document.getElementById('black-score').textContent = blackScore;
}

// Event listener for the new game button
document.getElementById("new-game").addEventListener("click", function() {
    localStorage.setItem('whiteScore', 0);
    localStorage.setItem('blackScore', 0);
    location.reload();
});

// Event listener for the rematch button
document.getElementById("rematch").addEventListener("click", function() {
    // Reset the board without resetting the scores
    gameBoard.innerHTML = '';
    playerGo = 'black';
    playerDisplay.textContent = 'black';
    infoDisplay.textContent = `It is ${playerGo}'s go.`;
    createBoard();

    // Re-attach event listeners
    const allSquares = document.querySelectorAll(".square")
    allSquares.forEach(square => {
        square.addEventListener('dragstart', dragStart)
        square.addEventListener('dragover', dragOver)
        square.addEventListener('drop', dragDrop)
    });
});