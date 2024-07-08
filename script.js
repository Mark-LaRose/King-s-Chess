// script.js: This file contains the logic for the chess game
const gameBoard = document.querySelector("#gameboard");
const playerDisplay = document.querySelector('#player');
const infoDisplay = document.querySelector("#info-display");
const width = 8;
let playerGo = 'black';
playerDisplay.textContent = 'black';
let kingMoved = { 'black': false, 'white': false }; // Tracks king for castling
let rookMoved = { 'black': [false, false], 'white': [false, false] }; // Tracks rooks for castling

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
document.getElementById('white-score').textContent = whiteScore > 0 ? convertToTicMarks(whiteScore) : '';
document.getElementById('black-score').textContent = blackScore > 0 ? convertToTicMarks(blackScore) : '';

// Function to convert a number to tally marks and limit to 30
function convertToTicMarks(score) {
    const maxMarks = 30;
    let marks = '';
    for (let i = 0; i < Math.min(score, maxMarks); i++) {
        if (i % 5 === 0 && i !== 0) {
            marks += '\n'; // Add a new line for every 5 marks
        }
        marks += '|';
    }
    return marks;
}

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
];

// Initializes the chessboard
function createBoard() {
    startPieces.forEach((startPiece, i) => {
        const square = document.createElement('div');
        square.classList.add('square');
        square.innerHTML = startPiece;
        square.firstChild?.setAttribute('draggable', true);
        square.setAttribute('square-id', i);

        const row = Math.floor((63 - i) / 8) + 1;
        if (row % 2 === 0) {
            square.classList.add(i % 2 === 0 ? "beige" : "brown");
        } else {
            square.classList.add(i % 2 === 0 ? "brown" : "beige");
        }
        if (i <= 15) {
            square.firstChild.firstChild.classList.add('black');
        }

        if (i >= 48) {
            square.firstChild.firstChild.classList.add('white');
        }

        gameBoard.append(square);

        // Add event listeners for drag and drop
        square.addEventListener('dragstart', dragStart);
        square.addEventListener('dragover', dragOver);
        square.addEventListener('drop', dragDrop);
    });
}

// Calls create board function
createBoard();

// Selects all elements with class square and stores as constant
const allSquares = document.querySelectorAll(".square");

// Event listeners for drag and drop
allSquares.forEach(square => {
    square.addEventListener('dragstart', dragStart);
    square.addEventListener('dragover', dragOver);
    square.addEventListener('drop', dragDrop);
});

let startPositionId; // Variable to store starting piece position ID 
let draggedElement; // Variable to store the dragged element

// Function to handle the drag start event
function dragStart(e) {
    startPositionId = e.target.parentNode.getAttribute('square-id');
    draggedElement = e.target;
}

// Function to handle the drag over event
function dragOver(e) {
    e.preventDefault();
}

// Function to handle drop event
function dragDrop(e) {
    e.stopPropagation(); // Stop the event from propagating to parent elements
    const correctGo = draggedElement.firstChild.classList.contains(playerGo); // Check if the dragged piece belongs to the current player
    const taken = e.target.classList.contains('piece'); // Check if the target square already contains a piece
    const valid = checkIfValid(e.target); // Check if the move is valid
    const opponentGo = playerGo === 'white' ? 'black' : 'white'; // Determine the opponent's color
    const takenByOpponent = e.target.firstChild?.classList.contains(opponentGo); // Check if the target square is occupied by an opponent's piece

    if (correctGo) {
        const startId = Number(startPositionId);
        const targetId = Number(e.target.getAttribute('square-id'));

        if (valid === 'castling-right' || valid === 'castling-left') {
            performCastling(startId, targetId, valid);
            return;
        }

        if (valid) {
            if (takenByOpponent) {
                e.target.parentNode.append(draggedElement);
                e.target.remove();
                checkForWin();
                changePlayer();
                return;
            }

            if (taken && !takenByOpponent) {
                infoDisplay.textContent = "you cannot go here!";
                setTimeout(() => infoDisplay.textContent = "", 2000);
                return;
            }

            e.target.append(draggedElement);

            // Check if the pawn reached the last row
            if (draggedElement.id === 'pawn' && (Math.floor(targetId / width) === 0 || Math.floor(targetId / width) === 7)) {
                handlePawnPromotion(draggedElement, targetId); // Trigger the promotion
                return;
            }

            checkForWin();
            changePlayer();
            return;
        }
    }
}

