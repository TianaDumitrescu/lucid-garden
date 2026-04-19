const createAlarmBtn = document.getElementById("createAlarmBtn");
const closeBtn = document.getElementById("closeModal");
const alarmCreation = document.getElementById("alarmCreation");

// Open popup
createAlarmBtn.addEventListener("click", () => {
    alarmCreation.style.display = "flex";
});

// Close popup
closeBtn.addEventListener("click", () => {
    alarmCreation.style.display = "none";
});

const gameMessage = document.getElementById("game-message");
const starterSection = document.getElementById("starter-section");
const partySection = document.getElementById("party-section");
const collectionSection = document.getElementById("collection-section");
const battleSection = document.getElementById("battle-section");

const nextButton = document.getElementById("next-button");
const partyButton = document.getElementById("party-button");
const collectionButton = document.getElementById("collection-button");

// Helper function to get CSRF token from cookies, which is needed for POST requests to the Django backend
function getCookie() {
    const name = "csrftoken";
    const cookies = document.cookie.split(";"); // splits the cookie string into an array of individual cookies

    // Iterates through the cookies to find the one with the specified name and returns its value    
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(name + "=")) {
            return cookie.substring(name.length + 1);
        }
    }
    return "";
}

function showGameMessage(message) {
    gameMessage.textContent = message;
}

function clearGameMessage() {
    gameMessage.textContent = "";
}

function clearSections() {
    starterSection.innerHTML = "";
    partySection.innerHTML = "";
    collectionSection.innerHTML = "";
    battleSection.innerHTML = "";
    nextButton.style.display = "none";
    partyButton.style.display = "none";
    collectionButton.style.display = "none";

    partyButton.textContent = "Show Party";
    collectionButton.textContent = "Show Collection";
}

async function loadStarterData() {
    clearSections();
    clearGameMessage();
    try {
        const response = await fetch("/game/starter/"); // makes a GET request to the backend to retrieve starter data from the game app
        const data = await response.json(); // converts that data received from the backend into a JavaScript object

        // If the player has already chosen a starter, then g
        if (data.starter_chosen) {
            mainHub();
        } else {
            showStarterOptions(data.options); // if player hasn't chosen a starter, calls this function that shows starters to user's screen
        }

    } catch (error) {
        showGameMessage("Could not load data, please reload page");
        console.log(error);
    }
}

function showStarterOptions(options) {
    let html = "<h4>Choose Your Starter</h4>";

    // Loops through the options through the fetch to the backend and creates a div for each starter with its name, type, description, and a button to choose it
    for (let i = 0; i < options.length; i++) {
        const lucid = options[i];
        html += `
            <div style="border:1px solid white; padding:10px; margin-bottom:10px;">
                <p><strong>${lucid.name}</strong></p>
                <p>Type: ${lucid.type.join(", ")}</p>
                <p>${lucid.description}</p>
                <button onclick="chooseStarter(${lucid.id})">Choose</button>
            </div>
        `;
    }

    starterSection.innerHTML = html;
}

function mainHub() {
    clearSections();
    clearGameMessage();
    partyButton.style.display = "inline-block";
    collectionButton.style.display = "inline-block";
}

// Fires off when user clicks the "Choose" button for a starter
async function chooseStarter(speciesId) {
    try {
        // Different then the GET fetch to the backend, this is a POST request that sends 
        // the speciesId of the starter the user chose to the backend so it can be saved in the database
        const response = await fetch("/game/starter/choose/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie() // Have to have a csrftoken for POST requests to django backend
            },
            body: JSON.stringify({
                species_id: speciesId
            })
        });

        const data = await response.json();

        // If the response from the backend is not ok, it means there was an error with choosing the starter, so we show an error message to the user
        if (!response.ok) {
            showGameMessage("Could not choose starter.");
            return;
        }

        starterSection.innerHTML = ""; // Clears the starter options from the screen after user chooses a starter
        showGameMessage(`Starter chosen successfully, you chose ${data.starter.name}!!!!`);
        nextButton.style.display = "inline-block"; // Shows the "Next" button that allows user to continue to the main hub of the game after choosing a starter
    } 
    // If there's an error with the fetch request to the backend
    catch (error) {
        showGameMessage("Something went wrong while choosing starter, please reload page");
        console.log(error);
    }
}

async function loadParty() {
    try {
        const response = await fetch("/game/party/");
        const data = await response.json();

        if (partyButton.textContent === "Show Party") {
            showParty(data.party);
            partyButton.textContent = "Hide Party";
        } else {
            partySection.innerHTML = "";
            partyButton.textContent = "Show Party";
        }
    } catch (error) {
        showGameMessage("Could not load party.");
        console.log(error);
    }
}

async function loadCollection() {
    try {
        const response = await fetch("/game/collection/");
        const data = await response.json();

        if (collectionButton.textContent === "Show Collection") {
            showCollection(data.collection);
            collectionButton.textContent = "Hide Collection";
        } else {
            collectionSection.innerHTML = "";
            collectionButton.textContent = "Show Collection";
        }
    } catch (error) {
        showGameMessage("Could not load collection.");
        console.log(error);
    }
}

function showParty(party) {
    let html = "<h4>Your Party</h4>";

    // Should never happen that party is null because we create a party for the user when they register,
    // but just in case we check if it's empty and show a message to the user if they don't have any Lucids in their party yet
    if (party.length === 0) {
        html += "<p>You do not have any Lucids in your party yet.</p>";
        partySection.innerHTML = html;
        return;
    }

    for (let i = 0; i < party.length; i++) {
        const lucid = party[i];

        html += `
            <div style="border:1px solid white; padding:10px; margin-bottom:10px;">
                <p><strong>${lucid.name}</strong></p>
                <p>Level: ${lucid.level}</p>
                <p>Types: ${lucid.types.join(", ")}</p>
                <p>HP: ${lucid.current_hp}/${lucid.stats.hp}</p>
                <p>Attack: ${lucid.stats.attack}</p>
                <p>Speed: ${lucid.stats.speed}</p>
                <p>Party Slot: ${lucid.party_slot}</p>
            </div>
        `;
    }

    partySection.innerHTML = html;
}

function showCollection(collection) {
    let html = "<h4>Your Collection</h4>";

    // Should also never happen, but just incase
    if (collection.length === 0) {
        html += "<p>You do not own any Lucids yet.</p>";
        collectionSection.innerHTML = html;
        return;
    }

    for (let i = 0; i < collection.length; i++) {
        const lucid = collection[i];

        html += `
            <div style="border:1px solid white; padding:10px; margin-bottom:10px;">
                <p><strong>${lucid.name}</strong></p>
                <p>Level: ${lucid.level}</p>
                <p>Types: ${lucid.types.join(", ")}</p>
                <p>HP: ${lucid.current_hp}/${lucid.stats.hp}</p>
                <p>Attack: ${lucid.stats.attack}</p>
                <p>Speed: ${lucid.stats.speed}</p>
            </div>
        `;
    }

    collectionSection.innerHTML = html;
}

loadStarterData();