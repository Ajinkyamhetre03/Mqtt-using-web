// Connect to Socket.IO
const socket = io();

socket.on('connect', () => {
    console.log('Connected to server via Socket.IO');
});

// Function to toggle the background of line cards
function toggleBackground(lineId, sendMessage = true) {
    const lineCard = document.getElementById(lineId);
    lineCard.classList.toggle('bg-secondary');
    lineCard.classList.toggle('bg-white');
    lineCard.style.color = lineCard.classList.contains('bg-white') ? 'black' : 'white';

    if (sendMessage) {
        const isOn = lineCard.classList.contains('bg-white') ? 'on' : 'off';
        const message = `${lineId} is ${isOn}`;
        socket.emit('sendMessage', message);
    }
}

// Handle the 'All ON' button functionality
document.getElementById('on-btn').addEventListener('click', async () => {
    const totalLines = document.querySelectorAll('.line-card').length;
    for (let i = 1; i <= totalLines; i++) {
        const lineCard = document.getElementById(`line${i}`);
        if (!lineCard.classList.contains('bg-white')) {
            toggleBackground(`line${i}`, false);
            const message = `line${i} is on`;
            console.log(`Sending message to MQTT: ${message}`);
            socket.emit('sendMessage', message);

            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
});

// Handle the 'All OFF' button functionality
document.getElementById('off-btn').addEventListener('click', async () => {
    const totalLines = document.querySelectorAll('.line-card').length;
    for (let i = 1; i <= totalLines; i++) {
        const lineCard = document.getElementById(`line${i}`);
        if (lineCard.classList.contains('bg-white')) {
            toggleBackground(`line${i}`, false);
            const message = `line${i} is off`;
            console.log(`Sending message to MQTT: ${message}`);
            socket.emit('sendMessage', message);

            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
});

// Individual line button click functionality with Wi-Fi and Cloud check
document.querySelectorAll('.line-card').forEach(lineCard => {
    lineCard.addEventListener('click', () => {
        if (wifiOn && cloudOn) { // Check if Wi-Fi and Cloud are ON
            const lineId = lineCard.getAttribute('id');
            toggleBackground(lineId);
        } else {
            console.warn('Wi-Fi and Cloud must be ON to control individual lines.');
        }
    });
});

// Functionality for Wi-Fi and Cloud buttons
let wifiOn = false;
let cloudOn = false;

function toggleControlButtons() {
    const controlButtons = [document.getElementById('on-btn'), document.getElementById('off-btn')];
    const lineCards = document.querySelectorAll('.line-card');

    if (wifiOn && cloudOn) {
        controlButtons.forEach(button => button.disabled = false);
        lineCards.forEach(card => {
            card.style.pointerEvents = 'auto'; // Enable clicking on line cards
        });
    } else {
        controlButtons.forEach(button => button.disabled = true);
        lineCards.forEach(card => {
            card.style.pointerEvents = 'none'; // Disable clicking on line cards
            card.classList.remove('bg-white'); // Reset to off state
            card.classList.add('bg-secondary');
        });
    }
}

// Receiving messages from MQTT
socket.on('mqttMessage', (message) => {
    console.log(`Received message from server: ${message}`);
    if (message.includes('WiFi')) {
        wifiOn = message === 'WiFi ON';
        const wifiButton = document.querySelector('.wifi-btn');
        wifiButton.style.backgroundColor = wifiOn ? 'white' : '';
        toggleControlButtons(); // Update control buttons state
    }

    if (message.includes('Cloud')) {
        cloudOn = message === 'Cloud ON';
        const cloudButton = document.querySelector('.cloud-btn');
        cloudButton.style.backgroundColor = cloudOn ? 'white' : '';
        toggleControlButtons(); // Update control buttons state
    }

    if (message.includes('buttonsinpage')) {
        const numButtons = parseInt(message.replace('buttonsinpage', ''), 10);
        displayButtons(numButtons);
    }
});

// Function to display the correct number of line buttons
function displayButtons(num) {
    const container = document.getElementById('lineButtonsContainer');
    container.innerHTML = '';
    for (let i = 1; i <= num; i++) {
        const colDiv = document.createElement('div');
        colDiv.className = 'col-3 mb-2';
        const cardDiv = document.createElement('div');
        cardDiv.id = `line${i}`;
        cardDiv.className = 'card line-card text-center bg-secondary';
        cardDiv.innerHTML = `
            <div class="card-body">
                <span class="h1">💡</span>
                <p>LINE ${i}</p>
            </div>
        `;
        cardDiv.onclick = () => {
            if (wifiOn && cloudOn) {
                toggleBackground(`line${i}`);
            } else {
                console.warn('Wi-Fi and Cloud must be ON to control individual lines.');
            }
        };
        colDiv.appendChild(cardDiv);
        container.appendChild(colDiv);
    }
}

// Initialize control buttons on page load
window.onload = function() {
    toggleControlButtons();
};