// Added function for castling
function performCastling(kingStart, kingEnd, castlingDirection) {
    let rookStart, rookEnd;
    if (castlingDirection === 'castling-right') {
        rookStart = kingStart + 3;
        rookEnd = kingStart + 1;
    } else if (castlingDirection === 'castling-left') {
        rookStart = kingStart - 4;
        rookEnd = kingStart - 1;
    }

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

// Function to handle pawn promotion
function handlePawnPromotion(pawn, targetId) {
    const team = pawn.firstChild.classList.contains('white') ? 'white' : 'black';
    pawnToPromote = pawn;
    showPromotionModal(team, targetId);
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
            const promotionRows = [0, 1, 2, 3, 4, 5, 6, 7, 56, 57, 58, 59, 60, 61, 62, 63];
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
        reverseIds();
        playerGo = "white";
        playerDisplay.textContent = 'white';
    } else {
        revertIds();
        playerGo = "black";
        playerDisplay.textContent = 'black';
    }
}

// Function to reverse the square IDs
function reverseIds() {
    const allSquares = document.querySelectorAll(".square");
    allSquares.forEach((square, i) =>
        square.setAttribute('square-id', (width * width - 1) - i));
}

// Function to revert the square IDs
function revertIds() {
    const allSquares = document.querySelectorAll(".square");
    allSquares.forEach((square, i) => square.setAttribute('square-id', i));
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
    // Display the scores as tic marks or empty if score is 0
    document.getElementById('white-score').textContent = whiteScore > 0 ? convertToTicMarks(whiteScore) : '';
    document.getElementById('black-score').textContent = blackScore > 0 ? convertToTicMarks(blackScore) : '';
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
    infoDisplay.textContent = ``;
    createBoard();

    // Re-attach event listeners
    const allSquares = document.querySelectorAll(".square");
    allSquares.forEach(square => {
        square.addEventListener('dragstart', dragStart);
        square.addEventListener('dragover', dragOver);
        square.addEventListener('drop', dragDrop);
    });

    // Update the score display
    document.getElementById('white-score').textContent = whiteScore > 0 ? convertToTicMarks(whiteScore) : '';
    document.getElementById('black-score').textContent = blackScore > 0 ? convertToTicMarks(blackScore) : '';
});

// Pawn Promotion Logic
let pawnToPromote = null;
const promotionModal = document.getElementById('promotion-modal');
const promotionOptions = document.getElementById('promotion-options');

function showPromotionModal(team, targetId) {
    promotionModal.style.display = 'block';
    promotionOptions.innerHTML = `
        <div class="promotion-option" data-piece="queen">${getPieceSVG('queen', team)}</div>
        <div class="promotion-option" data-piece="rook">${getPieceSVG('rook', team)}</div>
        <div class="promotion-option" data-piece="bishop">${getPieceSVG('bishop', team)}</div>
        <div class="promotion-option" data-piece="knight">${getPieceSVG('knight', team)}</div>
    `;
    const options = promotionModal.querySelectorAll('.promotion-option');
    options.forEach(option => {
        option.addEventListener('click', (e) => handlePromotionChoice(e, targetId));
    });
}

function handlePromotionChoice(e, targetId) {
    const pieceType = e.target.closest('.promotion-option').getAttribute('data-piece');
    promotePawn(pieceType, targetId);
    hidePromotionModal();
}

function promotePawn(pieceType, targetId) {
    if (!pawnToPromote) return;
    const parentSquare = document.querySelector(`[square-id="${targetId}"]`);
    const team = pawnToPromote.firstChild.classList.contains('white') ? 'white' : 'black';
    parentSquare.innerHTML = ''; // Remove the pawn or captured piece
    const newPiece = document.createElement('div');
    newPiece.id = pieceType;
    newPiece.classList.add('piece'); // Assign class 'piece'
    newPiece.innerHTML = getPieceSVG(pieceType, team);
    newPiece.setAttribute('draggable', true); // Make the piece draggable
    parentSquare.appendChild(newPiece);
    addDragAndDropListeners(newPiece); // Ensure the promoted piece is capturable
    checkForWin();
    changePlayer();
}

function hidePromotionModal() {
    promotionModal.style.display = 'none';
    promotionOptions.innerHTML = '';
    pawnToPromote = null;
}

function getPieceSVG(pieceType, team) {
    switch (pieceType) {
        case 'queen':
            return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="${team}"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M256 0a56 56 0 1 1 0 112A56 56 0 1 1 256 0zM134.1 143.8c3.3-13 15-23.8 30.2-23.8c12.3 0 22.6 7.2 27.7 17c12 23.2 36.2 39 64 39s52-15.8 64-39c5.1-9.8 15.4-17 27.7-17c15.3 0 27 10.8 30.2 23.8c7 27.8 32.2 48.3 62.1 48.3c10.8 0 21-2.7 29.8-7.4c8.4-4.4 18.9-4.5 27.6 .9c13 8 17.1 25 9.2 38L399.7 400H384 343.6 168.4 128 112.3L5.4 223.6c-7.9-13-3.8-30 9.2-38c8.7-5.3 19.2-5.3 27.6-.9c8.9 4.7 19 7.4 29.8 7.4c29.9 0 55.1-20.5 62.1-48.3zM256 224l0 0 0 0h0zM112 432H400l41.4 41.4c4.2 4.2 6.6 10 6.6 16c0 12.5-10.1 22.6-22.6 22.6H86.6C74.1 512 64 501.9 64 489.4c0-6 2.4-11.8 6.6-16L112 432z"/></svg>`;
        case 'rook':
            return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="${team}"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M32 192V48c0-8.8 7.2-16 16-16h64c8.8 0 16 7.2 16 16V88c0 4.4 3.6 8 8 8h32c4.4 0 8-3.6 8-8V48c0-8.8 7.2-16 16-16h64c8.8 0 16 7.2 16 16V88c0 4.4 3.6 8 8 8h32c4.4 0 8-3.6 8-8V48c0-8.8 7.2-16 16-16h64c8.8 0 16 7.2 16 16V192c0 10.1-4.7 19.6-12.8 25.6L352 256l16 144H80L96 256 44.8 217.6C36.7 211.6 32 202.1 32 192zm176 96h32c8.8 0 16-7.2 16-16V224c0-17.7-14.3-32-32-32s-32 14.3-32 32v48c0 8.8 7.2 16 16 16zM22.6 473.4L64 432H384l41.4 41.4c4.2 4.2 6.6 10 6.6 16c0 12.5-10.1 22.6-22.6 22.6H38.6C26.1 512 16 501.9 16 489.4c0-6 2.4-11.8 6.6-16z"/></svg>`;
        case 'bishop':
            return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" class="${team}"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M128 0C110.3 0 96 14.3 96 32c0 16.1 11.9 29.4 27.4 31.7C78.4 106.8 8 190 8 288c0 47.4 30.8 72.3 56 84.7V400H256V372.7c25.2-12.5 56-37.4 56-84.7c0-37.3-10.2-72.4-25.3-104.1l-99.4 99.4c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6L270.8 154.6c-23.2-38.1-51.8-69.5-74.2-90.9C212.1 61.4 224 48.1 224 32c0-17.7-14.3-32-32-32H128zM48 432L6.6 473.4c-4.2 4.2-6.6 10-6.6 16C0 501.9 10.1 512 22.6 512H297.4c12.5 0 22.6-10.1 22.6-22.6c0-6-2.4-11.8-6.6-16L272 432H48z"/></svg>`;
        case 'knight':
            return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="${team}"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M96 48L82.7 61.3C70.7 73.3 64 89.5 64 106.5V238.9c0 10.7 5.3 20.7 14.2 26.6l10.6 7c14.3 9.6 32.7 10.7 48.1 3l3.2-1.6c2.6-1.3 5-2.8 7.3-4.5l49.4-37c6.6-5 15.7-5 22.3 0c10.2 7.7 9.9 23.1-.7 30.3L90.4 350C73.9 361.3 64 380 64 400H384l28.9-159c2.1-11.3 3.1-22.8 3.1-34.3V192C416 86 330 0 224 0H83.8C72.9 0 64 8.9 64 19.8c0 7.5 4.2 14.3 10.9 17.7L96 48zm24 68a20 20 0 1 1 40 0 20 20 0 1 1 -40 0zM22.6 473.4c-4.2 4.2-6.6 10-6.6 16C16 501.9 26.1 512 38.6 512H409.4c12.5 0 22.6-10.1 22.6-22.6c0-6-2.4-11.8-6.6-16L384 432H64L22.6 473.4z"/></svg>`;
        default:
            return '';
    }
}

function addDragAndDropListeners(piece) {
    piece.setAttribute('draggable', true);
    piece.addEventListener('dragstart', dragStart);
    piece.addEventListener('dragover', dragOver);
    piece.addEventListener('drop', dragDrop);
}